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
 * barra horizontal en desktop. Resalta la sección activa.
 */
export function PortalNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop: tabs horizontales bajo el header */}
      <nav className="hidden border-b border-slate-200 bg-white sm:block">
        <div className="mx-auto flex max-w-2xl gap-1 px-4">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-medium transition",
                isActive(it.href, it.exact)
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {it.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile: barra inferior fija */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {items.map((it) => {
            const active = isActive(it.href, it.exact);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                  active ? "text-brand-700" : "text-slate-400",
                )}
              >
                <span className={cn("text-lg", active && "scale-110")}>{it.emoji}</span>
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
