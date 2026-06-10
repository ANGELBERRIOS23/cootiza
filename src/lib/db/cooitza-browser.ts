import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase de COOITZA para el navegador (Client Components).
 * Usa el anon key (público). RLS protege los datos. NUNCA usar service_role acá.
 */
export function createCooitzaBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
