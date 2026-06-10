import Link from "next/link";
import { Luggage, Contact, Star, Gift, type LucideIcon } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/session";

export const metadata = { title: "Inicio — Portal Cooitza" };

export default async function PortalHomePage() {
  const profile = await getSessionProfile();
  const firstName = (profile?.full_name || "").split(" ")[0] || "promotor";

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Hola, {firstName}</h1>
        <p className="text-sm text-slate-500">Bienvenido a tu portal de promotor.</p>
      </section>

      {/* Hero de puntos — acento dorado, minimal */}
      <Link
        href="/portal/puntos"
        className="relative block overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-amber-950"
      >
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-900/70">Tus puntos</p>
          <p className="mt-1 flex items-end gap-2 text-5xl font-black leading-none tabular-nums">
            {profile?.points_balance ?? 0}
            <span className="mb-1 text-base font-bold text-amber-900/70">pts</span>
          </p>
          <p className="mt-2 text-sm font-medium text-amber-900/80">
            Se acumulan cuando tus clientes cierran venta. Canjealos por premios.
          </p>
        </div>
      </Link>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-2 gap-3">
        <PortalTile href="/portal/catalogo" Icon={Luggage} label="Catálogo" hint="Explorá paquetes" />
        <PortalTile href="/portal/mis-leads" Icon={Contact} label="Mis clientes" hint="Tus leads" />
        <PortalTile href="/portal/puntos" Icon={Star} label="Mis puntos" hint="Movimientos" />
        <PortalTile href="/portal/premios" Icon={Gift} label="Premios" hint="Canjeá" />
      </section>
    </div>
  );
}

function PortalTile({ href, Icon, label, hint }: { href: string; Icon: LucideIcon; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:bg-slate-50"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
    </Link>
  );
}
