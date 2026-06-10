"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertReward } from "@/lib/admin/actions";
import { Button, Field, inputClass } from "@/components/ui";

/** Form de creación de premio. Compacto; se expande al tocar "Nuevo premio". */
export function RewardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await upsertReward({
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      image_url: String(form.get("image_url") ?? ""),
      points_cost: form.get("points_cost"),
      stock: String(form.get("stock") ?? ""),
      display_order: form.get("display_order") || 0,
      is_active: true,
    });
    setSaving(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nuevo premio</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Field label="Título"><input name="title" required className={inputClass} placeholder="Ej. Audífonos inalámbricos" /></Field>
      <Field label="Descripción"><textarea name="description" rows={2} className={inputClass} /></Field>
      <Field label="URL de imagen" hint="Opcional"><input name="image_url" type="url" className={inputClass} placeholder="https://…" /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Costo (pts)"><input name="points_cost" type="number" min="1" required className={inputClass} /></Field>
        <Field label="Stock" hint="vacío = ilimitado"><input name="stock" type="number" min="0" className={inputClass} /></Field>
        <Field label="Orden"><input name="display_order" type="number" defaultValue="0" className={inputClass} /></Field>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear premio"}</Button>
      </div>
    </form>
  );
}
