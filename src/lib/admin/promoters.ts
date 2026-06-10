"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";
import { REGIONS } from "@/lib/regions";

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || !isAdminRole(profile.realRole)) throw new Error("No autorizado.");
  return { profile, admin: createCooitzaAdminClient() };
}

const promoterSchema = z.object({
  full_name: z.string().trim().min(2, "Nombre muy corto").max(120),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  agency_id: z.string().uuid().optional().nullable(),
});

export type CreatePromoterResult = { ok: true; id: string } | { ok: false; error: string };

function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already") && m.includes("registered")) return "Ese correo ya tiene una cuenta.";
  if (m.includes("password")) return "La contraseña no cumple los requisitos.";
  if (m.includes("email")) return "Correo inválido.";
  return msg || "No se pudo crear el promotor.";
}

/** Crea un promotor ya activo (alta directa por admin, sin registro público). */
export async function createPromoter(input: unknown): Promise<CreatePromoterResult> {
  try {
    const { admin } = await requireAdmin();
    const d = promoterSchema.parse(input);

    const { data: created, error } = await admin.auth.admin.createUser({
      email: d.email,
      password: d.password,
      email_confirm: true,
      user_metadata: { full_name: d.full_name },
    });
    if (error || !created.user) throw new Error(error?.message || "No se pudo crear el usuario.");

    const uid = created.user.id;
    // El trigger crea el profile; lo completamos y lo dejamos activo.
    const { error: upErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: uid,
          full_name: d.full_name,
          phone: d.phone || null,
          role: "promoter",
          status: "active",
          agency_id: d.agency_id || null,
        },
        { onConflict: "id" },
      );
    if (upErr) throw upErr;

    await admin.from("audit_log").insert({
      action: "promoter:create",
      target_table: "profiles",
      target_id: uid,
      after: { email: d.email, full_name: d.full_name },
    });

    revalidatePath("/admin/promotores");
    return { ok: true, id: uid };
  } catch (e) {
    return { ok: false, error: friendly((e as Error).message) };
  }
}

export type BulkRow = { full_name: string; email: string; password: string; phone?: string; agency_id?: string | null };
export type BulkResult = { results: { email: string; ok: boolean; error?: string }[] };

/** Crea varios promotores. Devuelve resultado por fila (no aborta todo si una falla). */
export async function createPromotersBulk(rows: BulkRow[]): Promise<BulkResult> {
  // Gate temprano (evita N llamadas si no es admin).
  await requireAdmin();
  const out: BulkResult["results"] = [];
  for (const r of rows.slice(0, 300)) {
    const res = await createPromoter(r);
    out.push({ email: r.email, ok: res.ok, error: res.ok ? undefined : res.error });
  }
  revalidatePath("/admin/promotores");
  return { results: out };
}

// --- Supervisores ------------------------------------------------------------
const supervisorSchema = z
  .object({
    full_name: z.string().trim().min(2, "Nombre muy corto").max(120),
    email: z.string().trim().toLowerCase().email("Correo inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres").max(72),
    scope: z.enum(["agency", "region"]),
    agency_id: z.string().uuid().optional().nullable(),
    region: z.enum(REGIONS as unknown as [string, ...string[]]).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.scope === "agency" && !d.agency_id) ctx.addIssue({ code: "custom", message: "Elegí una agencia.", path: ["agency_id"] });
    if (d.scope === "region" && !d.region) ctx.addIssue({ code: "custom", message: "Elegí una región.", path: ["region"] });
  });

/** Crea un supervisor (de agencia o de región), activo. */
export async function createSupervisor(input: unknown): Promise<CreatePromoterResult> {
  try {
    const { admin } = await requireAdmin();
    const d = supervisorSchema.parse(input);

    const { data: created, error } = await admin.auth.admin.createUser({
      email: d.email,
      password: d.password,
      email_confirm: true,
      user_metadata: { full_name: d.full_name },
    });
    if (error || !created.user) throw new Error(error?.message || "No se pudo crear el usuario.");

    const uid = created.user.id;
    const { error: upErr } = await admin.from("profiles").upsert(
      {
        id: uid,
        full_name: d.full_name,
        role: "supervisor",
        status: "active",
        agency_id: d.scope === "agency" ? d.agency_id : null,
        supervised_region: d.scope === "region" ? d.region : null,
      },
      { onConflict: "id" },
    );
    if (upErr) throw upErr;

    await admin.from("audit_log").insert({
      action: "supervisor:create",
      target_table: "profiles",
      target_id: uid,
      after: { email: d.email, scope: d.scope, agency_id: d.agency_id, region: d.region },
    });

    revalidatePath("/admin/agencias");
    revalidatePath("/admin/promotores");
    return { ok: true, id: uid };
  } catch (e) {
    return { ok: false, error: friendly((e as Error).message) };
  }
}

// --- Administradores ---------------------------------------------------------
const adminSchema = z.object({
  full_name: z.string().trim().min(2, "Nombre muy corto").max(120),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

/** Crea un administrador, activo. Solo un admin/superadmin puede hacerlo. */
export async function createAdmin(input: unknown): Promise<CreatePromoterResult> {
  try {
    const { admin } = await requireAdmin();
    const d = adminSchema.parse(input);

    const { data: created, error } = await admin.auth.admin.createUser({
      email: d.email,
      password: d.password,
      email_confirm: true,
      user_metadata: { full_name: d.full_name },
    });
    if (error || !created.user) throw new Error(error?.message || "No se pudo crear el usuario.");

    const uid = created.user.id;
    const { error: upErr } = await admin.from("profiles").upsert(
      { id: uid, full_name: d.full_name, role: "admin", status: "active" },
      { onConflict: "id" },
    );
    if (upErr) throw upErr;

    await admin.from("audit_log").insert({
      action: "admin:create",
      target_table: "profiles",
      target_id: uid,
      after: { email: d.email, full_name: d.full_name },
    });

    revalidatePath("/admin/promotores");
    return { ok: true, id: uid };
  } catch (e) {
    return { ok: false, error: friendly((e as Error).message) };
  }
}
