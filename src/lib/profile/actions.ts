"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  avatar_url: z.string().trim().url().optional().or(z.literal("")),
});

export type ProfileResult = { ok: true } | { ok: false; error: string };

/**
 * Actualiza el perfil propio (nombre, teléfono, foto). Corre con la sesión del
 * usuario: RLS permite editar su fila y el GRANT por columna (0008/0009) limita
 * a full_name/phone/avatar_url. Sirve igual para promotor y admin.
 */
export async function updateMyProfile(input: unknown): Promise<ProfileResult> {
  const supabase = await createCooitzaServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const d = schema.safeParse(input);
  if (!d.success) return { ok: false, error: d.error.issues[0]?.message ?? "Datos inválidos." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: d.data.full_name,
      phone: d.data.phone || null,
      avatar_url: d.data.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "No se pudo guardar el perfil." };

  revalidatePath("/portal");
  revalidatePath("/admin");
  return { ok: true };
}
