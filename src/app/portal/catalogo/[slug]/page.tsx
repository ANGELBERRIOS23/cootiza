import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPackageBySlug } from "@/lib/db/package-repository";
import { formatPrice } from "@/lib/packages";
import { Badge, Card } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { LeadForm } from "@/components/portal/lead-form";

export const revalidate = 60;

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = await getPublishedPackageBySlug(slug);
  if (!pkg) notFound();

  const price = pkg.isOffer && pkg.offerPrice ? pkg.offerPrice : pkg.basePrice;

  return (
    <div className="space-y-5">
      <Link href="/portal/catalogo" className="text-sm text-slate-500 hover:underline">
        ← Volver al catálogo
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative aspect-[16/10] w-full bg-slate-100 sm:aspect-[21/9]">
          <SafeImage src={pkg.coverImage} alt={pkg.name} fill className="object-cover" sizes="100vw" priority />
          {pkg.isOffer ? (
            <span className="absolute left-3 top-3">
              <Badge tone="red">{pkg.offerLabel ?? "Oferta"}</Badge>
            </span>
          ) : null}
        </div>
        <div className="space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{pkg.packageCode}</span>
            {pkg.durationDays > 0 ? <span>· {pkg.durationDays} días</span> : null}
            <Badge tone="brand">📍 {pkg.destination}</Badge>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">{pkg.name}</h1>
          {pkg.summary ? <p className="text-sm text-slate-600">{pkg.summary}</p> : null}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-black text-brand-600">{formatPrice(price, pkg.currency)}</span>
            {pkg.isOffer && pkg.offerPrice ? (
              <span className="text-sm text-slate-400 line-through">{formatPrice(pkg.basePrice, pkg.currency)}</span>
            ) : null}
            <span className="text-xs text-slate-400">por persona</span>
          </div>
        </div>
      </Card>

      {/* Layout: detalle + form. En desktop, form sticky a la derecha. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 order-2 lg:order-1">
          {pkg.description ? (
            <Card className="p-4 sm:p-5">
              <h2 className="mb-2 font-bold text-slate-800">Descripción</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{pkg.description}</p>
            </Card>
          ) : null}

          {pkg.includes.length > 0 ? (
            <Card className="p-4 sm:p-5">
              <h2 className="mb-2 font-bold text-slate-800">Incluye</h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {pkg.includes.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500">✓</span> {it}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {pkg.excludes.length > 0 ? (
            <Card className="p-4 sm:p-5">
              <h2 className="mb-2 font-bold text-slate-800">No incluye</h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {pkg.excludes.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-slate-300">✕</span> {it}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {pkg.itinerary.length > 0 ? (
            <Card className="p-4 sm:p-5">
              <h2 className="mb-3 font-bold text-slate-800">Itinerario</h2>
              <ol className="space-y-3">
                {pkg.itinerary.map((d) => (
                  <li key={d.day} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {d.day}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                      <p className="text-sm text-slate-500">{d.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>

        {/* Form de lead */}
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-[72px]">
            <Card className="p-4 sm:p-5">
              <h2 className="mb-1 font-bold text-slate-800">Registrar cliente interesado</h2>
              <p className="mb-3 text-xs text-slate-500">
                Tomá los datos y un asesor lo contacta. Vos seguís la venta desde “Mis clientes”.
              </p>

              {pkg.estimatedPoints && pkg.estimatedPoints > 0 ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-amber-600">
                      ≈ {pkg.estimatedPoints.toLocaleString("es-GT")}
                    </span>
                    <span className="text-sm font-semibold text-amber-700">puntos</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                    Estimado. Los puntos se acreditan al <strong>concretarse la venta</strong> y pueden variar (subir o
                    bajar) hasta el cierre; ahí quedan congelados a su valor final.
                  </p>
                </div>
              ) : (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-700">
                  Ganás <strong>puntos</strong> cuando esta venta se concrete. El monto se confirma y queda congelado al
                  cierre.
                </div>
              )}

              <LeadForm packageVxmId={pkg.id} packageTitle={pkg.name} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
