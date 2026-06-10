"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateLeadClient } from "@/lib/leads/actions";
import { Button, Field, inputClass } from "@/components/ui";

type Lead = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  notes: string | null;
};

/** El promotor edita los datos de su cliente (no puede eliminar). */
export function EditMyClientModal({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(lead.client_name);
  const [phone, setPhone] = useState(lead.client_phone);
  const [email, setEmail] = useState(lead.client_email ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await updateLeadClient({
      leadId: lead.id,
      client_name: name,
      client_phone: phone,
      client_email: email,
      notes,
    });
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
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Pencil className="h-3.5 w-3.5" /> Editar datos
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Editar datos del cliente</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></Field>
          <Field label="Teléfono"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></Field>
          <Field label="Correo (opcional)"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} /></Field>
          <Field label="Notas (opcional)"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} /></Field>
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
