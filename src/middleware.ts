import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: refresca el token de Supabase en cada request (necesario para
 * que las cookies de sesión no expiren) y protege las áreas privadas.
 *
 * Reglas:
 *  - `/portal/*` requiere sesión.
 *  - `/admin/*`  requiere sesión (la verificación de ROL admin se hace además
 *    server-side en el layout de admin; aquí solo cortamos sin sesión).
 *  - Rutas públicas (`/`, `/paquetes`, `/login`, `/auth/*`) pasan libres.
 *
 * La verificación fina de rol/status vive en los layouts server-side; el
 * middleware solo evita renderizar áreas privadas sin sesión.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: getUser() refresca la sesión. No usar getSession() acá.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPortal = path.startsWith("/portal");
  const isAdmin = path.startsWith("/admin");

  if ((isPortal || isAdmin) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Corre en todo salvo assets estáticos e imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
