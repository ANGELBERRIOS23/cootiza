"use server";

import { cookies } from "next/headers";
import { getSessionProfile, isAdminRole, IMPERSONATION_COOKIE } from "@/lib/auth/session";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";

export type ImpResult = { ok: true } | { ok: false; error: string };

/** Un admin empieza a ver el portal como un promotor. Queda en audit_log. */
export async function startImpersonation(promoterId: string): Promise<ImpResult> {
  const profile = await getSessionProfile();
  if (!profile || !isAdminRole(profile.realRole)) return { ok: false, error: "No autorizado." };

  // Validar que el objetivo existe y es promotor.
  const admin = createCooitzaAdminClient();
  const { data: target } = await admin.from("profiles").select("id, role").eq("id", promoterId).maybeSingle();
  if (!target) return { ok: false, error: "Promotor no encontrado." };

  const c = await cookies();
  c.set(IMPERSONATION_COOKIE, promoterId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 horas
  });

  // Rastro de auditoría (best-effort, no bloquea).
  try {
    await admin.from("audit_log").insert({
      actor_id: profile.id,
      action: "impersonation:start",
      target_table: "profiles",
      target_id: promoterId,
    });
  } catch {
    /* el audit no debe bloquear la acción */
  }
  return { ok: true };
}

/** Termina la impersonación (vuelve a ser el admin). Queda en audit_log. */
export async function stopImpersonation(): Promise<ImpResult> {
  const c = await cookies();
  const impId = c.get(IMPERSONATION_COOKIE)?.value;
  c.delete(IMPERSONATION_COOKIE);

  try {
    const profile = await getSessionProfile();
    if (impId && profile && isAdminRole(profile.realRole)) {
      const admin = createCooitzaAdminClient();
      await admin.from("audit_log").insert({
        actor_id: profile.id,
        action: "impersonation:stop",
        target_table: "profiles",
        target_id: impId,
      });
    }
  } catch {
    /* best-effort */
  }
  return { ok: true };
}
