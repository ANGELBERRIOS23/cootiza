"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TravelPackage } from "@/lib/packages";
import { formatPrice } from "@/lib/packages";
import { Badge, Card, EmptyState, inputClass } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/cn";

/**
 * Grid de catálogo del portal con búsqueda + filtro por destino. Mobile-first:
 * 1 columna en móvil, 2-3 en pantallas grandes. Cada tarjeta lleva al detalle
 * con el CTA de registrar cliente interesado.
 */
export function CatalogGrid({ packages }: { packages: TravelPackage[] }) {
  const [query, setQuery] = useState("");
  const [destino, setDestino] = useState("todos");

  const destinos = useMemo(() => {
    const set = new Set(packages.map((p) => p.destination).filter(Boolean));
    return ["todos", ...Array.from(set).sort()];
  }, [packages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      if (destino !== "todos" && p.destination !== destino) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q) ||
        p.packageCode.toLowerCase().includes(q)
      );
    });
  }, [packages, query, destino]);

  if (packages.length === 0) {
    return (
      <EmptyState
        emoji="🧳"
        title="El catálogo aún no está disponible"
        description="En cuanto se conecte el catálogo de la agencia vas a ver acá todos los paquetes para ofrecer a tus clientes."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros — sticky en móvil para acceso rápido */}
      <div className="sticky top-[57px] z-[5] -mx-4 bg-slate-50/90 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar destino, paquete o código…"
            className={inputClass}
          />
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className={cn(inputClass, "sm:w-56")}
          >
            {destinos.map((d) => (
              <option key={d} value={d}>
                {d === "todos" ? "Todos los destinos" : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} {filtered.length === 1 ? "paquete" : "paquetes"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="Sin resultados" description="Probá con otro destino o término de búsqueda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: TravelPackage }) {
  return (
    <Link href={`/portal/catalogo/${pkg.slug}`} className="group">
      <Card className="h-full overflow-hidden transition group-hover:border-brand-300 group-hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <SafeImage
            src={pkg.coverImage}
            alt={pkg.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {pkg.isOffer ? (
            <span className="absolute left-2 top-2">
              <Badge tone="red">{pkg.offerLabel ?? "Oferta"}</Badge>
            </span>
          ) : null}
        </div>
        <div className="space-y-1.5 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{pkg.packageCode}</span>
            {pkg.durationDays > 0 ? <span>· {pkg.durationDays} días</span> : null}
          </div>
          <h3 className="line-clamp-2 font-bold leading-tight text-slate-800">{pkg.name}</h3>
          <p className="flex items-center gap-1 text-sm text-slate-500">📍 {pkg.destination}</p>
          <div className="flex items-baseline gap-2 pt-1">
            {pkg.isOffer && pkg.offerPrice ? (
              <>
                <span className="text-lg font-black text-brand-600">{formatPrice(pkg.offerPrice, pkg.currency)}</span>
                <span className="text-xs text-slate-400 line-through">{formatPrice(pkg.basePrice, pkg.currency)}</span>
              </>
            ) : (
              <span className="text-lg font-black text-brand-600">{formatPrice(pkg.basePrice, pkg.currency)}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
