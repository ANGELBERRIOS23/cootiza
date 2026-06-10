"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/promotores", label: "Promotores" },
  { href: "/admin/canjes", label: "Canjes" },
  { href: "/admin/premios", label: "Premios" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
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
  );
}
