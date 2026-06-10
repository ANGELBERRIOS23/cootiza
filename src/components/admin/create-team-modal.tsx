"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupervisor, createAdmin } from "@/lib/admin/promoters";
import { Button, Field, inputClass } from "@/components/ui";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/cn";

type Agency = { id: string; name: string; region: string };
type Role = "supervisor" | "admin";
type Scope = "agency" | "region";

/**
 * Alta de un miembro del equipo interno: Supervisor (de agencia o región) o
 * Administrador. Los promotores se crean con el otro botón (alta masiva).
 */
export function CreateTeamModal({ agencies = [] }: { agencies?: Agency[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("supervisor");
  const [scope, setScope] = useState<Scope>("agency");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", agency_id: "", region: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm({ full_name: "", email: "", password: "", agency_id: "", region: "" });
    setRole("supervisor");
    setScope("agency");
    setError(null);
    setSaving(false);
  }
  function close() {
    setOpen(false);
    reset();
  }
  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const base = { full_name: form.full_name, email: form.email, password: form.password };
    const res =
      role === "admin"
        ? await createAdmin(base)
        : await createSupervisor({
            ...base,
            scope,
            agency_id: scope === "agency" ? form.agency_id || null : null,
            region: scope === "region" ? form.region || null : null,
          });
    if (res.ok) {
      close();
      router.refresh();
    } else {
      setSaving(false);
      setError(res.error);
    }
  }

  if (!open) {
    return <Button variant="secondary" onClick={() => setOpen(true)}>+ Admin / Supervisor</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Nuevo miembro del equipo</h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Rol</span>
            <div className="grid grid-cols-2 gap-2">
              {(["supervisor", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition",
                    role === r ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {r === "admin" ? "Administrador" : "Supervisor"}
                </button>
              ))}
            </div>
          </div>

          <Field label="Nombre completo"><input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={inputClass} /></Field>
          <Field label="Correo"><input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" className={inputClass} /></Field>
          <Field label="Contraseña" hint="mínimo 6 caracteres"><input value={form.password} onChange={(e) => set("password", e.target.value)} type="text" className={inputClass} /></Field>

          {role === "supervisor" ? (
            <>
              <div>
                <span className="mb-1 block text-sm font-semibold text-slate-700">Alcance</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["agency", "region"] as Scope[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                        scope === s ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {s === "agency" ? "Una agencia" : "Una región"}
                    </button>
                  ))}
                </div>
              </div>
              {scope === "agency" ? (
                <Field label="Agencia">
                  <select className={cn(inputClass, "py-2")} value={form.agency_id} onChange={(e) => set("agency_id", e.target.value)}>
                    <option value="">Elegí una agencia…</option>
                    {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.region}</option>)}
                  </select>
                </Field>
              ) : (
                <Field label="Región">
                  <select className={cn(inputClass, "py-2")} value={form.region} onChange={(e) => set("region", e.target.value)}>
                    <option value="">Elegí una región…</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              )}
            </>
          ) : null}

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Creando…" : "Crear"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
