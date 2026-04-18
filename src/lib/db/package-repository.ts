import { supabase } from "@/lib/supabase";
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
  };
}

export async function getPublishedPackages(): Promise<TravelPackage[]> {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("is_public_cooitza", true)
    .order("has_offer", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase getPublishedPackages error:", error.message);
    return [];
  }

  return (data ?? []).map(mapSupabasePackage);
}

export async function getPublishedPackageBySlug(slug: string): Promise<TravelPackage | null> {
  const packages = await getPublishedPackages();
  return packages.find((p) => p.slug === slug) ?? null;
}
