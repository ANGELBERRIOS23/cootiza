"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateAgency } from "@/lib/admin/agencies";
import { Button, Field, inputClass } from "@/components/ui";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/cn";

type Agency = { id: string; name: string; region: string };

/** Editar el nombre (y región) de una agencia. */
export function EditAgencyModal({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(agency.name);
  const [region, setRegion] = useState(agency.region);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await updateAgency({ id: agency.id, name, region });
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setSaving(false);
      setError(res.error);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Pencil className="h-3.5 w-3.5" /> Editar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Editar agencia</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></Field>
          <Field label="Región">
            <select className={cn(inputClass, "py-2")} value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
