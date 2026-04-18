import { PackageCatalog } from "@/components/package-catalog";
import { getPublishedPackages } from "@/lib/db/package-repository";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const travelPackages = await getPublishedPackages();

  return <PackageCatalog packages={travelPackages} />;
}
