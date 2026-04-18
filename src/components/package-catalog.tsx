import Image from "next/image";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { appConfig } from "@/lib/config";
import type { TravelPackage } from "@/lib/packages";
import { formatPrice } from "@/lib/packages";

type PackageCatalogProps = {
  packages: TravelPackage[];
};

export function PackageCatalog({ packages }: PackageCatalogProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-3 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8 lg:pt-10">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-7">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-10 w-28 shrink-0 sm:h-12 sm:w-40">
              <Image src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} fill className="object-contain" sizes="160px" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Catalogo</p>
              <h1 className="mt-0.5 text-2xl font-black uppercase leading-none text-[#3C4F66] sm:text-3xl">
                Paquetes disponibles
              </h1>
            </div>
          </div>
        </header>

        {packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            Todavia no hay paquetes publicados. Publica uno desde /admin para verlo aqui.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((travelPackage) => {
              const finalPrice =
                travelPackage.isOffer && travelPackage.offerPrice ? travelPackage.offerPrice : travelPackage.basePrice;

              return (
                <article
                  key={travelPackage.packageCode}
                  className={`mx-auto w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:max-w-none ${
                    travelPackage.isOffer ? "border-amber-300 ring-2 ring-amber-200" : "border-slate-200"
                  }`}
                >
                  <div className="relative h-44 w-full sm:h-48">
                    <SafeImage
                      src={travelPackage.coverImage}
                      alt={travelPackage.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    {travelPackage.isOffer ? (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900">
                        {travelPackage.offerLabel || "Oferta"}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                        {travelPackage.packageCode}
                      </span>
                      <span className="shrink-0 text-sm text-slate-500">🕒 {travelPackage.durationDays} dias</span>
                    </div>
                    <h2 className="break-words text-lg font-semibold leading-tight sm:text-xl">{travelPackage.name}</h2>
                    <p className="break-words text-sm text-slate-600">{travelPackage.summary}</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">💰 Desde</p>
                        {travelPackage.isOffer && travelPackage.offerPrice ? (
                          <div className="space-y-1">
                            <p className="text-sm text-slate-400 line-through">
                              {formatPrice(travelPackage.basePrice, travelPackage.currency)}
                            </p>
                            <p className="text-lg font-semibold text-emerald-700">
                              {formatPrice(finalPrice, travelPackage.currency)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-semibold text-slate-900">
                            {formatPrice(finalPrice, travelPackage.currency)}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/paquetes/${travelPackage.slug}`}
                        className="w-full rounded-lg bg-[#3C4F66] px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-[#324356] sm:w-auto"
                      >
                        Ver paquete 👀
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
