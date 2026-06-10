"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";

export type OnboardingResult = { ok: true } | { ok: false; error: string };

/**
 * Onboarding del promotor: elige una de las agencias EXISTENTES (no puede crear).
 * El promotor no puede auto-asignarse agency_id por RLS (lo bloquea el trigger
 * guard_profile_privilege), así que validamos su identidad y la agencia, y
 * escribimos con service_role solo sobre su PROPIA fila.
 */
export async function completeOnboarding(agencyId: string): Promise<OnboardingResult> {
  const parsed = z.string().uuid().safeParse(agencyId);
  if (!parsed.success) return { ok: false, error: "Elegí una agencia válida." };

  const supabase = await createCooitzaServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Iniciá de nuevo." };

  // Validar que sea un promotor aprobado (RLS deja leer su propia fila).
  const { data: me } = await supabase
    .from("profiles")
    .select("role, status, agency_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "promoter") return { ok: false, error: "Este paso es solo para promotores." };
  if (me.status !== "active") return { ok: false, error: "Tu cuenta aún no está aprobada." };

  // La agencia debe existir y estar activa (no puede inventarla).
  const admin = createCooitzaAdminClient();
  const { data: agency } = await admin
    .from("agencies")
    .select("id")
    .eq("id", parsed.data)
    .eq("is_active", true)
    .maybeSingle();
  if (!agency) return { ok: false, error: "Esa agencia no existe o está inactiva." };

  const { error } = await admin.from("profiles").update({ agency_id: parsed.data }).eq("id", user.id);
  if (error) return { ok: false, error: "No se pudo guardar. Intentá de nuevo." };

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "promoter:onboarding_agency",
    target_table: "profiles",
    target_id: user.id,
    after: { agency_id: parsed.data },
  });

  revalidatePath("/portal");
  return { ok: true };
}
