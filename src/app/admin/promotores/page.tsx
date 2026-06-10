import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ActionButton } from "@/components/admin/action-button";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { CreatePromotersModal } from "@/components/admin/create-promoters-modal";
import { setPromoterStatus } from "@/lib/admin/actions";

export const metadata = { title: "Promotores — Cooitza Admin" };

const statusBadge: Record<string, { label: string; tone: "green" | "amber" | "red" | "neutral" }> = {
  active: { label: "Activo", tone: "green" },
  pending_approval: { label: "Pendiente", tone: "amber" },
  suspended: { label: "Suspendido", tone: "red" },
};

export default async function AdminPromotoresPage() {
  const supabase = await createCooitzaServerClient();
  const { data: promoters } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, status, points_balance, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = promoters ?? [];
  const pending = rows.filter((p) => p.status === "pending_approval");
  const others = rows.filter((p) => p.status !== "pending_approval");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Promotores</h1>
        <CreatePromotersModal />
      </div>

      {pending.length > 0 ? (
        <Card className="border-amber-200 p-4">
          <h2 className="mb-2 text-sm font-bold text-amber-800">Pendientes de aprobación ({pending.length})</h2>
          <ul className="divide-y divide-amber-100">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.full_name || "(sin nombre)"}</p>
                  <p className="text-xs text-slate-400">{p.phone ?? "sin teléfono"}</p>
                </div>
                <div className="flex gap-2">
                  <ActionButton action={() => setPromoterStatus(p.id, "active")} variant="primary">Aprobar</ActionButton>
                  <ActionButton action={() => setPromoterStatus(p.id, "suspended")} variant="ghost" confirm="¿Rechazar este registro?">Rechazar</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {others.length === 0 && pending.length === 0 ? (
        <EmptyState emoji="👥" title="Aún no hay promotores" />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_120px_90px_160px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase text-slate-400 sm:grid">
            <span>Promotor</span><span>Estado</span><span>Puntos</span><span className="text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {others.map((p) => {
              const st = statusBadge[p.status] ?? { label: p.status, tone: "neutral" as const };
              return (
                <li key={p.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_120px_90px_160px] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.full_name || "(sin nombre)"}</p>
                    <p className="text-xs text-slate-400">{p.phone ?? "—"}{p.role !== "promoter" ? ` · ${p.role}` : ""}</p>
                  </div>
                  <div><Badge tone={st.tone}>{st.label}</Badge></div>
                  <div className="text-sm font-semibold text-slate-600">{p.points_balance} pts</div>
                  <div className="flex justify-start gap-2 sm:justify-end">
                    {p.role === "promoter" ? (
                      <>
                        {p.status === "active" ? (
                          <>
                            <ImpersonateButton promoterId={p.id} />
                            <ActionButton action={() => setPromoterStatus(p.id, "suspended")} variant="ghost" confirm="¿Suspender a este promotor?">Suspender</ActionButton>
                          </>
                        ) : (
                          <ActionButton action={() => setPromoterStatus(p.id, "active")} variant="primary">Activar</ActionButton>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
