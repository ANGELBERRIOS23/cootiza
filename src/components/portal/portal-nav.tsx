"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/portal", emoji: "🏠", label: "Inicio", exact: true },
  { href: "/portal/catalogo", emoji: "🧳", label: "Catálogo" },
  { href: "/portal/mis-leads", emoji: "📇", label: "Clientes" },
  { href: "/portal/puntos", emoji: "⭐", label: "Puntos" },
  { href: "/portal/premios", emoji: "🎁", label: "Premios" },
];

/**
 * Navegación del portal: barra inferior fija en móvil (pulgar-friendly),
 * píldoras horizontales en desktop. Resalta la sección activa.
 */
export function PortalNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop: píldoras horizontales bajo el header */}
      <nav className="hidden border-b border-slate-200/80 bg-white/85 backdrop-blur-md sm:block">
        <div className="mx-auto flex max-w-2xl gap-1 px-4 py-2">
          {items.map((it) => {
            const active = isActive(it.href, it.exact);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  active
                    ? "bg-brand-600 text-white shadow-[0_6px_16px_-8px_rgba(15,132,128,0.8)]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                )}
              >
                <span className="text-base">{it.emoji}</span>
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: barra inferior fija */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {items.map((it) => {
            const active = isActive(it.href, it.exact);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors",
                  active ? "text-brand-700" : "text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-12 place-items-center rounded-full text-lg transition-all",
                    active && "bg-brand-50 scale-105",
                  )}
                >
                  {it.emoji}
                </span>
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
