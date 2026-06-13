import { unstable_cache } from "next/cache";
import { getVxmCatalogClient } from "@/lib/db/vxm-catalog";
import type { TravelPackage } from "@/lib/packages";
import { buildSlug } from "@/lib/packages";

function mapSupabasePackage(p: Record<string, unknown>): TravelPackage {
  return {
    id: String(p.id ?? ""),
    packageCode: String(p.code ?? ""),
    slug: buildSlug(String(p.title ?? "")),
    name: String(p.title ?? ""),
    destination: String(p.destination ?? ""),
    durationDays: Number(p.duration_days) || 0,
    basePrice: Number(p.price) || 0,
    offerPrice: p.offer_price ? Number(p.offer_price) : null,
    isOffer: Boolean(p.has_offer),
    offerLabel: p.offer_label ? String(p.offer_label) : null,
    currency: "GTQ",
    summary: String(p.summary ?? ""),
    description: String(p.description ?? ""),
    coverImage: String(p.cover_image ?? ""),
    gallery: Array.isArray(p.gallery) ? (p.gallery as string[]) : [],
    includes: Array.isArray(p.includes) ? (p.includes as string[]) : [],
    excludes: Array.isArray(p.excludes) ? (p.excludes as string[]) : [],
    itinerary: Array.isArray(p.itinerary)
      ? (p.itinerary as Array<{ day: number; title: string; description: string }>)
      : [],
    estimatedPoints: p.cooitza_estimated_points != null ? Number(p.cooitza_estimated_points) : null,
  };
}

async function fetchPublishedPackages(): Promise<TravelPackage[]> {
  const supabase = getVxmCatalogClient();
  if (!supabase) return []; // VXM no configurado → catálogo vacío (degradación)

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("is_public_cooitza", true)
    .order("has_offer", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Catalog getPublishedPackages error:", error.message);
    return [];
  }

  return (data ?? []).map(mapSupabasePackage);
}

/**
 * Catálogo cacheado 5 min (rara vez cambia). Evita golpear VXM en cada request
 * de dashboard/catálogo/modal de cliente. Se revalida solo o con la tag "catalog".
 */
export const getPublishedPackages = unstable_cache(fetchPublishedPackages, ["cooitza-published-packages"], {
  revalidate: 300,
  tags: ["catalog"],
});

export async function getPublishedPackageBySlug(slug: string): Promise<TravelPackage | null> {
  const packages = await getPublishedPackages();
  return packages.find((p) => p.slug === slug) ?? null;
}
