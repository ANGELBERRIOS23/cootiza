"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { runPipelineSync } from "@/lib/admin/actions";
import { Button } from "@/components/ui";

/**
 * Botón admin para forzar la sincronización del pipeline VXM→Cooitza al
 * instante (sin esperar al cron diario). Muestra el reporte de la corrida.
 */
export function SyncNowButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "skip" | "error">("ok");

  function run() {
    setMsg(null);
    startTransition(async () => {
      const res = await runPipelineSync();
      if (!res.ok) {
        setTone("error");
        setMsg(res.error);
        return;
      }
      const r = res.report;
      if (r.skipped === "vxm_not_configured") {
        setTone("skip");
        setMsg("VXM no está configurado (falta VXM_SUPABASE_SERVICE_ROLE_KEY en Vercel). No se sincronizó nada.");
        return;
      }
      setTone(r.errors.length > 0 ? "error" : "ok");
      setMsg(
        `Listo · ${r.retried} lead(s) reenviado(s) · ${r.stagesUpdated} etapa(s) actualizada(s) · ` +
          `${r.pointsAwarded} venta(s) con puntos (+${r.pointsTotal} pts)` +
          (r.errors.length ? ` · ${r.errors.length} error(es)` : ""),
      );
      router.refresh();
    });
  }

  const toneClass =
    tone === "error"
      ? "bg-red-50 text-red-700"
      : tone === "skip"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={run} disabled={pending}>
        <RefreshCw className={"mr-1.5 h-4 w-4" + (pending ? " animate-spin" : "")} />
        {pending ? "Sincronizando…" : "Sincronizar ahora"}
      </Button>
      {msg ? <p className={"rounded-lg px-3 py-2 text-sm " + toneClass}>{msg}</p> : null}
    </div>
  );
}
