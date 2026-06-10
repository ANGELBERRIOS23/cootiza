import { getPublishedPackages } from "@/lib/db/package-repository";
import { CatalogGrid } from "@/components/portal/catalog-grid";

export const metadata = { title: "Catálogo — Portal Cooitza" };
export const revalidate = 60; // ISR: refresca el catálogo cada 60s

export default async function CatalogoPage() {
  const packages = await getPublishedPackages();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Catálogo</h1>
        <p className="text-sm text-slate-500">
          Elegí un paquete y registrá al cliente interesado en segundos.
        </p>
      </header>
      <CatalogGrid packages={packages} />
    </div>
  );
}
