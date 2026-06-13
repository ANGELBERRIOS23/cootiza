"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateSetting } from "@/lib/admin/actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type Advisor = { id: string; full_name: string };

/**
 * Matriz REGIÓN → asesores. Cuando un promotor (de una agencia con región X)
 * registra un lead, este se reparte por round-robin SOLO entre los asesores de
 * esa región. Si una región no tiene asesores, cae al reparto global.
 *
 * Guarda en app_settings.cooitza_region_advisors como { region: [advisorId...] }.
 */
export function CooitzaRegionAdvisorsSetting({
  advisors,
  regions,
  current,
}: {
  advisors: Advisor[];
  regions: string[];
  current: Record<string, string[]>;
}) {
  const router = useRouter();
  const [map, setMap] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const r of regions) init[r] = new Set(Array.isArray(current[r]) ? current[r] : []);
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function toggle(region: string, advisorId: string) {
    setMap((prev) => {
      const next = { ...prev, [region]: new Set(prev[region]) };
      if (next[region].has(advisorId)) next[region].delete(advisorId);
      else next[region].add(advisorId);
      return next;
    });
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const payload: Record<string, string[]> = {};
    for (const r of regions) {
      const ids = Array.from(map[r] ?? []);
      if (ids.length > 0) payload[r] = ids;
    }
    const res = await updateSetting("cooitza_region_advisors", payload);
    setSaving(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Guardado ✓" });
      router.refresh();
    } else setMsg({ ok: false, text: res.error });
  }

  if (advisors.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        No se pudo cargar la lista de asesores de la plataforma (¿VXM configurado?).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Asigná uno o más asesores a cada región. Los leads de promotores de esa región rotan
        (round-robin) solo entre ellos. Las regiones sin asesores usan el reparto global de arriba.
      </p>

      {regions.map((region) => {
        const picked = map[region] ?? new Set<string>();
        return (
          <div key={region} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{region}</p>
              <span className="text-[11px] text-slate-400">{picked.size} asesor(es)</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {advisors.map((a) => {
                const on = picked.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(region, a.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition",
                      on
                        ? "border-brand-600 bg-brand-50 text-brand-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span className="truncate">{a.full_name}</span>
                    {on ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar regiones"}
        </Button>
        {msg ? (
          <span className={cn("text-xs", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span>
        ) : null}
      </div>
    </div>
  );
}
