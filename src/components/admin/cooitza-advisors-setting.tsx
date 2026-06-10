"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateSetting } from "@/lib/admin/actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type Advisor = { id: string; full_name: string };

/**
 * Selección de asesores VXM que RECIBEN (en modo aleatorio) y son NOTIFICADOS
 * de los leads de Cooitza. La lista llega en vivo de las cuentas de la plataforma.
 */
export function CooitzaAdvisorsSetting({ advisors, selected }: { advisors: Advisor[]; selected: string[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateSetting("cooitza_advisor_ids", Array.from(picked));
    setSaving(false);
    if (res.ok) { setMsg("Guardado."); router.refresh(); }
    else setMsg(res.error);
  }

  if (advisors.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        No se pudo cargar la lista de asesores de la plataforma (¿VXM configurado?).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Estos asesores reciben los leads de Cooitza en modo aleatorio y reciben una notificación
        cuando se les asigna uno. Si no seleccionás ninguno, el reparto aleatorio usa a todos.
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {advisors.map((a) => {
          const on = picked.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                on ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              <span className="truncate">{a.full_name}</span>
              {on ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : null}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar asesores"}</Button>
        <span className="text-xs text-slate-500">{picked.size} seleccionado(s)</span>
        {msg ? <span className="text-xs text-emerald-600">{msg}</span> : null}
      </div>
    </div>
  );
}
