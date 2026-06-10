import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";

export const metadata = { title: "Inicio — Portal Cooitza" };

export default async function PortalHomePage() {
  const profile = await getSessionProfile();
  const firstName = (profile?.full_name || "").split(" ")[0] || "promotor";

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Hola, {firstName} 👋</h1>
        <p className="text-sm text-slate-500">Bienvenido a tu portal de promotor.</p>
      </section>

      {/* Hero de puntos — acento dorado */}
      <Link
        href="/portal/puntos"
        className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-6 text-amber-950 shadow-[0_20px_50px_-24px_rgba(245,158,11,0.8)]"
      >
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
        <div className="absolute -bottom-12 right-16 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-wider text-amber-900/80">Tus puntos</p>
          <p className="mt-1 flex items-end gap-2 text-5xl font-black leading-none tabular-nums">
            {profile?.points_balance ?? 0}
            <span className="mb-1 text-base font-bold text-amber-900/70">pts</span>
          </p>
          <p className="mt-2 text-sm font-medium text-amber-900/80">
            Se acumulan cuando tus clientes cierran venta. ¡Canjealos por premios! 🎁
          </p>
        </div>
      </Link>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-2 gap-3">
        <PortalTile href="/portal/catalogo" emoji="🧳" label="Catálogo" hint="Explorá paquetes" />
        <PortalTile href="/portal/mis-leads" emoji="📇" label="Mis clientes" hint="Tus leads" />
        <PortalTile href="/portal/puntos" emoji="⭐" label="Mis puntos" hint="Movimientos" />
        <PortalTile href="/portal/premios" emoji="🎁" label="Premios" hint="Canjeá" />
      </section>
    </div>
  );
}

function PortalTile({ href, emoji, label, hint }: { href: string; emoji: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl transition group-hover:scale-105">
        {emoji}
      </span>
      <span>
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
    </Link>
  );
}
