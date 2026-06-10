"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";
import { REGIONS } from "@/lib/regions";

export type AgencyResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || !isAdminRole(profile.realRole)) throw new Error("No autorizado.");
  return createCooitzaAdminClient();
}

const agencySchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(120),
  region: z.enum(REGIONS as unknown as [string, ...string[]]),
});

export async function createAgency(input: unknown): Promise<AgencyResult> {
  try {
    const admin = await requireAdmin();
    const d = agencySchema.parse(input);
    const { error } = await admin.from("agencies").insert({ name: d.name, region: d.region });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Ya existe una agencia con ese nombre." };
      throw error;
    }
    await admin.from("audit_log").insert({ action: "agency:create", target_table: "agencies", after: d });
    revalidatePath("/admin/agencias");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "No se pudo crear la agencia." };
  }
}

export async function setAgencyActive(id: string, active: boolean): Promise<AgencyResult> {
  try {
    const admin = await requireAdmin();
    const { error } = await admin.from("agencies").update({ is_active: active }).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/agencias");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
