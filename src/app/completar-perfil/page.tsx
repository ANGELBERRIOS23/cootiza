import { redirect } from "next/navigation";
import { getSessionProfile, homePathForRole } from "@/lib/auth/session";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { OnboardingForm } from "@/components/portal/onboarding-form";

export const metadata = { title: "Completá tu perfil — Cooitza" };

/**
 * Onboarding obligatorio: un promotor aprobado que aún no tiene agencia debe
 * elegir región + agencia antes de poder usar el portal. Está FUERA del layout
 * de /portal para no chocar con el gate que redirige acá.
 */
export default async function CompletarPerfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.status === "suspended") redirect("/cuenta-suspendida");
  if (profile.status === "pending_approval") redirect("/cuenta-pendiente");
  // Solo promotores sin agencia. El resto ya tiene su destino.
  if (profile.role !== "promoter" || profile.agency_id) redirect(homePathForRole(profile.role));

  const supabase = await createCooitzaServerClient();
  const { data: agencies } = await supabase
    .from("agencies")
    .select("id, name, region")
    .eq("is_active", true)
    .order("region")
    .order("name");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="mx-auto mb-4 h-9 w-auto" />
        <h1 className="text-center text-lg font-bold text-slate-900">¡Bienvenido, {profile.full_name?.split(" ")[0] || "promotor"}!</h1>
        <p className="mb-5 mt-1 text-center text-sm text-slate-500">
          Antes de empezar, confirmá tu región y la agencia a la que perteneces.
        </p>
        <OnboardingForm agencies={(agencies ?? []) as { id: string; name: string; region: string }[]} />
      </div>
    </div>
  );
}
