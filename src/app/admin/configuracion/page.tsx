import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Card } from "@/components/ui";
import { ModeSetting, RatioSetting } from "@/components/admin/settings-forms";
import { StageEditor } from "@/components/admin/stage-editor";
import { SyncNowButton } from "@/components/admin/sync-now-button";
import { CooitzaAdvisorsSetting } from "@/components/admin/cooitza-advisors-setting";
import { listVxmAdvisors } from "@/lib/admin/actions";

export const metadata = { title: "Configuración — Cooitza Admin" };

function val(settings: { key: string; value: unknown }[], key: string, fallback: string) {
  const row = settings.find((s) => s.key === key);
  if (!row) return fallback;
  return typeof row.value === "string" ? row.value : String(row.value).replace(/"/g, "");
}

export default async function AdminConfigPage() {
  const supabase = await createCooitzaServerClient();
  const [{ data: settings }, { data: rule }, { data: stages }, vxmAdvisors] = await Promise.all([
    supabase.from("app_settings").select("key, value"),
    supabase.from("points_rules").select("points_per_q_yield").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("pipeline_stage_map").select("id, vxm_stage_code, display_name, is_won, is_terminal, display_order").order("display_order"),
    listVxmAdvisors(),
  ]);

  const s = settings ?? [];
  const registrationMode = val(s, "registration_mode", "approval");
  const assignmentMode = val(s, "lead_assignment_mode", "manual");
  const ratio = Number(rule?.points_per_q_yield ?? 1);
  const advisorIdsRow = s.find((r) => r.key === "cooitza_advisor_ids");
  const selectedAdvisorIds: string[] = Array.isArray(advisorIdsRow?.value) ? (advisorIdsRow!.value as string[]) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Configuración</h1>

      <Card className="space-y-5 p-5">
        <ModeSetting
          settingKey="lead_assignment_mode"
          current={assignmentMode}
          label="Asignación de leads"
          help="Cómo se asignan a un asesor los clientes que registran los promotores."
          options={[
            { value: "manual", label: "Manual (un admin reparte)" },
            { value: "random", label: "Aleatoria (round-robin)" },
          ]}
        />
        <hr className="border-slate-100" />
        <ModeSetting
          settingKey="registration_mode"
          current={registrationMode}
          label="Alta de promotores"
          help="Cómo entran nuevos promotores al portal."
          options={[
            { value: "approval", label: "Con aprobación" },
            { value: "open", label: "Abierta" },
            { value: "invite", label: "Solo por invitación" },
          ]}
        />
        <hr className="border-slate-100" />
        <RatioSetting current={ratio} />
      </Card>

      <Card className="p-5">
        <StageEditor stages={(stages ?? []) as { id: string; vxm_stage_code: string; display_name: string; is_won: boolean; is_terminal: boolean; display_order: number }[]} />
      </Card>

      <Card className="space-y-3 p-5">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Sincronización con la plataforma (VXM)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Las etapas y los puntos se traen del CRM una vez al día automáticamente. Las etapas solo
            avanzan después de que un asesor convierte el lead en oportunidad dentro de VXM. Usá este
            botón para forzar la sincronización al instante (pruebas o casos urgentes).
          </p>
        </div>
        <SyncNowButton />
      </Card>

      <Card className="space-y-3 p-5">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Asesores que reciben leads de Cooitza</h2>
          <p className="mt-1 text-xs text-slate-500">
            Lista en vivo de las cuentas de la plataforma con acceso al CRM. En modo aleatorio los
            leads se reparten solo entre los marcados, y a cada uno le llega una notificación en VXM
            cuando se le asigna un lead de Cooitza.
          </p>
        </div>
        <CooitzaAdvisorsSetting advisors={vxmAdvisors} selected={selectedAdvisorIds} />
      </Card>
    </div>
  );
}
