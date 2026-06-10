import Link from "next/link";
import { notFound } from "next/navigation";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getStageMap, stageTone } from "@/lib/leads/stages";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { AdjustPointsForm } from "@/components/admin/adjust-points-form";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { PromoterCodeEditor } from "@/components/admin/promoter-code-editor";
import { EditUserModal } from "@/components/admin/edit-user-modal";

export const metadata = { title: "Promotor — Cooitza Admin" };

const statusBadge: Record<string, { label: string; tone: "green" | "amber" | "red" | "neutral" }> = {
  active: { label: "Activo", tone: "green" },
  pending_approval: { label: "Pendiente", tone: "amber" },
  suspended: { label: "Suspendido", tone: "red" },
};

const reasonLabel: Record<string, string> = {
  sale_closed: "Venta cerrada",
  redemption: "Canje",
  admin_adjustment: "Ajuste",
  reversal: "Reverso",
};

export default async function PromoterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCooitzaServerClient();

  const [{ data: promoter }, { data: leads }, { data: ledger }, { data: agencies }, { data: directory }, stageMap] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, role, status, points_balance, avatar_url, vxm_promoter_code, agency_id, supervised_region, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("lead_mirror")
      .select("id, client_name, client_phone, package_title, current_stage, created_at")
      .eq("promoter_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("points_ledger")
      .select("id, delta, reason, description, created_at")
      .eq("promoter_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("agencies").select("id, name, region").eq("is_active", true).order("name"),
    supabase.rpc("admin_user_directory"),
    getStageMap(),
  ]);

  if (!promoter) notFound();

  const email = ((directory ?? []) as { id: string; email: string }[]).find((d) => d.id === id)?.email ?? null;

  const clients = leads ?? [];
  const moves = ledger ?? [];
  const st = statusBadge[promoter.status] ?? { label: promoter.status, tone: "neutral" as const };
  const lastClient = clients[0]?.created_at;

  return (
    <div className="space-y-5">
      <Link href="/admin/promotores" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Promotores
      </Link>

      {/* Cabecera del promotor */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={promoter.full_name || "Promotor"} url={promoter.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">{promoter.full_name || "(sin nombre)"}</h1>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {email ?? "Sin correo"}{promoter.phone ? ` · ${promoter.phone}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EditUserModal
              user={{
                id: promoter.id,
                full_name: promoter.full_name,
                email,
                phone: promoter.phone,
                role: promoter.role,
                status: promoter.status,
                agency_id: promoter.agency_id ?? null,
                supervised_region: promoter.supervised_region ?? null,
              }}
              agencies={(agencies ?? []) as { id: string; name: string; region: string }[]}
            />
            {promoter.role === "promoter" && promoter.status === "active" ? (
              <ImpersonateButton promoterId={promoter.id} />
            ) : null}
          </div>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <PromoterCodeEditor promoterId={promoter.id} current={promoter.vxm_promoter_code ?? null} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Puntos" value={promoter.points_balance} tone="gold" icon="⭐" />
        <StatCard label="Clientes" value={clients.length} tone="brand" icon="📇" />
        <StatCard
          label="Último cliente"
          value={lastClient ? fmt(lastClient) : "—"}
          tone="slate"
          icon="🗓️"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ajuste de puntos */}
        <Card className="p-5">
          <AdjustPointsForm promoterId={promoter.id} balance={promoter.points_balance} />
          {moves.length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Movimientos recientes</p>
              <ul className="space-y-1.5">
                {moves.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-600">{reasonLabel[m.reason] ?? m.reason}</span>
                    <Badge tone={m.delta >= 0 ? "green" : "red"}>{m.delta >= 0 ? "+" : ""}{m.delta}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        {/* Clientes del promotor */}
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800">Clientes registrados ({clients.length})</h2>
          {clients.length === 0 ? (
            <p className="text-sm text-slate-500">Este promotor aún no registró clientes.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {clients.map((c) => {
                const meta = stageMap[c.current_stage];
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{c.client_name}</p>
                      <p className="text-xs text-slate-400">
                        {c.package_title ? `🧳 ${c.package_title} · ` : ""}{fmt(c.created_at)}
                      </p>
                    </div>
                    <Badge tone={stageTone(meta)}>{meta?.display_name ?? "Registrado"}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {clients.length === 0 && moves.length === 0 ? (
        <EmptyState emoji="📭" title="Sin actividad todavía" description="Cuando registre clientes o gane puntos, vas a verlo acá." />
      ) : null}
    </div>
  );
}

function fmt(s: string): string {
  try {
    return new Date(s).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}
