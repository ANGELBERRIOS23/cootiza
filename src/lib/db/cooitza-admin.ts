import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase de COOITZA con service_role — SALTA RLS.
 *
 * ⚠️ SOLO server. El import "server-only" hace que el build FALLE si este
 * módulo se importa desde un Client Component, evitando filtrar el service_role
 * al navegador.
 *
 * Usar únicamente para operaciones administrativas que RLS no permite desde el
 * JWT del usuario (ej. crear el profile en el trigger de signup falla, ajustes
 * de admin, escritura en ledger de puntos).
 */
export function createCooitzaAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no configurada — requerida para operaciones admin de Cooitza.",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
