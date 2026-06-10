"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/promotores", label: "Promotores", icon: "👥" },
  { href: "/admin/canjes", label: "Canjes", icon: "🎁" },
  { href: "/admin/premios", label: "Premios", icon: "🏆" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {items.map((it) => {
          const active = isActive(it.href, it.exact);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-brand-600 text-white shadow-[0_6px_16px_-8px_rgba(15,132,128,0.8)]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
              )}
            >
              <span className="text-base">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
