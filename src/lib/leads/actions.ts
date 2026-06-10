"use server";

import { z } from "zod";
import { getSessionProfile } from "@/lib/auth/session";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";
import { pushLeadToVxm } from "@/lib/leads/sync";

const leadSchema = z.object({
  client_name: z.string().trim().min(3, "Ingresá el nombre del cliente").max(120),
  client_phone: z
    .string()
    .trim()
    .min(8, "Teléfono inválido")
    .max(20)
    .regex(/^[+]?[\d\s-]+$/, "Teléfono inválido"),
  client_email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  package_vxm_id: z.string().optional(),
  package_title: z.string().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateLeadResult =
  | { ok: true; duplicateWarning?: boolean }
  | { ok: false; error: string };

/** Normaliza teléfono a E.164 con default +502 (Guatemala). */
function normalizePhoneGT(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (raw.trim().startsWith("+")) return "+" + digits;
  if (digits.length === 8) return "+502" + digits; // móvil GT
  if (digits.startsWith("502")) return "+" + digits;
  return "+" + digits;
}

/**
 * Crea un lead. Estrategia BD compartida con degradación:
 *  1. Inserta el espejo en Cooitza (lead_mirror) — siempre funciona.
 *  2. Si VXM está configurado (service_role), escribe el lead en crm_leads de
 *     VXM con asignación según app_settings.lead_assignment_mode (manual|random)
 *     y marca sync_status='confirmed'. Si VXM no está o falla, queda 'pending'
 *     y un cron lo reintenta (el promotor nunca pierde el lead).
 */
export async function createLead(input: unknown): Promise<CreateLeadResult> {
  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: "No autenticado." };
  if (profile.status !== "active") return { ok: false, error: "Tu cuenta no está activa." };

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;
  const phone = normalizePhoneGT(data.client_phone);

  const cooitza = createCooitzaAdminClient();

  // Rate limit: máx N leads por promotor por hora (config en app_settings).
  const { data: rateRow } = await cooitza
    .from("app_settings")
    .select("value")
    .eq("key", "lead_rate_limit_per_hour")
    .maybeSingle();
  const limit = Number(rateRow?.value ?? 30);
  const sinceHour = new Date(Date.now() - 3600_000).toISOString();
  const { count: recentCount } = await cooitza
    .from("lead_mirror")
    .select("id", { count: "exact", head: true })
    .eq("promoter_id", profile.id)
    .gte("created_at", sinceHour);
  if ((recentCount ?? 0) >= limit) {
    return { ok: false, error: `Alcanzaste el límite de ${limit} clientes por hora. Intentá más tarde.` };
  }

  // Anti-duplicado: mismo promotor + mismo teléfono en los últimos 14 días.
  const since14 = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data: dup } = await cooitza
    .from("lead_mirror")
    .select("id")
    .eq("promoter_id", profile.id)
    .eq("client_phone", phone)
    .gte("created_at", since14)
    .limit(1)
    .maybeSingle();

  // Insertar espejo local (siempre).
  const { data: mirror, error: mirrorErr } = await cooitza
    .from("lead_mirror")
    .insert({
      promoter_id: profile.id,
      client_name: data.client_name,
      client_phone: phone,
      client_email: data.client_email || null,
      package_vxm_id: data.package_vxm_id || null,
      package_title: data.package_title || null,
      notes: data.notes || null,
      sync_status: "pending",
    })
    .select("id")
    .single();

  if (mirrorErr || !mirror) {
    return { ok: false, error: "No se pudo registrar el cliente. Intentá de nuevo." };
  }

  // Intentar enviar a VXM (degradación: si no está configurado, queda pending
  // y el cron de sync lo reintenta — el promotor nunca pierde el lead).
  await pushLeadToVxm(mirror.id, {
    client_name: data.client_name,
    client_phone: phone,
    client_email: data.client_email || null,
    notes: data.notes || null,
    promoter_code: profile.id,
  }).catch((e) => {
    console.warn("[leads] push a VXM falló (queda pending):", (e as Error).message);
  });

  return { ok: true, duplicateWarning: Boolean(dup) };
}
