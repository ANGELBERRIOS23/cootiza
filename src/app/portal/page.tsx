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

      {/* Hero de puntos — plano navy, número en dorado */}
      <Link href="/portal/puntos" className="block rounded-2xl bg-brand-700 p-6 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Tus puntos</p>
        <p className="mt-1 flex items-end gap-2 text-5xl font-black leading-none tabular-nums text-amber-400">
          {profile?.points_balance ?? 0}
          <span className="mb-1 text-base font-bold text-white/60">pts</span>
        </p>
        <p className="mt-2 text-sm font-medium text-white/70">
          Se acumulan cuando tus clientes cierran venta. Canjealos por premios.
        </p>
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
