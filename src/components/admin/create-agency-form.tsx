"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAgency } from "@/lib/admin/agencies";
import { Button, Field, inputClass } from "@/components/ui";
import { REGIONS } from "@/lib/regions";

/** Crear una agencia (nombre + región). */
export function CreateAgencyForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createAgency({ name, region });
    setSaving(false);
    if (res.ok) {
      setName("");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>+ Nueva agencia</Button>;

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="min-w-[180px] flex-1">
        <Field label="Nombre de la agencia">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cooitza Xela" autoFocus />
        </Field>
      </div>
      <div className="min-w-[160px]">
        <Field label="Región">
          <select className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
