"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2 } from "lucide-react";
import { completeOnboarding } from "@/lib/portal/onboarding";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

type Agency = { id: string; name: string; region: string };

/**
 * Onboarding del promotor: elige región y luego una agencia de esa región
 * (solo de las que el admin ya creó). No puede crear agencias.
 */
export function OnboardingForm({ agencies }: { agencies: Agency[] }) {
  const router = useRouter();
  const [region, setRegion] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo las regiones que tienen agencias activas.
  const regions = useMemo(
    () => Array.from(new Set(agencies.map((a) => a.region))).sort(),
    [agencies],
  );
  const inRegion = useMemo(
    () => agencies.filter((a) => a.region === region),
    [agencies, region],
  );

  async function save() {
    if (!agencyId) {
      setError("Elegí tu agencia para continuar.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await completeOnboarding(agencyId);
    if (res.ok) {
      router.replace("/portal");
      router.refresh();
    } else {
      setSaving(false);
      setError(res.error);
    }
  }

  if (agencies.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Todavía no hay agencias disponibles. Escribile a tu administrador para que cree tu agencia y
        luego volvé a entrar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <MapPin className="h-4 w-4 text-slate-400" /> Región
        </span>
        <select
          className={cn(inputClass, "py-2.5")}
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            setAgencyId("");
          }}
        >
          <option value="">Elegí tu región…</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      {region ? (
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Building2 className="h-4 w-4 text-slate-400" /> Agencia
          </span>
          <select className={cn(inputClass, "py-2.5")} value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
            <option value="">Elegí tu agencia…</option>
            {inRegion.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Button onClick={save} disabled={saving || !agencyId} className="w-full">
        {saving ? "Guardando…" : "Continuar"}
      </Button>
    </div>
  );
}
