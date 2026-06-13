import { listReferralAdvisors } from "@/lib/leads/actions";
import { Card } from "@/components/ui";
import { ReferralForm } from "@/components/portal/referral-form";

export const metadata = { title: "Referir — Portal Cooitza" };

export default async function ReferenciaPage() {
  const advisors = await listReferralAdvisors();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Registrar referencia</h1>
        <p className="text-sm text-slate-500">
          ¿Un asesor de Viajexmundo mandó un cliente a la oficina? Registralo acá eligiendo al asesor.
          Cuando el asesor confirme la referencia en la plataforma, ganás tus puntos.
        </p>
      </header>
      <Card className="p-5">
        <ReferralForm advisors={advisors} />
      </Card>
    </div>
  );
}
