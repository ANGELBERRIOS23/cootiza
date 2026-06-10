"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/lib/leads/actions";
import { Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

export type PickerPackage = {
  id: string;
  name: string;
  destination: string;
  coverImage: string;
  basePrice: number;
};

/**
 * Registrar un cliente desde "Mis clientes": datos + elegir un paquete con
 * vista previa. El paquete es opcional. Reusa el Server Action createLead.
 */
export function NewClientModal({ packages }: { packages: PickerPackage[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const selected = packages.find((p) => p.id === pkgId) ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packages.slice(0, 30);
    return packages.filter((p) => `${p.name} ${p.destination}`.toLowerCase().includes(q)).slice(0, 30);
  }, [packages, query]);

  function reset() {
    setName(""); setPhone(""); setEmail(""); setNotes(""); setPkgId(null); setQuery("");
    setState("idle"); setMessage(null); setConsent(false);
  }
  function close() { setOpen(false); reset(); }

  async function submit() {
    setState("saving"); setMessage(null);
    const res = await createLead({
      client_name: name, client_phone: phone, client_email: email, notes,
      package_vxm_id: selected?.id, package_title: selected?.name,
    });
    if (res.ok) {
      setState("done");
      setMessage(res.duplicateWarning ? "Cliente registrado (ya lo habías registrado hace poco)." : "¡Cliente registrado!");
      router.refresh();
    } else {
      setState("error"); setMessage(res.error);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)} size="sm">+ Nuevo cliente</Button>;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-black text-slate-800">Registrar cliente</h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>

        {state === "done" ? (
          <div className="space-y-3 p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-3xl">✓</div>
            <p className="font-bold text-emerald-700">{message}</p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={reset}>Registrar otro</Button>
              <Button onClick={close}>Listo</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-5">
            <Field label="Nombre del cliente">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ana López" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono (WhatsApp)">
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="5555 5555" />
              </Field>
              <Field label="Correo" hint="Opcional">
                <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="cliente@correo.com" />
              </Field>
            </div>

            {/* Selector de paquete con preview */}
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Paquete de interés <span className="font-normal text-slate-400">(opcional)</span></span>
              {selected ? (
                <div className="mb-2 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.coverImage || "/package-fallback.svg"} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{selected.name}</p>
                    <p className="text-xs text-slate-500">📍 {selected.destination}{selected.basePrice ? ` · Q${selected.basePrice.toLocaleString("es-GT")}` : ""}</p>
                  </div>
                  <button onClick={() => setPkgId(null)} className="text-xs text-slate-400 underline">Quitar</button>
                </div>
              ) : (
                <>
                  <input className={cn(inputClass, "mb-2 py-2")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar paquete…" />
                  {packages.length === 0 ? (
                    <p className="text-xs text-slate-400">El catálogo aún no está disponible. Podés registrar el cliente sin paquete.</p>
                  ) : (
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1">
                      {filtered.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPkgId(p.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.coverImage || "/package-fallback.svg"} alt="" className="h-9 w-12 rounded-md object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-700">{p.name}</span>
                            <span className="block truncate text-[11px] text-slate-400">📍 {p.destination}</span>
                          </span>
                        </button>
                      ))}
                      {filtered.length === 0 ? <p className="px-2 py-2 text-xs text-slate-400">Sin resultados.</p> : null}
                    </div>
                  )}
                </>
              )}
            </div>

            <Field label="Nota" hint="Algo que le sirva al asesor (opcional)">
              <textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
            </Field>

            {state === "error" && message ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
            ) : null}

            <label className="flex items-start gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
              <span>
                Confirmo que el cliente autorizó compartir sus datos con Viajexmundo.{" "}
                <a href="/privacidad" target="_blank" rel="noreferrer" className="text-brand-600 underline">Aviso de privacidad</a>.
              </span>
            </label>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="ghost" onClick={close}>Cancelar</Button>
              <Button onClick={submit} disabled={state === "saving" || !name.trim() || !phone.trim() || !consent}>
                {state === "saving" ? "Registrando…" : "Registrar cliente"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
