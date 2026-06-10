import Link from "next/link";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getSessionProfile } from "@/lib/auth/session";
import { isCatalogConfigured } from "@/lib/db/vxm-catalog";
import { getPublishedPackages } from "@/lib/db/package-repository";
import { Card, StatCard, Badge } from "@/components/ui";

export const metadata = { title: "Panel — Cooitza Admin" };

export default async function AdminHomePage() {
  const supabase = await createCooitzaServerClient();
  const profile = await getSessionProfile();

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
  const firstName = (profile?.full_name || "").split(" ")[0] || "admin";

  return (
    <div className="space-y-6">
      {/* Hero de marca */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-[#0f2a43] p-6 text-white shadow-[0_20px_50px_-24px_rgba(15,42,67,0.7)] sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
            Cooitza × Viajexmundo
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Hola, {firstName} 👋</h1>
          <p className="mt-1 max-w-lg text-sm text-white/80">
            Panel de administración del portal de promotores. Gestioná altas, canjes, premios y puntos.
          </p>
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
        <StatCard label="Promotores" value={promoters.count ?? 0} tone="brand" icon="👥" />
        <StatCard label="Pendientes" value={pendingPromoters.count ?? 0} tone="amber" sub="por aprobar" icon="⏳" />
        <StatCard label="Clientes" value={leads.count ?? 0} tone="slate" sub="leads" icon="📇" />
        <StatCard label="Canjes" value={redemptionsPending.count ?? 0} tone="gold" sub="por aprobar" icon="🎁" />
        <StatCard label="Paquetes" value={packages.length} tone="brand" sub="publicados" icon="🧳" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-800">🏅 Top promotores por puntos</h2>
          {(topPromoters.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay promotores con puntos.</p>
          ) : (
            <ul className="space-y-1">
              {(topPromoters.data ?? []).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                      {i + 1}
                    </span>
                    {p.full_name}
                  </span>
                  <Badge tone="gold">{p.points_balance} pts</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-800">⚡ Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: "/admin/promotores", icon: "👥", label: "Promotores" },
              { href: "/admin/canjes", icon: "🎁", label: "Canjes" },
              { href: "/admin/premios", icon: "🏆", label: "Premios" },
              { href: "/admin/configuracion", icon: "⚙️", label: "Configuración" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-white hover:shadow-sm"
              >
                <span className="text-lg">{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Paquetes disponibles */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-800">🧳 Paquetes disponibles</h2>
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
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
              >
                <div className="relative h-28 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.coverImage || "/package-fallback.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {p.isOffer ? (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
                      OFERTA
                    </span>
                  ) : null}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-bold text-slate-700">{p.name}</p>
                  <p className="text-[11px] text-slate-400">📍 {p.destination}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
