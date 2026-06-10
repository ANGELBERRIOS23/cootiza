import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase de COOITZA para el servidor (Server Components, Route
 * Handlers, Server Actions). Lee/escribe la sesión del usuario vía cookies,
 * respetando RLS con el JWT del usuario logueado.
 *
 * Para operaciones administrativas que deben saltarse RLS, usar
 * `createCooitzaAdminClient()` (service_role) — solo en código server.
 */
export async function createCooitzaServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll desde un Server Component puede fallar (read-only). El
            // middleware refresca la sesión, así que es seguro ignorarlo acá.
          }
        },
      },
    },
  );
}
