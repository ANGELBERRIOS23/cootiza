import Link from "next/link";
import { Users, Clock, Contact, Gift, Luggage, Trophy, Settings, MapPin, ArrowUpRight, TrendingUp } from "lucide-react";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getSessionProfile } from "@/lib/auth/session";
import { isCatalogConfigured } from "@/lib/db/vxm-catalog";
import { getPublishedPackages } from "@/lib/db/package-repository";
import { Card, StatCard, Badge } from "@/components/ui";

export const metadata = { title: "Panel — Cooitza Admin" };

export default async function AdminHomePage() {
  const supabase = await createCooitzaServerClient();
  const profile = await getSessionProfile();

  const [promoters, pendingPromoters, leads, redemptionsPending, statsRes, packages, leadRows, stageMapRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "promoter"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    supabase.from("lead_mirror").select("id", { count: "exact", head: true }),
    supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("status", "requested"),
    supabase.rpc("admin_promoter_stats"),
    getPublishedPackages(),
    supabase.from("lead_mirror").select("current_stage, sync_status").limit(5000),
    supabase.from("pipeline_stage_map").select("vxm_stage_code, display_name, is_won, display_order").order("display_order"),
  ]);

  const topPromoters = ((statsRes.data ?? []) as { id: string; full_name: string; points_balance: number; clients_count: number }[])
    .map((p) => ({ ...p, clients_count: Number(p.clients_count) }))
    .slice(0, 5);

  // Pipeline: leads por etapa, ventas cerradas (is_won) y salud de sincronización.
  const allLeads = (leadRows.data ?? []) as { current_stage: string; sync_status: string }[];
  const stageMap = (stageMapRes.data ?? []) as { vxm_stage_code: string; display_name: string; is_won: boolean }[];
  const wonCodes = new Set(stageMap.filter((s) => s.is_won).map((s) => s.vxm_stage_code));
  const byStage = stageMap.map((s) => ({
    name: s.display_name,
    code: s.vxm_stage_code,
    count: allLeads.filter((l) => l.current_stage === s.vxm_stage_code).length,
    won: s.is_won,
  })).filter((s) => s.count > 0);
  const maxStage = Math.max(1, ...byStage.map((s) => s.count));
  const closedSales = allLeads.filter((l) => wonCodes.has(l.current_stage)).length;
  const pendingSync = allLeads.filter((l) => l.sync_status === "pending" || l.sync_status === "failed").length;

  const catalogConfigured = isCatalogConfigured();
  const firstName = (profile?.full_name || "").split(" ")[0] || "admin";

  return (
    <div className="space-y-6">
      {/* Hero plano de marca (navy) */}
      <div className="rounded-2xl bg-brand-700 px-6 py-7 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Cooitza · Viajexmundo</p>
        <h1 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">Hola, {firstName}</h1>
        <p className="mt-1 max-w-lg text-sm text-white/70">Panel de administración del portal de promotores.</p>
      </div>

      {!catalogConfigured ? (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            El catálogo de VXM aún no está conectado. Configurá <code>NEXT_PUBLIC_VXM_SUPABASE_*</code> en Vercel.
          </p>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Promotores" value={promoters.count ?? 0} tone="brand" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Pendientes" value={pendingPromoters.count ?? 0} tone="amber" sub="por aprobar" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Clientes" value={leads.count ?? 0} tone="slate" sub="leads" icon={<Contact className="h-5 w-5" />} />
        <StatCard label="Ventas" value={closedSales} tone="green" sub="cerradas" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Canjes" value={redemptionsPending.count ?? 0} tone="gold" sub="por aprobar" icon={<Gift className="h-5 w-5" />} />
        <StatCard label="Paquetes" value={packages.length} tone="brand" sub="publicados" icon={<Luggage className="h-5 w-5" />} />
      </div>

      {/* Pipeline + salud de sincronización */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold text-slate-800">Leads por etapa</h2>
          {byStage.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay leads registrados.</p>
          ) : (
            <ul className="space-y-2">
              {byStage.map((s) => (
                <li key={s.code} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs font-medium text-slate-600">{s.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${s.won ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${(s.count / maxStage) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800">Salud de sincronización</h2>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Leads sin confirmar</span>
              <Badge tone={pendingSync > 0 ? "amber" : "green"}>{pendingSync}</Badge>
            </div>
            <p className="text-xs text-slate-400">
              {pendingSync > 0
                ? "Hay leads pendientes o fallidos de enviar a VXM. El cron los reintenta automáticamente."
                : "Todos los leads se sincronizaron correctamente con VXM."}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold">Leaderboard de promotores</h2>
          </div>
          {topPromoters.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay promotores con actividad.</p>
          ) : (
            <ul className="space-y-0.5">
              {topPromoters.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/admin/promotores/${p.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-slate-700">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                      <span className="truncate">{p.full_name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Badge tone="brand">{p.clients_count} clientes</Badge>
                      <Badge tone="gold">{p.points_balance} pts</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: "/admin/promotores", Icon: Users, label: "Promotores" },
              { href: "/admin/agencias", Icon: Settings, label: "Agencias" },
              { href: "/admin/canjes", Icon: Gift, label: "Canjes" },
              { href: "/admin/premios", Icon: Trophy, label: "Premios" },
            ].map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-slate-50"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Paquetes disponibles */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <Luggage className="h-4 w-4 text-brand-600" />
          <h2 className="font-bold">Paquetes disponibles</h2>
        </div>
        {packages.length === 0 ? (
          <p className="text-sm text-slate-500">
            {catalogConfigured
              ? "No hay paquetes publicados (o la conexión con VXM aún no responde)."
              : "Conectá VXM para ver el catálogo aquí."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {packages.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={`/paquetes/${p.slug}`}
                className="group overflow-hidden rounded-xl border border-slate-200 transition hover:border-brand-300"
              >
                <div className="relative h-28 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.coverImage || "/package-fallback.svg"} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  {p.isOffer ? (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">OFERTA</span>
                  ) : null}
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 opacity-0 transition group-hover:opacity-100">
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-700" />
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-bold text-slate-700">{p.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-400"><MapPin className="h-3 w-3" /> {p.destination}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
