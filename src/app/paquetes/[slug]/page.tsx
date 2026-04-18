import Link from "next/link";
import { notFound } from "next/navigation";
import { SafeImage } from "@/components/safe-image";
import { WhatsAppLeadCard } from "@/components/whatsapp-lead-card";
import { appConfig } from "@/lib/config";
import { getPublishedPackageBySlug } from "@/lib/db/package-repository";
import { formatPrice } from "@/lib/packages";

type PackagePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { slug } = await params;
  const travelPackage = await getPublishedPackageBySlug(slug);

  if (!travelPackage) {
    notFound();
  }

  const finalPrice =
    travelPackage.isOffer && travelPackage.offerPrice ? travelPackage.offerPrice : travelPackage.basePrice;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/paquetes" className="text-sm font-medium text-[#3C4F66] hover:text-[#2E3D4E]">
          {"<-"} Volver a paquetes
        </Link>

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-64 w-full sm:h-80">
            <SafeImage
              src={travelPackage.coverImage}
              alt={travelPackage.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {travelPackage.isOffer ? (
              <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-slate-900">
                {travelPackage.offerLabel || "Oferta"}
              </span>
            ) : null}
          </div>
          <div className="space-y-6 p-5 sm:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="md:max-w-2xl">
                <p className="text-sm font-semibold text-[#3C4F66]">{travelPackage.packageCode}</p>
                <h1 className="text-2xl font-semibold sm:text-3xl">{travelPackage.name}</h1>
                <p className="mt-2 text-slate-600">{travelPackage.summary}</p>
                <p className="mt-2 text-sm text-slate-500">{travelPackage.description}</p>
              </div>
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-left sm:w-auto sm:min-w-56 sm:text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">💰 Precio</p>
                {travelPackage.isOffer && travelPackage.offerPrice ? (
                  <div>
                    <p className="text-sm text-slate-400 line-through">
                      {formatPrice(travelPackage.basePrice, travelPackage.currency)}
                    </p>
                    <p className="text-2xl font-semibold text-emerald-700">
                      {formatPrice(finalPrice, travelPackage.currency)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">{formatPrice(finalPrice, travelPackage.currency)}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <h2 className="mb-3 text-xl font-semibold">🗺️ Itinerario</h2>
                  <div className="space-y-3">
                    {travelPackage.itinerary.map((step) => (
                      <div key={step.day} className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-[#3C4F66]">📅 Dia {step.day}</p>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xl font-semibold">📸 Galeria</h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {(travelPackage.gallery.length > 0 ? travelPackage.gallery : [travelPackage.coverImage]).map(
                      (imageUrl, index) => (
                        <div key={`${travelPackage.id}-${index}`} className="relative h-40 overflow-hidden rounded-xl">
                          <SafeImage
                            src={imageUrl}
                            alt={`${travelPackage.name} foto ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-2 font-semibold">✅ Incluye</h3>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {travelPackage.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-2 font-semibold">❌ No incluye</h3>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {travelPackage.excludes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <WhatsAppLeadCard
                  phoneNumber={appConfig.whatsappNumber}
                  packageCode={travelPackage.packageCode}
                  packageName={travelPackage.name}
                />
              </aside>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
