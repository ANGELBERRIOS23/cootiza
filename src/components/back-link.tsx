"use client";

import { useRouter } from "next/navigation";

/**
 * "Volver" inteligente: regresa a la página anterior (router.back) — así si
 * llegaste desde el dashboard admin vuelve al dashboard, y si llegaste desde el
 * catálogo público vuelve al catálogo. Si no hay historial, usa el fallback.
 */
export function BackLink({
  fallback = "/paquetes",
  label = "Volver",
  className,
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className={className}
    >
      {"<-"} {label}
    </button>
  );
}
