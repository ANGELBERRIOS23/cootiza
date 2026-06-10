"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Luggage, Contact, Star, Gift, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const items: { href: string; label: string; Icon: LucideIcon; exact?: boolean }[] = [
  { href: "/portal", label: "Inicio", Icon: Home, exact: true },
  { href: "/portal/catalogo", label: "Catálogo", Icon: Luggage },
  { href: "/portal/mis-leads", label: "Clientes", Icon: Contact },
  { href: "/portal/puntos", label: "Puntos", Icon: Star },
  { href: "/portal/premios", label: "Premios", Icon: Gift },
];

/**
 * Navegación del portal: barra inferior fija en móvil (pulgar-friendly),
 * píldoras con icono en desktop. Iconos (lucide), sin emojis.
 */
export function PortalNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop */}
      <nav className="hidden border-b border-slate-200/70 bg-white/85 backdrop-blur-md sm:block">
        <div className="mx-auto flex max-w-2xl gap-0.5 px-4 py-1.5">
          {items.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: barra inferior fija */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {items.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-brand-700" : "text-slate-400",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
