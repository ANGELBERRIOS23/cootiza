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
  const markFailed = (msg: string) =>
    cooitza
      .from("lead_mirror")
      .update({ sync_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", mirrorId)
      .then(() => {
        throw new Error(msg);
      });

  // Asesores con CRM (para asignación y para el dueño por defecto del cliente).
  const { data: advisors } = await vxm
    .from("profiles")
    .select("id, role")
    .eq("crm_access", true)
    .limit(200);
  const advisorIds = (advisors ?? []).map((a) => a.id as string);

  // Modo de asignación + asesores elegibles (config en Cooitza app_settings).
  const { data: settingsRows } = await cooitza
    .from("app_settings")
    .select("key, value")
    .in("key", ["lead_assignment_mode", "cooitza_advisor_ids"]);
  const mode = String((settingsRows ?? []).find((r) => r.key === "lead_assignment_mode")?.value ?? "manual").replace(/"/g, "");
  const eligibleRaw = (settingsRows ?? []).find((r) => r.key === "cooitza_advisor_ids")?.value;
  const eligibleIds: string[] = Array.isArray(eligibleRaw) ? (eligibleRaw as string[]) : [];
  // Pool: intersección con asesores CRM reales; si no hay config, todos.
  const pool = eligibleIds.length > 0 ? advisorIds.filter((id) => eligibleIds.includes(id)) : advisorIds;
  let assignedTo: string | null = null;
  if (mode === "random" && pool.length > 0) {
    assignedTo = pool[Math.floor(Math.random() * pool.length)];
  }

  // Dueño del cliente: clients.owner_user_id es NOT NULL. Prioridad:
  //   asesor asignado → VXM_DEFAULT_OWNER_ID (env) → primer admin con CRM → primer asesor.
  const adminOwner = (advisors ?? []).find((a) => a.role === "admin" || a.role === "superadmin")?.id as
    | string
    | undefined;
  const ownerId =
    assignedTo ?? process.env.VXM_DEFAULT_OWNER_ID ?? adminOwner ?? advisorIds[0] ?? null;

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
    if (!ownerId) {
      return markFailed("VXM no tiene asesores con CRM para asignar como dueño del cliente.");
    }
    const { data: created, error: clientErr } = await vxm
      .from("clients")
      .insert({
        full_name: lead.client_name,
        phone: localPhone,
        email: lead.client_email,
        owner_user_id: ownerId,
      })
      .select("id")
      .single();
    if (clientErr || !created?.id) {
      return markFailed(clientErr?.message ?? "VXM no creó el cliente.");
    }
    clientId = created.id;
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
    return markFailed(leadErr?.message ?? "VXM no devolvió id de lead.");
  }

  // Notificar al asesor asignado (best-effort) que llegó un lead de Cooitza.
  if (assignedTo) {
    try {
      await vxm.from("notifications").insert({
        user_id: assignedTo,
        title: "Nuevo lead de Cooitza",
        message: `Se te asignó a ${lead.client_name} (lead de Cooitza). Revisalo en el CRM.`,
        notification_type: "cooitza_lead",
        link: `/crm/leads/${vxmLead.id}`,
      });
    } catch (e) {
      console.warn("[leads] notificación a VXM falló:", (e as Error).message);
    }
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
    .select("vxm_stage_code, display_name, is_won");
  const wonCodes = new Set((stageMap ?? []).filter((s) => s.is_won).map((s) => s.vxm_stage_code));
  const stageLabel = new Map((stageMap ?? []).map((s) => [s.vxm_stage_code, s.display_name as string]));

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
    .select("id, promoter_id, vxm_lead_id, vxm_opportunity_id, current_stage, points_awarded, client_name")
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
        // Notificar al promotor el avance de su cliente.
        await cooitza.from("notifications").insert({
          user_id: lm.promoter_id,
          title: "Tu cliente avanzó de etapa",
          body: `${lm.client_name ?? "Tu cliente"} ahora está en “${stageLabel.get(opp.stage) ?? opp.stage}”.`,
          kind: "stage",
          link: `/portal/mis-leads/${lm.id}`,
        });
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
            await cooitza.from("notifications").insert({
              user_id: lm.promoter_id,
              title: `¡Ganaste ${pts} puntos! ⭐`,
              body: `Se cerró la venta de ${lm.client_name ?? "tu cliente"}.`,
              kind: "points",
              link: "/portal/puntos",
            });
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
