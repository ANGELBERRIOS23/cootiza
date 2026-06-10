import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";

export const metadata = { title: "Inicio — Portal Cooitza" };

export default async function PortalHomePage() {
  const profile = await getSessionProfile();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-bold text-slate-900">Hola, {profile?.full_name} 👋</h1>
        <p className="text-sm text-slate-500">Bienvenido a tu portal de promotor.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tus puntos</p>
        <p className="mt-1 text-3xl font-black text-emerald-600">
          {profile?.points_balance ?? 0}
        </p>
        <p className="text-xs text-slate-500">Se acumulan cuando tus clientes cierran venta.</p>
      </section>

      {/* Accesos rápidos — las secciones se construyen en las próximas fases. */}
      <section className="grid grid-cols-2 gap-3">
        <PortalTile href="/paquetes" emoji="🧳" label="Catálogo" />
        <PortalTile href="/portal/mis-leads" emoji="📇" label="Mis clientes" soon />
        <PortalTile href="/portal/puntos" emoji="⭐" label="Mis puntos" soon />
        <PortalTile href="/portal/premios" emoji="🎁" label="Premios" soon />
      </section>
    </div>
  );
}

function PortalTile({
  href,
  emoji,
  label,
  soon,
}: {
  href: string;
  emoji: string;
  label: string;
  soon?: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:border-slate-300">
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {soon ? <span className="text-[10px] font-medium text-slate-400">Próximamente</span> : null}
    </div>
  );
  return soon ? <div className="opacity-60">{content}</div> : <Link href={href}>{content}</Link>;
}
