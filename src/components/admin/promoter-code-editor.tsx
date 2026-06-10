"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPromoterVxmCode } from "@/lib/admin/actions";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Editor del código del promotor en VXM (vxm_promoter_code). */
export function PromoterCodeEditor({ promoterId, current }: { promoterId: string; current: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true); setMsg(null);
    const res = await setPromoterVxmCode(promoterId, code);
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Guardado ✓" } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-500">Código en VXM</p>
      <div className="flex items-center gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="vxm_promoter_code" className={cn(inputClass, "h-9 max-w-[200px] py-1.5 text-sm")} />
        <Button size="sm" variant="secondary" disabled={saving || code === (current ?? "")} onClick={save}>{saving ? "…" : "Guardar"}</Button>
        {msg ? <span className={cn("text-xs", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
