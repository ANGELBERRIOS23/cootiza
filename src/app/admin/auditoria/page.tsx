import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Card, Badge, EmptyState } from "@/components/ui";

export const metadata = { title: "Auditoría — Cooitza Admin" };

const pick = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

const actionTone = (a: string): "green" | "red" | "amber" | "brand" | "neutral" => {
  if (a.includes("create") || a.includes("active")) return "green";
  if (a.includes("delete") || a.includes("reject") || a.includes("suspend")) return "red";
  if (a.includes("impersonation")) return "amber";
  if (a.includes("approve") || a.includes("redemption")) return "brand";
  return "neutral";
};

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
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500">Registro de acciones administrativas (últimas 300).</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState emoji="🗒️" title="Sin registros todavía" description="Las acciones del panel quedarán registradas acá." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const actor = pick(r.actor as { full_name?: string } | { full_name?: string }[])?.full_name ?? "Sistema";
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      <Badge tone={actionTone(r.action)}>{r.action}</Badge>
                      <span className="truncate text-slate-600">{r.target_table}{r.target_id ? ` · ${String(r.target_id).slice(0, 8)}` : ""}</span>
                    </p>
                    <p className="text-xs text-slate-400">por {actor}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
