"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, Contact, Gift, Trophy, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const items: { href: string; label: string; Icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/promotores", label: "Promotores", Icon: Users },
  { href: "/admin/agencias", label: "Agencias", Icon: Building2 },
  { href: "/admin/clientes", label: "Clientes", Icon: Contact },
  { href: "/admin/canjes", label: "Canjes", Icon: Gift },
  { href: "/admin/premios", label: "Premios", Icon: Trophy },
  { href: "/admin/configuracion", label: "Configuración", Icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl gap-0.5 overflow-x-auto px-4 py-1.5 sm:px-6">
        {items.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
  );
}
