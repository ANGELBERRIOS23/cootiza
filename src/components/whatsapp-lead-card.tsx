"use client";

import { useMemo, useState } from "react";

type WhatsAppLeadCardProps = {
  phoneNumber: string;
  packageCode: string;
  packageName: string;
};

export function WhatsAppLeadCard({ phoneNumber, packageCode, packageName }: WhatsAppLeadCardProps) {
  const [fullName, setFullName] = useState("");
  const [tentativeDate, setTentativeDate] = useState("");
  const [peopleCount, setPeopleCount] = useState("2");

  const normalizedPhone = useMemo(() => phoneNumber.replace(/[^\d]/g, ""), [phoneNumber]);

  const isValid = fullName.trim().length >= 3 && tentativeDate.trim().length > 0 && Number(peopleCount) > 0;

  function openWhatsApp() {
    const message = [
      `Hola, quiero informacion del paquete ${packageCode} - ${packageName}.`,
      `Nombre: ${fullName.trim()}`,
      `Fecha tentativa: ${tentativeDate}`,
      `Personas: ${peopleCount}`,
    ].join("\n");

    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="font-semibold">💬 Solicita este paquete</h3>
        <p className="text-sm text-slate-600">Completa estos datos y te llevamos directo a WhatsApp.</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">🙋 Tu nombre</span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Ej. Ana Lopez"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">📅 Fecha tentativa</span>
        <input
          type="date"
          value={tentativeDate}
          onChange={(event) => setTentativeDate(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">👥 # de personas</span>
        <input
          type="number"
          min={1}
          value={peopleCount}
          onChange={(event) => setPeopleCount(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <button
        type="button"
        onClick={openWhatsApp}
        disabled={!isValid}
        className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Enviar por WhatsApp 📲
      </button>
    </div>
  );
}
