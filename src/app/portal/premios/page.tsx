import { getSessionProfile } from "@/lib/auth/session";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { RedeemButton } from "@/components/portal/redeem-button";

export const metadata = { title: "Premios — Portal Cooitza" };

const statusLabel: Record<string, { label: string; tone: "amber" | "green" | "blue" | "red" | "neutral" }> = {
  requested: { label: "Solicitado", tone: "amber" },
  approved: { label: "Aprobado", tone: "blue" },
  delivered: { label: "Entregado", tone: "green" },
  rejected: { label: "Rechazado", tone: "red" },
  cancelled: { label: "Cancelado", tone: "neutral" },
};

export default async function PremiosPage() {
  const profile = await getSessionProfile();
  const supabase = await createCooitzaServerClient();
  const balance = profile?.points_balance ?? 0;

  const [{ data: rewards }, { data: myRedemptions }] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, title, description, image_url, points_cost, stock, is_active, display_order")
      .eq("is_active", true)
      .order("display_order")
      .order("points_cost"),
    supabase
      .from("redemptions")
      .select("id, status, points_cost_snapshot, created_at, reward_id, rewards(title)")
      .eq("promoter_id", profile!.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const list = rewards ?? [];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Premios</h1>
          <p className="text-sm text-slate-500">Canjeá tus puntos por premios.</p>
        </div>
        <StatCard label="Tu balance" value={balance} tone="green" />
      </header>

      {list.length === 0 ? (
        <EmptyState emoji="🎁" title="Aún no hay premios" description="Pronto vas a poder canjear tus puntos por premios." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const noStock = r.stock !== null && r.stock <= 0;
            const cantAfford = balance < r.points_cost;
            const disabled = noStock || cantAfford;
            const reason = noStock ? "Sin stock" : cantAfford ? `Te faltan ${r.points_cost - balance} pts` : undefined;
            return (
              <Card key={r.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  {r.image_url ? (
                    <SafeImage src={r.image_url} alt={r.title} fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🎁</div>
                  )}
                  {r.stock !== null ? (
                    <span className="absolute right-2 top-2">
                      <Badge tone={noStock ? "red" : "neutral"}>{noStock ? "Agotado" : `${r.stock} disp.`}</Badge>
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-bold leading-tight text-slate-800">{r.title}</h3>
                  {r.description ? <p className="line-clamp-2 text-xs text-slate-500">{r.description}</p> : null}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-black text-brand-600">{r.points_cost} pts</span>
                  </div>
                  <RedeemButton rewardId={r.id} disabled={disabled} disabledReason={reason} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(myRedemptions ?? []).length > 0 ? (
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800">Mis canjes</h2>
          <ul className="divide-y divide-slate-100">
            {(myRedemptions ?? []).map((red) => {
              const st = statusLabel[red.status] ?? { label: red.status, tone: "neutral" as const };
              const rewardTitle = (red.rewards as { title?: string } | null)?.title ?? "Premio";
              return (
                <li key={red.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{rewardTitle}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(red.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "short" })} ·{" "}
                      {red.points_cost_snapshot} pts
                    </p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
