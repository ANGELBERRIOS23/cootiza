"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateUserProfile } from "@/lib/admin/actions";
import { Button, Field, inputClass } from "@/components/ui";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/cn";

type Agency = { id: string; name: string; region: string };
type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "promoter" | "supervisor" | "admin" | "superadmin";
  status: "active" | "pending_approval" | "suspended";
  agency_id: string | null;
  supervised_region: string | null;
};

/** Editar el perfil de un usuario (nombre, correo, teléfono, rol, estado, agencia/región). */
export function EditUserModal({ user, agencies }: { user: User; agencies: Agency[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<User["role"]>(user.role);
  const [status, setStatus] = useState<User["status"]>(user.status);
  const [agencyId, setAgencyId] = useState(user.agency_id ?? "");
  const [region, setRegion] = useState(user.supervised_region ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await updateUserProfile({
      id: user.id,
      full_name: fullName,
      email,
      phone,
      role,
      status,
      agency_id: agencyId || null,
      supervised_region: region || null,
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
        <Pencil className="h-3.5 w-3.5" /> Editar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Editar usuario</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="Nombre completo"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} /></Field>
          <Field label="Correo" hint="cambia el correo de acceso"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} /></Field>
          <Field label="Teléfono"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rol">
              <select className={cn(inputClass, "py-2")} value={role} onChange={(e) => setRole(e.target.value as User["role"])}>
                <option value="promoter">Promotor</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </Field>
            <Field label="Estado">
              <select className={cn(inputClass, "py-2")} value={status} onChange={(e) => setStatus(e.target.value as User["status"])}>
                <option value="active">Activo</option>
                <option value="pending_approval">Pendiente</option>
                <option value="suspended">Suspendido</option>
              </select>
            </Field>
          </div>

          {role === "promoter" || role === "supervisor" ? (
            <Field label="Agencia" hint={role === "supervisor" ? "para supervisor de agencia" : undefined}>
              <select className={cn(inputClass, "py-2")} value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                <option value="">Sin agencia</option>
                {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.region}</option>)}
              </select>
            </Field>
          ) : null}

          {role === "supervisor" ? (
            <Field label="Región supervisada" hint="para supervisor de región">
              <select className={cn(inputClass, "py-2")} value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">Sin región</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          ) : null}

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
