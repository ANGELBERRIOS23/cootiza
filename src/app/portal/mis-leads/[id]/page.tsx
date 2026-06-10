import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getStageMap, stageTone } from "@/lib/leads/stages";
import { Badge, Card } from "@/components/ui";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getSessionProfile();
  const supabase = await createCooitzaServerClient();

  const { data: lead } = await supabase
    .from("lead_mirror")
    .select("id, promoter_id, client_name, client_phone, client_email, package_title, current_stage, created_at, notes")
    .eq("id", id)
    .maybeSingle();

  // RLS ya limita a los propios, pero validamos por las dudas.
  if (!lead || lead.promoter_id !== profile!.id) notFound();

  const [{ data: history }, stageMap] = await Promise.all([
    supabase
      .from("lead_stage_history")
      .select("from_stage, to_stage, received_at")
      .eq("lead_id", id)
      .order("received_at", { ascending: false }),
    getStageMap(),
  ]);

  const meta = stageMap[lead.current_stage];

  return (
    <div className="space-y-4">
      <Link href="/portal/mis-leads" className="text-sm text-slate-500 hover:underline">
        ← Mis clientes
      </Link>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{lead.client_name}</h1>
            <p className="text-sm text-slate-500">{lead.client_phone}</p>
            {lead.client_email ? <p className="text-sm text-slate-500">{lead.client_email}</p> : null}
          </div>
          <Badge tone={stageTone(meta)}>{meta?.display_name ?? "Registrado"}</Badge>
        </div>
        {lead.package_title ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">🧳 {lead.package_title}</p>
        ) : null}
        {lead.notes ? <p className="mt-2 text-sm text-slate-500">📝 {lead.notes}</p> : null}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-bold text-slate-800">Seguimiento</h2>
        {(history ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay cambios de etapa registrados. En cuanto el asesor avance la venta, lo vas a ver acá.
          </p>
        ) : (
          <ol className="space-y-3">
            {(history ?? []).map((h, i) => {
              const m = stageMap[h.to_stage];
              return (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{m?.display_name ?? h.to_stage}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(h.received_at).toLocaleString("es-GT", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
