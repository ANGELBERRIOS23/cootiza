"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { startImpersonation } from "@/lib/admin/impersonation";

/** Botón "Ver como" — un admin entra al portal con la vista del promotor. */
export function ImpersonateButton({ promoterId }: { promoterId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await startImpersonation(promoterId);
          if (res.ok) {
            router.push("/portal");
            router.refresh();
          } else {
            alert(res.error);
          }
        })
      }
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? "…" : "Ver como"}
    </button>
  );
}
