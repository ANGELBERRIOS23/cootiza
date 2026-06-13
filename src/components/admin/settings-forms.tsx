"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSetting, updatePointsRatio } from "@/lib/admin/actions";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

function useSaver() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setSaving(true);
    setMsg(null);
    const res = await fn();
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Guardado ✓" } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }
  return { saving, msg, run };
}

/** Selector de modo (registro / asignación) con guardado inmediato. */
export function ModeSetting({
  settingKey,
  current,
  options,
  label,
  help,
}: {
  settingKey: string;
  current: string;
  options: { value: string; label: string }[];
  label: string;
  help?: string;
}) {
  const { saving, msg, run } = useSaver();
  const [value, setValue] = useState(current);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {help ? <p className="text-xs text-slate-500">{help}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setValue(o.value)}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition",
              value === o.value
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={saving || value === current} onClick={() => run(() => updateSetting(settingKey, value))}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        {msg ? <span className={cn("text-xs", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}

/** Puntos fijos que gana el promotor cuando un asesor confirma su referencia. */
export function ReferralPointsSetting({ current }: { current: number }) {
  const { saving, msg, run } = useSaver();
  const [value, setValue] = useState(String(current));

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">Puntos por referencia confirmada</p>
        <p className="text-xs text-slate-500">Cuántos puntos gana el promotor cuando un asesor confirma su referencia en la plataforma central.</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(inputClass, "w-28")}
        />
        <span className="text-sm text-slate-500">pts</span>
        <Button size="sm" disabled={saving || Number(value) === current} onClick={() => run(() => updateSetting("cooitza_referral_points", Number(value)))}>
          {saving ? "…" : "Guardar"}
        </Button>
        {msg ? <span className={cn("text-xs", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}

/** Ratio de puntos por Q1 de rendimiento. */
export function RatioSetting({ current }: { current: number }) {
  const { saving, msg, run } = useSaver();
  const [value, setValue] = useState(String(current));

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">Puntos por rendimiento</p>
        <p className="text-xs text-slate-500">Cuántos puntos gana el promotor por cada Q1 de rendimiento de la venta.</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Q1 =</span>
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(inputClass, "w-28")}
        />
        <span className="text-sm text-slate-500">pts</span>
        <Button size="sm" disabled={saving || Number(value) === current} onClick={() => run(() => updatePointsRatio(Number(value)))}>
          {saving ? "…" : "Guardar"}
        </Button>
        {msg ? <span className={cn("text-xs", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
