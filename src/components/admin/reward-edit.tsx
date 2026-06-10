"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { upsertReward } from "@/lib/admin/actions";
import { Button, Field, inputClass } from "@/components/ui";
import { ImageUpload } from "@/components/image-upload";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number | null;
  is_active: boolean;
  display_order: number;
};

/** Editar un premio existente (incluye agregar/cambiar stock). Mantiene is_active. */
export function RewardEdit({ reward }: { reward: Reward }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(reward.title);
  const [description, setDescription] = useState(reward.description ?? "");
  const [imageUrl, setImageUrl] = useState(reward.image_url ?? "");
  const [points, setPoints] = useState(String(reward.points_cost));
  const [stock, setStock] = useState(reward.stock === null ? "" : String(reward.stock));
  const [order, setOrder] = useState(String(reward.display_order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    const res = await upsertReward({
      id: reward.id,
      title, description, image_url: imageUrl,
      points_cost: points, stock, display_order: order || 0,
      is_active: reward.is_active, // no cambiar el estado al editar
    });
    setSaving(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
        <Pencil className="h-3.5 w-3.5" /> Editar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Editar premio</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></Field>
          <Field label="Descripción"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} /></Field>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Imagen del premio</span>
            <ImageUpload bucket="reward-images" pathPrefix="rewards" value={imageUrl} onChange={setImageUrl} variant="rect" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Costo (pts)"><input value={points} onChange={(e) => setPoints(e.target.value)} type="number" min="1" className={inputClass} /></Field>
            <Field label="Stock" hint="vacío = ilimitado"><input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" className={inputClass} /></Field>
            <Field label="Orden"><input value={order} onChange={(e) => setOrder(e.target.value)} type="number" className={inputClass} /></Field>
          </div>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
