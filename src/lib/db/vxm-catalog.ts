import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente para leer el catálogo de paquetes desde la BD de VXM (anon key,
 * público, read-only). Filtra por is_public_cooitza = true.
 *
 * Degradación elegante: si las env de VXM no están configuradas, devuelve null
 * y las funciones del repositorio retornan listas vacías sin romper el portal.
 * (Alan pega las keys de VXM cuando quiera y el catálogo se activa solo.)
 */
let cached: SupabaseClient | null | undefined;

export function getVxmCatalogClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_VXM_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_VXM_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (typeof window === "undefined") {
      console.warn("[catalog] VXM env no configurada — el catálogo mostrará vacío.");
    }
    cached = null;
    return null;
  }
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function isCatalogConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VXM_SUPABASE_URL && process.env.NEXT_PUBLIC_VXM_SUPABASE_ANON_KEY,
  );
}
