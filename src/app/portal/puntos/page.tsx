import { getSessionProfile } from "@/lib/auth/session";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";

export const metadata = { title: "Mis puntos — Portal Cooitza" };

const reasonLabel: Record<string, string> = {
  sale_closed: "Venta cerrada",
  redemption: "Canje de premio",
  admin_adjustment: "Ajuste",
  reversal: "Reverso",
};

export default async function PuntosPage() {
  const profile = await getSessionProfile();
  const supabase = await createCooitzaServerClient();

  const [{ data: ledger }, { data: rule }] = await Promise.all([
    supabase
      .from("points_ledger")
      .select("id, delta, reason, description, created_at")
      .eq("promoter_id", profile!.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("points_rules")
      .select("points_per_q_yield")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ratio = Number(rule?.points_per_q_yield ?? 1);
  const rows = ledger ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Mis puntos</h1>
        <p className="text-sm text-slate-500">Acumulás puntos según el rendimiento de cada venta cerrada.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Balance" value={profile?.points_balance ?? 0} tone="green" sub="puntos disponibles" />
        <StatCard
          label="Cómo se gana"
          value={ratio === 1 ? "Q1 = 1 pt" : `Q1 = ${ratio} pts`}
          tone="brand"
          sub="por rendimiento de la venta"
        />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-bold text-slate-800">Movimientos</h2>
        {rows.length === 0 ? (
          <EmptyState
            emoji="⭐"
            title="Todavía no tenés movimientos"
            description="Cuando un cliente que registraste cierre su compra, vas a ver acá los puntos que ganaste."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {reasonLabel[m.reason] ?? m.reason}
                  </p>
                  {m.description ? <p className="truncate text-xs text-slate-400">{m.description}</p> : null}
                  <p className="text-[11px] text-slate-400">
                    {new Date(m.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Badge tone={m.delta >= 0 ? "green" : "red"}>
                  {m.delta >= 0 ? "+" : ""}
                  {m.delta}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
