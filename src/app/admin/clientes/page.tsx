import Link from "next/link";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getStageMap, stageTone } from "@/lib/leads/stages";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";

export const metadata = { title: "Clientes — Cooitza Admin" };

const pick = <T,>(v: T | T[] | null | undefined): T | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);

export default async function AdminClientesPage() {
  const supabase = await createCooitzaServerClient();

  const [{ data: leads }, { data: stats }, stageMap] = await Promise.all([
    supabase
      .from("lead_mirror")
      .select("id, client_name, client_phone, package_title, current_stage, created_at, promoter:promoter_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.rpc("admin_promoter_stats"),
    getStageMap(),
  ]);

  const rows = leads ?? [];
  const promoterStats = (stats ?? []) as { id: string; full_name: string; clients_count: number; last_client_at: string | null }[];

  // Métricas
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thisMonth = rows.filter((r) => new Date(r.created_at) >= startOfMonth).length;
  const withClients = promoterStats.filter((p) => p.clients_count > 0);
  const topByClients = [...promoterStats].sort((a, b) => b.clients_count - a.clients_count).filter((p) => p.clients_count > 0).slice(0, 5);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-black tracking-tight text-slate-900">Clientes</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total clientes" value={rows.length} tone="brand" icon="📇" />
        <StatCard label="Este mes" value={thisMonth} tone="green" icon="🗓️" sub="registrados" />
        <StatCard label="Promotores activos" value={withClients.length} tone="slate" icon="👥" sub="con clientes" />
        <StatCard
          label="Promedio"
          value={withClients.length ? Math.round(rows.length / withClients.length) : 0}
          tone="amber"
          icon="📈"
          sub="clientes / promotor"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Clientes por promotor */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 font-bold text-slate-800">Clientes por promotor</h2>
          {topByClients.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay clientes registrados.</p>
          ) : (
            <ul className="space-y-1">
              {topByClients.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/promotores/${p.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 truncate text-slate-700">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                      <span className="truncate">{p.full_name}</span>
                    </span>
                    <Badge tone="brand">{p.clients_count}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Tabla de clientes */}
        <Card className="overflow-hidden lg:col-span-2">
          <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
            Todos los clientes ({rows.length})
          </h2>
          {rows.length === 0 ? (
            <EmptyState emoji="📇" title="Aún no hay clientes" description="Cuando los promotores registren clientes, aparecerán acá." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => {
                const meta = stageMap[r.current_stage];
                const promoter = pick(r.promoter as { full_name?: string } | { full_name?: string }[])?.full_name ?? "—";
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{r.client_name}</p>
                      <p className="truncate text-xs text-slate-400">
                        👤 {promoter}{r.package_title ? ` · 🧳 ${r.package_title}` : ""} · {fmt(r.created_at)}
                      </p>
                    </div>
                    <Badge tone={stageTone(meta)}>{meta?.display_name ?? "Registrado"}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function fmt(s: string): string {
  try {
    return new Date(s).toLocaleDateString("es-GT", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}
