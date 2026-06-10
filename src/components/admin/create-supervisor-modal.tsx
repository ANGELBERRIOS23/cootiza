"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupervisor } from "@/lib/admin/promoters";
import { Button, Field, inputClass } from "@/components/ui";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/cn";

type Agency = { id: string; name: string; region: string };

/** Alta de supervisor: pregunta si supervisa una AGENCIA o una REGIÓN. */
export function CreateSupervisorModal({ agencies }: { agencies: Agency[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"agency" | "region">("agency");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function close() {
    setOpen(false);
    setResult(null);
  }

  async function submit() {
    setSaving(true);
    setResult(null);
    const res = await createSupervisor({
      full_name: fullName,
      email,
      password,
      scope,
      agency_id: scope === "agency" ? agencyId || null : null,
      region: scope === "region" ? region : null,
    });
    setSaving(false);
    if (res.ok) {
      setResult({ ok: true, text: "Supervisor creado ✓" });
      setFullName(""); setEmail(""); setPassword(""); setAgencyId("");
      router.refresh();
    } else {
      setResult({ ok: false, text: res.error });
    }
  }

  if (!open) return <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>+ Nuevo supervisor</Button>;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Nuevo supervisor</h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>

        <div className="space-y-3 p-5">
          {/* Scope */}
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">¿Qué supervisa?</span>
            <div className="grid grid-cols-2 gap-2">
              {([["agency", "Una agencia"], ["region", "Una región"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScope(val)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    scope === val ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {scope === "agency" ? (
            <Field label="Agencia a supervisar">
              <select className={inputClass} value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                <option value="">Elegí una agencia…</option>
                {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.region}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Región a supervisar">
              <select className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          )}

          <Field label="Nombre completo">
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Correo"><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Contraseña"><input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mín. 6" /></Field>
          </div>

          {result ? (
            <p className={cn("text-sm", result.ok ? "text-emerald-600" : "text-red-600")}>{result.text}</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="ghost" onClick={close}>Cerrar</Button>
            <Button onClick={submit} disabled={saving || !fullName.trim() || !email.trim() || !password.trim()}>
              {saving ? "Creando…" : "Crear supervisor"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
