"use client";

import { useState } from "react";
import { createLead } from "@/lib/leads/actions";
import { Button, Field, inputClass } from "@/components/ui";

/**
 * Formulario de captura de lead (≤30s para completar). Mobile-first.
 * Llama al Server Action createLead. Muestra confirmación o error inline.
 */
export function LeadForm({
  packageVxmId,
  packageTitle,
}: {
  packageVxmId?: string;
  packageTitle?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("saving");
    setMessage(null);
    const form = new FormData(e.currentTarget);

    const res = await createLead({
      client_name: String(form.get("client_name") ?? ""),
      client_phone: String(form.get("client_phone") ?? ""),
      client_email: String(form.get("client_email") ?? ""),
      notes: String(form.get("notes") ?? ""),
      package_vxm_id: packageVxmId,
      package_title: packageTitle,
    });

    if (res.ok) {
      setState("done");
      setMessage(
        res.duplicateWarning
          ? "Cliente registrado. Nota: ya habías registrado este teléfono hace poco."
          : "¡Cliente registrado! Un asesor lo va a contactar pronto.",
      );
    } else {
      setState("error");
      setMessage(res.error);
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <p className="font-semibold text-emerald-800">{message}</p>
        <button
          onClick={() => {
            setState("idle");
            setMessage(null);
          }}
          className="mt-3 text-sm font-medium text-emerald-700 underline"
        >
          Registrar otro cliente
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Nombre del cliente">
        <input name="client_name" required placeholder="Ej. Ana López" className={inputClass} />
      </Field>
      <Field label="Teléfono (WhatsApp)" hint="Por defecto +502. Podés escribir otro código de país.">
        <input
          name="client_phone"
          type="tel"
          required
          inputMode="tel"
          placeholder="5555 5555"
          className={inputClass}
        />
      </Field>
      <Field label="Correo (opcional)">
        <input name="client_email" type="email" placeholder="cliente@correo.com" className={inputClass} />
      </Field>
      <Field label="Nota (opcional)" hint="Algo que le sirva al asesor.">
        <textarea name="notes" maxLength={500} rows={2} className={inputClass} />
      </Field>

      {state === "error" && message ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
      ) : null}

      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
        <span>
          Confirmo que el cliente autorizó compartir sus datos con Viajexmundo para recibir asesoría de viaje.{" "}
          <a href="/privacidad" target="_blank" rel="noreferrer" className="text-brand-600 underline">Aviso de privacidad</a>.
        </span>
      </label>

      <Button type="submit" disabled={state === "saving" || !consent} className="w-full">
        {state === "saving" ? "Registrando…" : "Registrar cliente interesado"}
      </Button>
    </form>
  );
}
