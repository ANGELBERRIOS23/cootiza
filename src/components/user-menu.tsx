"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

/**
 * Menú de usuario en el header: avatar + nombre → dropdown con
 * configurar perfil, cambio de tema y cerrar sesión. Cliente (usa estado).
 */
export function UserMenu({
  name,
  role,
  avatarUrl,
  profileHref,
}: {
  name: string;
  role: string;
  avatarUrl?: string | null;
  profileHref: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-left transition hover:bg-slate-50"
      >
        <Avatar name={name} url={avatarUrl} size="sm" />
        <span className="hidden text-sm font-semibold text-slate-700 sm:inline">{name}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" className="text-slate-400" aria-hidden>
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Avatar name={name} url={avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{name}</p>
              <p className="text-xs capitalize text-slate-400">{role}</p>
            </div>
          </div>

          <Link
            href={profileHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            👤 Configurar perfil
          </Link>

          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"}
          </button>

          <form action="/auth/signout" method="post" className="border-t border-slate-100">
            <button
              type="submit"
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50",
              )}
            >
              ⎋ Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
