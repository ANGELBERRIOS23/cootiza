export type TravelPackage = {
  id: string;
  packageCode: string;
  slug: string;
  name: string;
  destination: string;
  durationDays: number;
  basePrice: number;
  offerPrice: number | null;
  isOffer: boolean;
  offerLabel: string | null;
  currency: "GTQ";
  summary: string;
  description: string;
  coverImage: string;
  gallery: string[];
  includes: string[];
  excludes: string[];
  itinerary: Array<{ day: number; title: string; description: string }>;
};

export function formatPrice(price: number, currency: "GTQ") {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function buildWhatsAppUrl(
  phoneNumber: string,
  packageCode: string,
  packageName: string,
) {
  const normalizedPhone = phoneNumber.replace(/[^\d]/g, "");
  const message = `Hola, quiero informacion del paquete ${packageCode} - ${packageName}.`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
