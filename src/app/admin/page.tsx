import Link from "next/link";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { isCatalogConfigured } from "@/lib/db/vxm-catalog";
import { getPublishedPackages } from "@/lib/db/package-repository";
import { Card, StatCard, Badge } from "@/components/ui";

export const metadata = { title: "Panel — Cooitza Admin" };

export default async function AdminHomePage() {
  const supabase = await createCooitzaServerClient();

  // KPIs (admin ve todo por RLS). head:true = solo cuenta, sin traer filas.
  const [promoters, pendingPromoters, leads, redemptionsPending, topPromoters, packages] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "promoter"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    supabase.from("lead_mirror").select("id", { count: "exact", head: true }),
    supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("status", "requested"),
    supabase
      .from("profiles")
      .select("id, full_name, points_balance")
      .eq("role", "promoter")
      .order("points_balance", { ascending: false })
      .limit(5),
    getPublishedPackages(),
  ]);

  const catalogConfigured = isCatalogConfigured();

  return (
    <div className="space-y-6">
      {/* Encabezado con logo */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="h-10 w-auto" />
        <div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">Panel de administración</h1>
          <p className="text-sm text-slate-500">Portal de promotores · Cooitza × Viajexmundo</p>
        </div>
      </div>

      {!catalogConfigured ? (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            ⚠️ El catálogo de VXM aún no está conectado. Configurá <code>NEXT_PUBLIC_VXM_SUPABASE_*</code> en
            Vercel para que los promotores vean paquetes y los leads viajen al CRM.
          </p>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Promotores" value={promoters.count ?? 0} tone="brand" />
        <StatCard label="Pendientes" value={pendingPromoters.count ?? 0} tone="amber" sub="por aprobar" />
        <StatCard label="Clientes" value={leads.count ?? 0} tone="slate" sub="leads" />
        <StatCard label="Canjes" value={redemptionsPending.count ?? 0} tone="green" sub="por aprobar" />
        <StatCard label="Paquetes" value={packages.length} tone="brand" sub="publicados" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800">Top promotores por puntos</h2>
          {(topPromoters.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay promotores con puntos.</p>
          ) : (
            <ul className="space-y-2">
              {(topPromoters.data ?? []).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-slate-400">{i + 1}.</span> {p.full_name}
                  </span>
                  <Badge tone="green">{p.points_balance} pts</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800">Accesos</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin/promotores" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-brand-300">👥 Promotores</Link>
            <Link href="/admin/canjes" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-brand-300">🎁 Canjes</Link>
            <Link href="/admin/premios" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-brand-300">🏆 Premios</Link>
            <Link href="/admin/configuracion" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-brand-300">⚙️ Configuración</Link>
          </div>
        </Card>
      </div>

      {/* Paquetes disponibles */}
      <Card className="p-5">
        <h2 className="mb-3 font-bold text-slate-800">Paquetes disponibles</h2>
        {packages.length === 0 ? (
          <p className="text-sm text-slate-500">
            {catalogConfigured
              ? "No hay paquetes publicados (o la conexión con VXM aún no responde). Verificá la API key de VXM en Vercel."
              : "Conectá VXM para ver el catálogo aquí."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {packages.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={`/paquetes/${p.slug}`}
                className="group overflow-hidden rounded-xl border border-slate-200 transition hover:border-brand-300 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.coverImage || "/package-fallback.svg"}
                  alt={p.name}
                  className="h-24 w-full object-cover transition group-hover:scale-[1.03]"
                />
                <div className="p-2">
                  <p className="truncate text-xs font-semibold text-slate-700">{p.name}</p>
                  <p className="text-[11px] text-slate-400">{p.destination}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
