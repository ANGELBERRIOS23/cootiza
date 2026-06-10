import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getStageMap, stageTone } from "@/lib/leads/stages";
import { getPublishedPackages } from "@/lib/db/package-repository";
import { Badge, Card, EmptyState, ButtonLink } from "@/components/ui";
import { NewClientModal } from "@/components/portal/new-client-modal";

export const metadata = { title: "Mis clientes — Portal Cooitza" };

type LeadRow = {
  id: string;
  client_name: string;
  client_phone: string;
  package_title: string | null;
  current_stage: string;
  stage_updated_at: string | null;
  sync_status: string;
  created_at: string;
};

export default async function MisLeadsPage() {
  const profile = await getSessionProfile();
  const supabase = await createCooitzaServerClient();

  const [{ data: leads }, stageMap, packages] = await Promise.all([
    supabase
      .from("lead_mirror")
      .select("id, client_name, client_phone, package_title, current_stage, stage_updated_at, sync_status, created_at")
      .eq("promoter_id", profile!.id)
      .order("created_at", { ascending: false })
      .limit(200),
    getStageMap(),
    getPublishedPackages(),
  ]);

  const rows = (leads ?? []) as LeadRow[];
  const pickerPackages = packages.map((p) => ({
    id: p.id,
    name: p.name,
    destination: p.destination,
    coverImage: p.coverImage,
    basePrice: p.basePrice,
  }));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mis clientes</h1>
          <p className="text-sm text-slate-500">Seguí en qué etapa va cada cliente que registraste.</p>
        </div>
        <NewClientModal packages={pickerPackages} />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          emoji="📇"
          title="Todavía no registraste clientes"
          description="Cuando registres un cliente interesado desde el catálogo, va a aparecer acá con su etapa."
          action={<ButtonLink href="/portal/catalogo">Ver catálogo</ButtonLink>}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((lead) => {
            const meta = stageMap[lead.current_stage];
            return (
              <Card key={lead.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{lead.client_name}</p>
                    <p className="text-xs text-slate-500">{lead.client_phone}</p>
                    {lead.package_title ? (
                      <p className="mt-0.5 truncate text-xs text-slate-400">🧳 {lead.package_title}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={stageTone(meta)}>{meta?.display_name ?? "Registrado"}</Badge>
                    {lead.sync_status === "pending" || lead.sync_status === "failed" ? (
                      <p className="mt-1 text-[10px] text-amber-600">⏳ enviando…</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  <span>Registrado {fmtDate(lead.created_at)}</span>
                  <Link href={`/portal/mis-leads/${lead.id}`} className="font-medium text-brand-600 hover:underline">
                    Ver detalle →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("es-GT", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}
