import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getSessionProfile } from "@/lib/auth/session";
import { getPublishedPackages } from "@/lib/db/package-repository";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { NewClientModal } from "@/components/portal/new-client-modal";

export const metadata = { title: "Mi equipo — Supervisor Cooitza" };

type Stat = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  points_balance: number;
  clients_count: number;
  last_client_at: string | null;
  agency_name: string | null;
  region: string | null;
};

export default async function SupervisorHomePage() {
  const supabase = await createCooitzaServerClient();
  const profile = await getSessionProfile();

  const [{ data }, packages] = await Promise.all([
    supabase.rpc("supervisor_promoter_stats"),
    getPublishedPackages(),
  ]);

  const team = ((data ?? []) as Stat[]).map((r) => ({ ...r, clients_count: Number(r.clients_count) }));
  const totalClients = team.reduce((s, p) => s + p.clients_count, 0);
  const totalPoints = team.reduce((s, p) => s + p.points_balance, 0);
  const scopeLabel = profile?.full_name ? `Hola, ${profile.full_name.split(" ")[0]}` : "Mi equipo";
  const pickerPackages = packages.map((p) => ({ id: p.id, name: p.name, destination: p.destination, coverImage: p.coverImage, basePrice: p.basePrice }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{scopeLabel}</h1>
          <p className="text-sm text-slate-500">Supervisás a tu equipo de promotores. También podés referir clientes.</p>
        </div>
        <NewClientModal packages={pickerPackages} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Promotores" value={team.length} tone="brand" />
        <StatCard label="Clientes" value={totalClients} tone="green" sub="del equipo" />
        <StatCard label="Puntos" value={totalPoints} tone="gold" sub="acumulados" />
      </div>

      <Card className="overflow-hidden">
        <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
          Leaderboard del equipo
        </h2>
        {team.length === 0 ? (
          <EmptyState emoji="📊" title="Aún no tenés promotores asignados" description="Cuando se asignen promotores a tu agencia o región, aparecerán acá." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {team.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${["bg-amber-100 text-amber-700","bg-slate-200 text-slate-600","bg-orange-100 text-orange-700"][i] ?? "bg-slate-100 text-slate-500"}`}>
                    {i + 1}
                  </span>
                  <Avatar name={p.full_name || "P"} url={p.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.full_name}</p>
                    <p className="truncate text-xs text-slate-400">{p.agency_name ? `${p.agency_name} · ${p.region}` : "Sin agencia"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone="brand">{p.clients_count} clientes</Badge>
                  <Badge tone="gold">{p.points_balance} pts</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
