import { PublicHome } from "@/components/public-home";
import { getActiveLandingVariant } from "@/lib/landing";

export default function Home() {
  const landingVariant = getActiveLandingVariant();

  return <PublicHome variant={landingVariant} />;
}
