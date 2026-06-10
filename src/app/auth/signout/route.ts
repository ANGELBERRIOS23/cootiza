import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { IMPERSONATION_COOKIE } from "@/lib/auth/session";

/**
 * Cierra la sesión y vuelve al login. POST para evitar logout por prefetch.
 *
 * IMPORTANTE: el borrado de cookies de @supabase/ssr debe escribirse sobre el
 * MISMO objeto `response` que se devuelve (el redirect). Si se usa el store de
 * next/headers, las cookies limpiadas NO viajan en la redirección y la sesión
 * sobrevive → el botón "no hace nada" (login rebota de vuelta al portal).
 */
export async function POST(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`, { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.signOut();
  // Si había impersonación activa, también la limpiamos.
  response.cookies.delete(IMPERSONATION_COOKIE);
  return response;
}
