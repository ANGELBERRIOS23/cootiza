"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adjustPoints } from "@/lib/admin/actions";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Ajuste manual de puntos de un promotor (suma o resta con motivo obligatorio). */
export function AdjustPointsForm({ promoterId, balance }: { promoterId: string; balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function apply(sign: 1 | -1) {
    const n = Math.round(Number(amount)) * sign;
    if (!n || Number.isNaN(n)) return setMsg({ ok: false, text: "Ingresá un monto válido." });
    if (!reason.trim()) return setMsg({ ok: false, text: "El motivo es obligatorio." });
    setSaving(true);
    setMsg(null);
    const res = await adjustPoints(promoterId, n, reason.trim());
    setSaving(false);
    if (res.ok) {
      setMsg({ ok: true, text: `Ajuste de ${n > 0 ? "+" : ""}${n} aplicado ✓` });
      setAmount("");
      setReason("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-700">Ajustar puntos</p>
        <span className="text-xs text-slate-400">Balance actual: <b className="text-amber-600">{balance} pts</b></span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Cantidad"
          className={cn(inputClass, "py-2")}
        />
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (obligatorio)"
        className={cn(inputClass, "py-2")}
      />
      <div className="flex gap-2">
        <Button variant="gold" size="sm" disabled={saving} onClick={() => apply(1)} className="flex-1">
          + Sumar
        </Button>
        <Button variant="secondary" size="sm" disabled={saving} onClick={() => apply(-1)} className="flex-1">
          − Restar
        </Button>
      </div>
      {msg ? <p className={cn("text-xs", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</p> : null}
    </div>
  );
}
