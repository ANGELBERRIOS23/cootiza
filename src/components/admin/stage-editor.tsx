"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStage } from "@/lib/admin/stages";
import { Button, Badge, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

type Stage = { id: string; vxm_stage_code: string; display_name: string; is_won: boolean; is_terminal: boolean; display_order: number };

/** Editor de etapas del pipeline: nombre visible + banderas ganado/terminal. */
export function StageEditor({ stages }: { stages: Stage[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">Etapas del pipeline</p>
      <p className="text-xs text-slate-500">El nombre visible es lo que ve el promotor. “Ganado” dispara el otorgamiento de puntos; “Terminal” marca el cierre.</p>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {stages.map((s) => <StageRow key={s.id} stage={s} />)}
      </div>
    </div>
  );
}

function StageRow({ stage }: { stage: Stage }) {
  const router = useRouter();
  const [name, setName] = useState(stage.display_name);
  const [won, setWon] = useState(stage.is_won);
  const [terminal, setTerminal] = useState(stage.is_terminal);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const dirty = name !== stage.display_name || won !== stage.is_won || terminal !== stage.is_terminal;

  async function save() {
    setSaving(true); setOk(false);
    const res = await updateStage(stage.id, { display_name: name, is_won: won, is_terminal: terminal });
    setSaving(false);
    if (res.ok) { setOk(true); router.refresh(); setTimeout(() => setOk(false), 1500); }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
      <code className="w-40 shrink-0 truncate text-[11px] text-slate-400">{stage.vxm_stage_code}</code>
      <input value={name} onChange={(e) => setName(e.target.value)} className={cn(inputClass, "h-9 flex-1 min-w-[140px] py-1.5")} />
      <button type="button" onClick={() => setWon((v) => !v)} className="shrink-0">
        <Badge tone={won ? "green" : "neutral"}>{won ? "✓ Ganado" : "Ganado"}</Badge>
      </button>
      <button type="button" onClick={() => setTerminal((v) => !v)} className="shrink-0">
        <Badge tone={terminal ? "blue" : "neutral"}>{terminal ? "✓ Terminal" : "Terminal"}</Badge>
      </button>
      <Button size="sm" variant={dirty ? "primary" : "ghost"} disabled={!dirty || saving} onClick={save} className="shrink-0">
        {saving ? "…" : ok ? "✓" : "Guardar"}
      </Button>
    </div>
  );
}
