import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Card } from "@/components/ui";
import { ModeSetting, RatioSetting } from "@/components/admin/settings-forms";
import { StageEditor } from "@/components/admin/stage-editor";

export const metadata = { title: "Configuración — Cooitza Admin" };

function val(settings: { key: string; value: unknown }[], key: string, fallback: string) {
  const row = settings.find((s) => s.key === key);
  if (!row) return fallback;
  return typeof row.value === "string" ? row.value : String(row.value).replace(/"/g, "");
}

export default async function AdminConfigPage() {
  const supabase = await createCooitzaServerClient();
  const [{ data: settings }, { data: rule }, { data: stages }] = await Promise.all([
    supabase.from("app_settings").select("key, value"),
    supabase.from("points_rules").select("points_per_q_yield").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("pipeline_stage_map").select("id, vxm_stage_code, display_name, is_won, is_terminal, display_order").order("display_order"),
  ]);

  const s = settings ?? [];
  const registrationMode = val(s, "registration_mode", "approval");
  const assignmentMode = val(s, "lead_assignment_mode", "manual");
  const ratio = Number(rule?.points_per_q_yield ?? 1);

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
    </div>
  );
}
