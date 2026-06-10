import "server-only";
import { createCooitzaAdminClient } from "@/lib/db/cooitza-admin";
import { createVxmAdminClient } from "@/lib/db/vxm";

/**
 * Sincronización del pipeline VXM → Cooitza (Fase 4b).
 *
 * Estrategia BD compartida con DEGRADACIÓN: si VXM no está configurado
 * (sin service_role), todo se salta sin error — el portal sigue operando con
 * los leads en estado 'pending' y este cron los reintenta cuando VXM exista.
 *
 * Qué hace cada corrida:
 *  1) Reintenta empujar a VXM los leads en 'pending'/'failed'.
 *  2) Para los leads ya enviados (vxm_lead_id), lee la oportunidad en VXM,
 *     refresca current_stage del espejo y registra el cambio en el historial.
 *  3) Cuando la oportunidad llega a una etapa GANADA, otorga puntos al
 *     promotor en base al rendimiento (quotes.agency_yield) × ratio.
 *     Idempotente por `sale:{opportunity_id}` (unique en points_ledger).
 *
 * Cadena de datos:
 *   lead_mirror.vxm_lead_id → crm_opportunities.lead_id
 *   crm_opportunities.linked_quote_id → quotes.agency_yield
 */

export function isVxmAdminConfigured(): boolean {
  return Boolean(
    process.env.VXM_SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_VXM_SUPABASE_URL,
  );
}

/**
 * Empuja un lead del espejo a VXM (crm_leads) resolviendo/creando el cliente y
 * aplicando la asignación configurada (manual|random). Marca sync_status según
 * el resultado. Lanza si VXM no responde (el llamador decide cómo reintentar).
 */
export async function pushLeadToVxm(
  mirrorId: string,
  lead: {
    client_name: string;
    client_phone: string;
    client_email: string | null;
    notes: string | null;
    promoter_code: string;
  },
): Promise<void> {
  if (!isVxmAdminConfigured()) return; // degradación elegante
  const vxm = createVxmAdminClient();
  const cooitza = createCooitzaAdminClient();

  // Resolver/crear cliente en VXM por teléfono (sin el prefijo +502).
  let clientId: string | null = null;
  const localPhone = lead.client_phone.replace(/^\+502/, "");
  const { data: existing } = await vxm
    .from("clients")
    .select("id")
    .eq("phone", localPhone)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    clientId = existing.id;
  } else {
    const { data: created } = await vxm
      .from("clients")
      .insert({ full_name: lead.client_name, phone: lead.client_phone, email: lead.client_email })
      .select("id")
      .single();
    clientId = created?.id ?? null;
  }

  // Modo de asignación (config en Cooitza app_settings).
  const { data: modeRow } = await cooitza
    .from("app_settings")
    .select("value")
    .eq("key", "lead_assignment_mode")
    .maybeSingle();
  const mode = String(modeRow?.value ?? "manual").replace(/"/g, "");
  let assignedTo: string | null = null;
  if (mode === "random") {
    const { data: advisors } = await vxm
      .from("profiles")
      .select("id")
      .eq("crm_access", true)
      .limit(100);
    if (advisors && advisors.length > 0) {
      assignedTo = advisors[Math.floor(Math.random() * advisors.length)].id;
    }
  }

  const { data: vxmLead, error: leadErr } = await vxm
    .from("crm_leads")
    .insert({
      client_id: clientId,
      status: "NUEVO",
      source: "COOITZA",
      assigned_to: assignedTo,
      notes: lead.notes,
    })
    .select("id")
    .single();

  if (leadErr || !vxmLead?.id) {
    await cooitza
      .from("lead_mirror")
      .update({ sync_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", mirrorId);
    throw new Error(leadErr?.message ?? "VXM no devolvió id de lead.");
  }

  await cooitza
    .from("lead_mirror")
    .update({ vxm_lead_id: vxmLead.id, sync_status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", mirrorId);
}

export type SyncReport = {
  ok: boolean;
  skipped?: string;
  retried: number;
  stagesUpdated: number;
  pointsAwarded: number;
  pointsTotal: number;
  errors: string[];
};

const empty = (skipped?: string): SyncReport => ({
  ok: true,
  skipped,
  retried: 0,
  stagesUpdated: 0,
  pointsAwarded: 0,
  pointsTotal: 0,
  errors: [],
});

export async function syncPipeline(): Promise<SyncReport> {
  if (!isVxmAdminConfigured()) return empty("vxm_not_configured");

  const cooitza = createCooitzaAdminClient();
  const vxm = createVxmAdminClient();
  const report = empty();

  // ---- 1) Reintentar leads pendientes/fallidos --------------------------------
  const { data: unsettled } = await cooitza
    .from("lead_mirror")
    .select("id, client_name, client_phone, client_email, notes, promoter_id")
    .in("sync_status", ["pending", "failed"])
    .limit(200);

  for (const lm of unsettled ?? []) {
    try {
      await pushLeadToVxm(lm.id, {
        client_name: lm.client_name,
        client_phone: lm.client_phone,
        client_email: lm.client_email,
        notes: lm.notes,
        promoter_code: lm.promoter_id,
      });
      report.retried++;
    } catch (e) {
      report.errors.push(`retry ${lm.id}: ${(e as Error).message}`);
    }
  }

  // ---- 2) Sincronizar etapas + 3) otorgar puntos ------------------------------
  // Etapas ganadas (config-driven desde pipeline_stage_map).
  const { data: stageMap } = await cooitza
    .from("pipeline_stage_map")
    .select("vxm_stage_code, is_won");
  const wonCodes = new Set((stageMap ?? []).filter((s) => s.is_won).map((s) => s.vxm_stage_code));

  // Ratio de puntos vigente.
  const { data: rule } = await cooitza
    .from("points_rules")
    .select("points_per_q_yield")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ratio = Number(rule?.points_per_q_yield ?? 1);

  const { data: tracked } = await cooitza
    .from("lead_mirror")
    .select("id, promoter_id, vxm_lead_id, vxm_opportunity_id, current_stage, points_awarded")
    .not("vxm_lead_id", "is", null)
    .limit(1000);

  const nowIso = new Date().toISOString();

  for (const lm of tracked ?? []) {
    try {
      const { data: opp } = await vxm
        .from("crm_opportunities")
        .select("id, stage, linked_quote_id")
        .eq("lead_id", lm.vxm_lead_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!opp) continue;

      const updates: Record<string, unknown> = {};
      if (opp.id && opp.id !== lm.vxm_opportunity_id) updates.vxm_opportunity_id = opp.id;

      if (opp.stage && opp.stage !== lm.current_stage) {
        await cooitza.from("lead_stage_history").insert({
          lead_id: lm.id,
          from_stage: lm.current_stage,
          to_stage: opp.stage,
          source: "sync",
        });
        updates.current_stage = opp.stage;
        updates.stage_updated_at = nowIso;
        report.stagesUpdated++;
      }

      if (Object.keys(updates).length > 0) {
        await cooitza.from("lead_mirror").update(updates).eq("id", lm.id);
      }

      // Otorgar puntos al cerrar la venta (primera vez que entra a etapa ganada).
      if (!lm.points_awarded && opp.stage && wonCodes.has(opp.stage) && opp.linked_quote_id) {
        const { data: quote } = await vxm
          .from("quotes")
          .select("agency_yield, total_amount")
          .eq("id", opp.linked_quote_id)
          .maybeSingle();
        const yieldQ =
          quote?.agency_yield != null ? Number(quote.agency_yield) : 0;
        const pts = Math.round(yieldQ * ratio);

        if (pts > 0) {
          const { error: ledgerErr } = await cooitza.from("points_ledger").insert({
            promoter_id: lm.promoter_id,
            delta: pts,
            reason: "sale_closed",
            lead_id: lm.id,
            description: `Venta cerrada — rendimiento Q${yieldQ.toFixed(2)} × ${ratio} pts`,
            idempotency_key: `sale:${opp.id}`,
          });
          if (!ledgerErr) {
            await cooitza.from("lead_mirror").update({ points_awarded: true }).eq("id", lm.id);
            report.pointsAwarded++;
            report.pointsTotal += pts;
          } else if (ledgerErr.code === "23505") {
            // Ya existía en el ledger (corrida concurrente): solo marcar el espejo.
            await cooitza.from("lead_mirror").update({ points_awarded: true }).eq("id", lm.id);
          } else {
            report.errors.push(`points ${lm.id}: ${ledgerErr.message}`);
          }
        }
        // Si pts === 0 (rendimiento aún no cargado), se deja sin marcar para
        // que una corrida futura lo otorgue cuando el asesor cargue el yield.
      }
    } catch (e) {
      report.errors.push(`sync ${lm.id}: ${(e as Error).message}`);
    }
  }

  return report;
}
