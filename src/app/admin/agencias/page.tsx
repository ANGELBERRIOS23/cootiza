import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ActionButton } from "@/components/admin/action-button";
import { CreateAgencyForm } from "@/components/admin/create-agency-form";
import { CreateSupervisorModal } from "@/components/admin/create-supervisor-modal";
import { setAgencyActive } from "@/lib/admin/agencies";

export const metadata = { title: "Agencias — Cooitza Admin" };

type Agency = { id: string; name: string; region: string; is_active: boolean };
type Supervisor = { id: string; full_name: string; agency_id: string | null; supervised_region: string | null; status: string };

export default async function AdminAgenciasPage() {
  const supabase = await createCooitzaServerClient();
  const [{ data: agencies }, { data: supervisors }] = await Promise.all([
    supabase.from("agencies").select("id, name, region, is_active").order("region").order("name"),
    supabase.from("profiles").select("id, full_name, agency_id, supervised_region, status").eq("role", "supervisor").order("full_name"),
  ]);

  const ags = (agencies ?? []) as Agency[];
  const sups = (supervisors ?? []) as Supervisor[];
  const agencyName = new Map(ags.map((a) => [a.id, a.name] as const));

  // Agrupar agencias por región.
  const byRegion = new Map<string, Agency[]>();
  for (const a of ags) {
    if (!byRegion.has(a.region)) byRegion.set(a.region, []);
    byRegion.get(a.region)!.push(a);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black tracking-tight text-slate-900">Agencias y supervisores</h1>
        <div className="flex gap-2">
          <CreateSupervisorModal agencies={ags.map((a) => ({ id: a.id, name: a.name, region: a.region }))} />
        </div>
      </div>

      <CreateAgencyForm />

      {/* Supervisores */}
      <Card className="overflow-hidden">
        <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
          Supervisores ({sups.length})
        </h2>
        {sups.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">Aún no hay supervisores. Creá uno con “Nuevo supervisor”.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sups.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate text-sm font-medium text-slate-800">{s.full_name || "(sin nombre)"}</span>
                <Badge tone={s.supervised_region ? "blue" : "brand"}>
                  {s.supervised_region ? `Región ${s.supervised_region}` : `Agencia ${agencyName.get(s.agency_id ?? "") ?? "—"}`}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Agencias por región */}
      {ags.length === 0 ? (
        <EmptyState emoji="🏢" title="Aún no hay agencias" description="Creá la primera con el botón “Nueva agencia”." />
      ) : (
        <div className="space-y-4">
          {[...byRegion.entries()].map(([region, list]) => (
            <Card key={region} className="overflow-hidden">
              <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
                {region} ({list.length})
              </h2>
              <ul className="divide-y divide-slate-100">
                {list.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="truncate text-sm font-medium text-slate-800">{a.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge tone={a.is_active ? "green" : "neutral"}>{a.is_active ? "Activa" : "Inactiva"}</Badge>
                      <ActionButton action={setAgencyActive.bind(null, a.id, !a.is_active)} variant="ghost">
                        {a.is_active ? "Desactivar" : "Activar"}
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
