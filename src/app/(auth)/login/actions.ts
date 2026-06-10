"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
  next: z.string().optional(),
});

export type LoginState = { error?: string } | undefined;

/**
 * Login con email + contraseña. NO hay registro público: las cuentas las crea
 * el admin. Si el usuario no existe o la contraseña es incorrecta, devolvemos
 * un mensaje genérico (no revelar si el correo existe).
 */
export async function loginWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createCooitzaServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensaje genérico — no revelar si el correo existe.
    return { error: "Correo o contraseña incorrectos." };
  }

  const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/portal";
  redirect(next);
}
