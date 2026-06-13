"use client";

import { useState } from "react";
import Link from "next/link";
import { requestRedemption } from "@/lib/rewards/actions";
import { Button } from "@/components/ui";

/** WhatsApp de la agencia para coordinar la entrega del premio (+502 3014-9000). */
const AGENCY_WHATSAPP = "50230149000";

export function RedeemButton({
  rewardId,
  rewardTitle,
  disabled,
  disabledReason,
  needsPhone,
}: {
  rewardId: string;
  rewardTitle?: string;
  disabled: boolean;
  disabledReason?: string;
  /** true = el promotor no tiene teléfono en su perfil; no puede canjear (es donde lo contactan). */
  needsPhone?: boolean;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  // Sin teléfono no se puede canjear: lo mandamos a completar su perfil.
  if (needsPhone) {
    return (
      <Link
        href="/portal/perfil"
        className="block rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-700 hover:bg-amber-100"
      >
        📞 Agregá tu teléfono para canjear
      </Link>
    );
  }

  if (state === "done") {
    const text = encodeURIComponent(
      `Hola, acabo de canjear "${rewardTitle ?? "un premio"}" en el portal Cooitza. Quisiera coordinar la entrega. ¡Gracias!`,
    );
    return (
      <div className="space-y-2">
        <p className="text-center text-xs font-semibold text-emerald-600">✓ Canje solicitado</p>
        <a
          href={`https://wa.me/${AGENCY_WHATSAPP}?text=${text}`}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          💬 Escribir a la agencia
        </a>
        <p className="text-center text-[10px] leading-tight text-slate-400">
          Coordiná la entrega con la agencia por WhatsApp.
        </p>
      </div>
    );
  }

  async function onClick() {
    setState("saving");
    setMsg(null);
    const res = await requestRedemption(rewardId);
    if (res.ok) setState("done");
    else {
      setState("error");
      setMsg(res.error);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={onClick}
        disabled={disabled || state === "saving"}
        size="sm"
        className="w-full"
        title={disabled ? disabledReason : undefined}
      >
        {state === "saving" ? "Solicitando…" : disabled ? disabledReason ?? "No disponible" : "Canjear"}
      </Button>
      {state === "error" && msg ? <p className="text-center text-[11px] text-red-600">{msg}</p> : null}
    </div>
  );
}
