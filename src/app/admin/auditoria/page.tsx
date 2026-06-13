import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Card, Badge, EmptyState } from "@/components/ui";
import { ActionButton } from "@/components/admin/action-button";
import { deleteAuditEntry, clearAuditLog } from "@/lib/admin/actions";

export const metadata = { title: "Auditoría — Cooitza Admin" };

const pick = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

const actionTone = (a: string): "green" | "red" | "amber" | "brand" | "neutral" => {
  if (a.includes("create") || a.includes("active")) return "green";
  if (a.includes("delete") || a.includes("reject") || a.includes("suspend") || a.includes("clear")) return "red";
  if (a.includes("impersonation")) return "amber";
  if (a.includes("approve") || a.includes("redemption") || a.includes("points")) return "brand";
  return "neutral";
};

// Nombre amigable de una clave de configuración (target_id de setting:update).
const SETTING_LABELS: Record<string, string> = {
  lead_assignment_mode: "Asignación de leads",
  registration_mode: "Alta de promotores",
  cooitza_advisor_ids: "Asesores que reciben leads",
  cooitza_region_advisors: "Asignación por región",
  cooitza_referral_points: "Puntos por referencia",
  lead_rate_limit_per_hour: "Límite de registros por hora",
};

// Etiqueta corta para el "chip" + descripción humana de la acción.
function describe(action: string, targetId: string | null, after: unknown): { chip: string; text: string } {
  const [base, sub] = action.split(":");
  const a = after as Record<string, unknown> | null;
  switch (base) {
    case "pipeline":
      return { chip: "Sincronización", text: "Sincronizó manualmente con la plataforma central" };
    case "impersonation":
      return { chip: "Ver como", text: sub === "start" ? "Empezó a ver el portal como un promotor" : "Dejó de ver el portal como promotor" };
    case "setting":
      return { chip: "Configuración", text: `Cambió la configuración: ${SETTING_LABELS[String(targetId ?? "")] ?? "ajuste del portal"}` };
    case "points_ratio":
      return { chip: "Puntos", text: "Cambió cuántos puntos da el rendimiento de una venta" };
    case "points":
      return { chip: "Puntos", text: `Ajustó puntos a un promotor${a?.delta != null ? ` (${Number(a.delta) > 0 ? "+" : ""}${a.delta})` : ""}` };
    case "promoter_status":
      return { chip: "Promotor", text: sub === "active" ? "Activó la cuenta de un promotor" : sub === "suspended" ? "Suspendió a un promotor" : "Dejó pendiente a un promotor" };
    case "promoter_vxm_code":
      return { chip: "Promotor", text: "Asignó el código de plataforma a un promotor" };
    case "reward":
      return { chip: "Premio", text: sub === "active" ? "Cambió la disponibilidad de un premio" : "Creó o editó un premio" };
    case "redemption":
      return { chip: "Canje", text: sub === "delete" ? "Eliminó un canje del historial" : sub === "approved" ? "Aprobó un canje" : sub === "rejected" ? "Rechazó un canje" : sub === "delivered" ? "Marcó un canje como entregado" : sub === "cancelled" ? "Canceló un canje (devolvió puntos)" : `Cambió un canje (${sub})` };
    case "client":
      return { chip: "Cliente", text: "Eliminó un cliente del portal" };
    case "user":
      return { chip: "Promotor", text: "Editó el perfil de un promotor" };
    case "audit":
      return { chip: "Auditoría", text: "Limpió el registro de auditoría" };
    default:
      return { chip: base ?? action, text: action.replace(/[:_]/g, " ") };
  }
}

export default async function AdminAuditoriaPage() {
  const supabase = await createCooitzaServerClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, action, target_table, target_id, after, created_at, actor:actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Auditoría</h1>
          <p className="text-sm text-slate-500">Acciones del panel administrativo (últimas 300).</p>
        </div>
        {rows.length > 0 && (
          <ActionButton action={clearAuditLog} variant="danger" confirm="¿Borrar TODO el registro de auditoría? Esta acción no se puede deshacer.">
            Limpiar todo
          </ActionButton>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState emoji="🗒️" title="Sin registros todavía" description="Las acciones del panel quedarán registradas acá." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const actor = pick(r.actor as { full_name?: string } | { full_name?: string }[])?.full_name ?? "Sistema";
              const { chip, text } = describe(r.action, r.target_id, r.after);
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      <Badge tone={actionTone(r.action)}>{chip}</Badge>
                      <span className="truncate text-slate-700">{text}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      por {actor} ·{" "}
                      {new Date(r.created_at).toLocaleString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ActionButton
                    action={deleteAuditEntry.bind(null, r.id)}
                    variant="ghost"
                    confirm="¿Eliminar esta entrada del registro?"
                    className="shrink-0 text-slate-400 hover:text-red-600"
                  >
                    Eliminar
                  </ActionButton>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
