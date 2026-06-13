"use client";

import { useState } from "react";
import { createReferral } from "@/lib/leads/actions";
import { Button, Field, inputClass } from "@/components/ui";

/**
 * El promotor registra una REFERENCIA: un cliente que un asesor de VXM mandó a la
 * oficina central. Elige al asesor + datos del cliente. Cuando el asesor confirma
 * la referencia en la plataforma central, el promotor gana puntos.
 */
export function ReferralForm({ advisors }: { advisors: { id: string; full_name: string }[] }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("saving");
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await createReferral({
      advisor_id: String(form.get("advisor_id") ?? ""),
      client_name: String(form.get("client_name") ?? ""),
      client_phone: String(form.get("client_phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
    });
    if (res.ok) {
      setState("done");
      setMessage(
        res.duplicateWarning
          ? "Referencia registrada. Nota: ya habías registrado este teléfono hace poco."
          : "¡Referencia registrada! Cuando el asesor la confirme, vas a ganar tus puntos.",
      );
    } else {
      setState("error");
      setMessage(res.error);
    }
  }

  if (advisors.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        No hay asesores disponibles por ahora. Probá más tarde.
      </p>
    );
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div>
        <p className="font-semibold text-emerald-800">{message}</p>
        <button
          onClick={() => { setState("idle"); setMessage(null); setConsent(false); }}
          className="mt-3 text-sm font-medium text-emerald-700 underline"
        >
          Registrar otra referencia
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Asesor que mandó al cliente">
        <select name="advisor_id" required defaultValue="" className={inputClass}>
          <option value="" disabled>Elegí un asesor…</option>
          {advisors.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name}</option>
          ))}
        </select>
      </Field>
      <Field label="Nombre del cliente">
        <input name="client_name" required placeholder="Ej. Ana López" className={inputClass} />
      </Field>
      <Field label="Teléfono (WhatsApp)" hint="Por defecto +502. Podés escribir otro código de país.">
        <input name="client_phone" type="tel" required inputMode="tel" placeholder="5555 5555" className={inputClass} />
      </Field>
      <Field label="Nota (opcional)" hint="Algo que le sirva al asesor.">
        <textarea name="notes" maxLength={500} rows={2} className={inputClass} />
      </Field>

      {state === "error" && message ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
      ) : null}

      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
        <span>Confirmo que el cliente autorizó compartir sus datos con Viajexmundo para su atención.</span>
      </label>

      <Button type="submit" disabled={state === "saving" || !consent} className="w-full">
        {state === "saving" ? "Registrando…" : "Registrar referencia"}
      </Button>
    </form>
  );
}
