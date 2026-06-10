"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";
import { sendEmail, emailLayout } from "@/lib/email/resend";

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Verifica que el caller sea admin y devuelve el admin client (service_role). */
async function requireAdmin() {
  const profile = await getSessionProfile();
  // realRole: respeta el rol real aunque el admin esté impersonando a un promotor.
  if (!profile || !isAdminRole(profile.realRole)) {
    throw new Error("No autorizado.");
  }
  return { profile, admin: createCooitzaAdminClient() };
}

/** Resuelve el email (auth.users) + nombre (profiles) de un promotor. */
async function promoterContact(
  admin: SupabaseClient,
  promoterId: string,
): Promise<{ email: string | null; name: string }> {
  const [{ data: u }, { data: p }] = await Promise.all([
    admin.auth.admin.getUserById(promoterId),
    admin.from("profiles").select("full_name").eq("id", promoterId).maybeSingle(),
  ]);
  return { email: u?.user?.email ?? null, name: (p?.full_name as string) || "promotor" };
}

async function audit(action: string, target_table: string, target_id: string, after?: unknown) {
  try {
    const { profile, admin } = await requireAdmin();
    await admin.from("audit_log").insert({
      actor_id: profile.id,
      action,
      target_table,
      target_id,
      after: after ?? null,
    });
  } catch {
    /* el audit no debe bloquear la acción principal */
  }
}

function wrap(fn: () => Promise<void>): Promise<AdminResult> {
  return fn()
    .then(() => ({ ok: true }) as AdminResult)
    .catch((e: Error) => {
      const msg = e.message.includes("SUPABASE_SERVICE_ROLE_KEY")
        ? "Falta configurar SUPABASE_SERVICE_ROLE_KEY (en .env.local o Vercel) para acciones admin."
        : e.message || "Error en la operación.";
      return { ok: false, error: msg };
    });
}

// --- Promotores --------------------------------------------------------------
export async function setPromoterStatus(
  promoterId: string,
  status: "active" | "suspended" | "pending_approval",
): Promise<AdminResult> {
  return wrap(async () => {
    const { admin } = await requireAdmin();
    const { error } = await admin
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", promoterId);
    if (error) throw error;
    await audit(`promoter_status:${status}`, "profiles", promoterId, { status });

    // Aviso al promotor cuando se activa su cuenta (degradación: si no hay
    // Resend configurado, no pasa nada). Nunca bloquea la acción principal.
    if (status === "active") {
      try {
        const { email, name } = await promoterContact(admin, promoterId);
        if (email) {
          const url = process.env.NEXT_PUBLIC_SITE_URL ?? "";
          await sendEmail({
            to: email,
            subject: "Tu acceso al Portal de Promotores está activo",
            html: emailLayout({
              heading: `¡Hola ${name}!`,
              body: "Tu cuenta fue aprobada. Ya podés ingresar al portal, registrar clientes y empezar a sumar puntos por cada venta.",
              ctaText: "Ingresar al portal",
              ctaHref: `${url}/login`,
            }),
          });
        }
      } catch {
        /* el email es best-effort */
      }
    }
    revalidatePath("/admin/promotores");
  });
}

// --- Canjes ------------------------------------------------------------------
export async function approveRedemption(redemptionId: string): Promise<AdminResult> {
  return wrap(async () => {
    const { admin } = await requireAdmin();
    // RPC transaccional: descuenta puntos + stock. Lo invoca el service_role,
    // pero el RPC chequea is_admin() — service_role pasa el guard via 0007.
    const { error } = await admin.rpc("approve_redemption", { p_redemption_id: redemptionId });
    if (error) throw error;
    await audit("redemption:approve", "redemptions", redemptionId);

    // Aviso al promotor (best-effort, degradable).
    try {
      const { data: red } = await admin
        .from("redemptions")
        .select("promoter_id, rewards(title)")
        .eq("id", redemptionId)
        .maybeSingle();
      if (red?.promoter_id) {
        const { email, name } = await promoterContact(admin, red.promoter_id);
        const rw = red.rewards as { title?: string } | { title?: string }[] | null;
        const title = (Array.isArray(rw) ? rw[0]?.title : rw?.title) ?? "tu premio";
        if (email) {
          await sendEmail({
            to: email,
            subject: "Tu canje fue aprobado 🎉",
            html: emailLayout({
              heading: `¡Felicidades ${name}!`,
              body: `Tu canje de <strong>${title}</strong> fue aprobado. El equipo se pondrá en contacto para coordinar la entrega.`,
            }),
          });
        }
      }
    } catch {
      /* best-effort */
    }
    revalidatePath("/admin/canjes");
  });
}

export async function setRedemptionStatus(
  redemptionId: string,
  status: "delivered" | "rejected" | "cancelled",
  adminNotes?: string,
): Promise<AdminResult> {
  return wrap(async () => {
    const { admin, profile } = await requireAdmin();
    // Si se rechaza/cancela un canje YA aprobado, reversar puntos al promotor.
    const { data: red } = await admin
      .from("redemptions")
      .select("promoter_id, status, points_cost_snapshot")
      .eq("id", redemptionId)
      .single();
    if (red && red.status === "approved" && (status === "rejected" || status === "cancelled")) {
      await admin.from("points_ledger").insert({
        promoter_id: red.promoter_id,
        delta: red.points_cost_snapshot,
        reason: "reversal",
        redemption_id: redemptionId,
        adjusted_by: profile.id,
        idempotency_key: `reversal:${redemptionId}`,
        description: "Reverso por canje rechazado/cancelado",
      });
    }
    const { error } = await admin
      .from("redemptions")
      .update({ status, admin_notes: adminNotes ?? null, handled_by: profile.id, handled_at: new Date().toISOString() })
      .eq("id", redemptionId);
    if (error) throw error;
    await audit(`redemption:${status}`, "redemptions", redemptionId);
    revalidatePath("/admin/canjes");
  });
}

// --- Premios -----------------------------------------------------------------
const rewardSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  points_cost: z.coerce.number().int().positive(),
  stock: z.union([z.coerce.number().int().min(0), z.literal("")]).optional(),
  is_active: z.boolean().optional(),
  display_order: z.coerce.number().int().optional(),
});

export async function upsertReward(input: unknown): Promise<AdminResult> {
  return wrap(async () => {
    const { admin } = await requireAdmin();
    const d = rewardSchema.parse(input);
    const payload = {
      title: d.title,
      description: d.description || null,
      image_url: d.image_url || null,
      points_cost: d.points_cost,
      stock: d.stock === "" || d.stock === undefined ? null : Number(d.stock),
      is_active: d.is_active ?? true,
      display_order: d.display_order ?? 0,
    };
    if (d.id) {
      const { error } = await admin.from("rewards").update(payload).eq("id", d.id);
      if (error) throw error;
      await audit("reward:update", "rewards", d.id, payload);
    } else {
      const { data, error } = await admin.from("rewards").insert(payload).select("id").single();
      if (error) throw error;
      await audit("reward:create", "rewards", data!.id, payload);
    }
    revalidatePath("/admin/premios");
  });
}

export async function setRewardActive(rewardId: string, isActive: boolean): Promise<AdminResult> {
  return wrap(async () => {
    const { admin } = await requireAdmin();
    const { error } = await admin.from("rewards").update({ is_active: isActive }).eq("id", rewardId);
    if (error) throw error;
    await audit(`reward:${isActive ? "activate" : "deactivate"}`, "rewards", rewardId);
    revalidatePath("/admin/premios");
  });
}

// --- Configuración + reglas de puntos ----------------------------------------
export async function updateSetting(key: string, value: unknown): Promise<AdminResult> {
  return wrap(async () => {
    const { admin } = await requireAdmin();
    const { error } = await admin
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    await audit("setting:update", "app_settings", key, value);
    revalidatePath("/admin/configuracion");
  });
}

export async function updatePointsRatio(ratio: number): Promise<AdminResult> {
  return wrap(async () => {
    const { admin } = await requireAdmin();
    if (!(ratio >= 0)) throw new Error("Ratio inválido.");
    // Desactiva las reglas previas y crea una nueva activa (historial intacto).
    await admin.from("points_rules").update({ is_active: false }).eq("is_active", true);
    const { error } = await admin
      .from("points_rules")
      .insert({ points_per_q_yield: ratio, is_active: true, note: "Actualizado desde el panel admin" });
    if (error) throw error;
    await audit("points_ratio:update", "points_rules", "ratio", { ratio });
    revalidatePath("/admin/configuracion");
  });
}

// --- Ajuste manual de puntos -------------------------------------------------
export async function adjustPoints(promoterId: string, delta: number, reason: string): Promise<AdminResult> {
  return wrap(async () => {
    const { admin, profile } = await requireAdmin();
    if (!Number.isInteger(delta) || delta === 0) throw new Error("Ingresá un monto distinto de cero.");
    if (!reason.trim()) throw new Error("El motivo es obligatorio.");
    const { error } = await admin.from("points_ledger").insert({
      promoter_id: promoterId,
      delta,
      reason: "admin_adjustment",
      adjusted_by: profile.id,
      idempotency_key: `adjust:${promoterId}:${Date.now()}`,
      description: reason.trim(),
    });
    if (error) throw error;
    await audit("points:adjust", "points_ledger", promoterId, { delta, reason });
    revalidatePath("/admin/promotores");
  });
}
