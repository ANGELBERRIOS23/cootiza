import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ActionButton } from "@/components/admin/action-button";
import { approveRedemption, setRedemptionStatus } from "@/lib/admin/actions";

export const metadata = { title: "Canjes — Cooitza Admin" };

const statusBadge: Record<string, { label: string; tone: "amber" | "blue" | "green" | "red" | "neutral" }> = {
  requested: { label: "Solicitado", tone: "amber" },
  approved: { label: "Aprobado", tone: "blue" },
  delivered: { label: "Entregado", tone: "green" },
  rejected: { label: "Rechazado", tone: "red" },
  cancelled: { label: "Cancelado", tone: "neutral" },
};

export default async function AdminCanjesPage() {
  const supabase = await createCooitzaServerClient();
  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("id, status, points_cost_snapshot, created_at, promoter:promoter_id(full_name), rewards(title)")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = redemptions ?? [];
  const pending = rows.filter((r) => r.status === "requested");
  const approved = rows.filter((r) => r.status === "approved");
  const history = rows.filter((r) => !["requested", "approved"].includes(r.status));

  // Supabase puede devolver los joins como objeto o como array; normalizamos.
  const pick = <T,>(v: T | T[] | null | undefined): T | undefined =>
    Array.isArray(v) ? v[0] : (v ?? undefined);
  const name = (r: { promoter?: unknown }) =>
    pick(r.promoter as { full_name?: string } | { full_name?: string }[])?.full_name ?? "Promotor";
  const reward = (r: { rewards?: unknown }) =>
    pick(r.rewards as { title?: string } | { title?: string }[])?.title ?? "Premio";

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Canjes</h1>

      <Section title={`Por aprobar (${pending.length})`}>
        {pending.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">Sin canjes pendientes.</p>
        ) : (
          pending.map((r) => (
            <Row key={r.id} name={name(r)} reward={reward(r)} pts={r.points_cost_snapshot} date={r.created_at} badge={statusBadge[r.status]}>
              <ActionButton action={approveRedemption.bind(null, r.id)} variant="primary">Aprobar</ActionButton>
              <ActionButton action={setRedemptionStatus.bind(null, r.id, "rejected", undefined)} variant="ghost" confirm="¿Rechazar este canje?">Rechazar</ActionButton>
            </Row>
          ))
        )}
      </Section>

      {approved.length > 0 ? (
        <Section title={`Aprobados — entregar (${approved.length})`}>
          {approved.map((r) => (
            <Row key={r.id} name={name(r)} reward={reward(r)} pts={r.points_cost_snapshot} date={r.created_at} badge={statusBadge[r.status]}>
              <ActionButton action={setRedemptionStatus.bind(null, r.id, "delivered", undefined)} variant="primary">Marcar entregado</ActionButton>
              <ActionButton action={setRedemptionStatus.bind(null, r.id, "cancelled", undefined)} variant="ghost" confirm="¿Cancelar? Se devuelven los puntos.">Cancelar</ActionButton>
            </Row>
          ))}
        </Section>
      ) : null}

      {history.length > 0 ? (
        <Section title="Historial">
          {history.map((r) => (
            <Row key={r.id} name={name(r)} reward={reward(r)} pts={r.points_cost_snapshot} date={r.created_at} badge={statusBadge[r.status]} />
          ))}
        </Section>
      ) : null}

      {rows.length === 0 ? <EmptyState emoji="🎁" title="Aún no hay canjes" /> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">{title}</h2>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </Card>
  );
}

function Row({
  name,
  reward,
  pts,
  date,
  badge,
  children,
}: {
  name: string;
  reward: string;
  pts: number;
  date: string;
  badge?: { label: string; tone: "amber" | "blue" | "green" | "red" | "neutral" };
  children?: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-800">{reward}</p>
        <p className="text-xs text-slate-400">
          {name} · {pts} pts · {new Date(date).toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
        {children}
      </div>
    </li>
  );
}
