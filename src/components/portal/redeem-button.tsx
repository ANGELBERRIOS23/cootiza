"use client";

import { useState } from "react";
import { requestRedemption } from "@/lib/rewards/actions";
import { Button } from "@/components/ui";

export function RedeemButton({
  rewardId,
  disabled,
  disabledReason,
}: {
  rewardId: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  if (state === "done") {
    return <p className="text-center text-xs font-semibold text-emerald-600">✓ Canje solicitado</p>;
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
