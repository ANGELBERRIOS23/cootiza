import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { homePathForRole, type UserRole } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

/**
 * Login con email+password en un Route Handler (server). signInWithPassword
 * setea las cookies de sesión DIRECTO en la respuesta — sin el problema de
 * timing del login client-side (donde window.location navegaba antes de que
 * las cookies se persistieran).
 *
 * Devuelve { redirect } con el destino según rol/status, o { error } genérico.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Correo o contraseña inválidos." }, { status: 400 });
  }

  const supabase = await createCooitzaServerClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !signInData.user || !signInData.session) {
    // Mensaje genérico — no revelar si el correo existe.
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  // Leer el profile con un client que usa el access_token RECIÉN obtenido en el
  // header Authorization. No reusamos el client de @supabase/ssr porque ese
  // relee el token de las cookies de la request (que aún no tienen la sesión
  // nueva), y la query saldría sin auth → RLS la bloquearía.
  const authedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  const { data: profile, error: profileError } = await authedClient
    .from("profiles")
    .select("role, status")
    .eq("id", signInData.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "No se pudo cargar tu perfil." }, { status: 500 });
  }

  let dest: string;
  if (profile.status === "suspended") dest = "/cuenta-suspendida";
  else if (profile.status === "pending_approval") dest = "/cuenta-pendiente";
  else {
    const next = parsed.data.next;
    dest = next && next.startsWith("/") ? next : homePathForRole(profile.role as UserRole);
  }

  return NextResponse.json({ redirect: dest });
}
