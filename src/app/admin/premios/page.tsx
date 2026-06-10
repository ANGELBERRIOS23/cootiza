import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { RewardForm } from "@/components/admin/reward-form";
import { RewardEdit } from "@/components/admin/reward-edit";
import { ActionButton } from "@/components/admin/action-button";
import { setRewardActive } from "@/lib/admin/actions";

export const metadata = { title: "Premios — Cooitza Admin" };

export default async function AdminPremiosPage() {
  const supabase = await createCooitzaServerClient();
  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, title, description, image_url, points_cost, stock, is_active, display_order")
    .order("display_order")
    .order("created_at", { ascending: false });

  const rows = rewards ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Premios</h1>
      </div>

      <RewardForm />

      {rows.length === 0 ? (
        <EmptyState emoji="🏆" title="Aún no hay premios" description="Creá el primero con el botón de arriba." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image_url || "/package-fallback.svg"}
                    alt={r.title}
                    className="h-12 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {r.points_cost} pts · {r.stock === null ? "stock ilimitado" : `${r.stock} en stock`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={r.is_active ? "green" : "neutral"}>{r.is_active ? "Activo" : "Inactivo"}</Badge>
                  <RewardEdit reward={r} />
                  <ActionButton action={setRewardActive.bind(null, r.id, !r.is_active)} variant="ghost">
                    {r.is_active ? "Desactivar" : "Activar"}
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
