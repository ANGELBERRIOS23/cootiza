export const landingVariantValues = ["default", "cooitza"] as const;
export type LandingVariant = (typeof landingVariantValues)[number];

export function getActiveLandingVariant(): LandingVariant {
  return "cooitza";
}
