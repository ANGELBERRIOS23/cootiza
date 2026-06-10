import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Clientes de la BD de la Plataforma VXM (proyecto fuyqhcswcluvozkfluwg).
 * VXM es la fuente de verdad del catálogo, leads CRM, pipeline y rendimiento.
 *
 * "server-only": estos clientes NUNCA deben usarse desde el navegador. El
 * catálogo público que hoy lee con anon desde el cliente seguirá en su propio
 * módulo; estos son para lógica server (leer pipeline, escribir leads).
 */

/**
 * Cliente VXM read-only con anon key. Para leer catálogo/pipeline público.
 * RLS de VXM aplica.
 */
export function createVxmReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_VXM_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_VXM_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Cliente VXM con service_role — SALTA RLS de VXM. Para ESCRIBIR leads en
 * crm_leads y leer pipeline/rendimiento sin restricción.
 *
 * ⚠️ El service_role de VXM da acceso total a la BD de la agencia. Vive SOLO
 * en env server de Vercel. Se usa en Fase 3 (leads) en adelante.
 */
export function createVxmAdminClient() {
  const serviceKey = process.env.VXM_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "VXM_SUPABASE_SERVICE_ROLE_KEY no configurada — requerida para escribir leads en VXM.",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_VXM_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
