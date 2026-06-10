"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { stopImpersonation } from "@/lib/admin/impersonation";

/** Barra superior visible mientras un admin impersona a un promotor. */
export function ImpersonationBanner({ name }: { name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="z-30 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      <span>👁️ Viendo el portal como <b>{name}</b></span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await stopImpersonation();
            router.push("/admin/promotores");
            router.refresh();
          })
        }
        className="rounded-lg bg-amber-950/90 px-3 py-1 text-xs font-bold text-amber-50 transition hover:bg-amber-950 disabled:opacity-60"
      >
        {pending ? "…" : "Salir"}
      </button>
    </div>
  );
}
