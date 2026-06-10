"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";

export type StageResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const p = await getSessionProfile();
  if (!p || !isAdminRole(p.realRole)) throw new Error("No autorizado.");
  return createCooitzaAdminClient();
}

/** Editar el nombre visible y las banderas de una etapa del pipeline. */
export async function updateStage(
  id: string,
  patch: { display_name?: string; is_won?: boolean; is_terminal?: boolean },
): Promise<StageResult> {
  try {
    const admin = await requireAdmin();
    const upd: Record<string, unknown> = {};
    if (patch.display_name !== undefined) upd.display_name = patch.display_name.trim() || "Etapa";
    if (patch.is_won !== undefined) upd.is_won = patch.is_won;
    if (patch.is_terminal !== undefined) upd.is_terminal = patch.is_terminal;
    if (Object.keys(upd).length === 0) return { ok: true };
    const { error } = await admin.from("pipeline_stage_map").update(upd).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/configuracion");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "No se pudo guardar la etapa." };
  }
}
