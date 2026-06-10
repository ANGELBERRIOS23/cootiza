import { redirect } from "next/navigation";
import { PublicHome } from "@/components/public-home";
import { getActiveLandingVariant } from "@/lib/landing";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const { code, next } = await searchParams;
  // Red de seguridad: si Supabase redirige el OAuth al Site URL (la raíz) con el
  // ?code= en vez de a /auth/callback, lo reenviamos para completar la sesión.
  if (code) {
    const qs = new URLSearchParams({ code });
    if (next) qs.set("next", next);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const landingVariant = getActiveLandingVariant();
  return <PublicHome variant={landingVariant} />;
}
