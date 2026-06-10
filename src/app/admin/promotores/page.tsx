import Link from "next/link";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { ActionButton } from "@/components/admin/action-button";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { CreatePromotersModal } from "@/components/admin/create-promoters-modal";
import { CreateTeamModal } from "@/components/admin/create-team-modal";
import { EditUserModal } from "@/components/admin/edit-user-modal";
import { setPromoterStatus } from "@/lib/admin/actions";

type UserRole = "promoter" | "supervisor" | "admin" | "superadmin";
type UserStatus = "active" | "pending_approval" | "suspended";

export const metadata = { title: "Promotores — Cooitza Admin" };

type Stat = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  status: "active" | "pending_approval" | "suspended";
  points_balance: number;
  clients_count: number;
  last_client_at: string | null;
  agency_name: string | null;
  region: string | null;
};

const statusBadge: Record<string, { label: string; tone: "green" | "amber" | "red" | "neutral" }> = {
  active: { label: "Activo", tone: "green" },
  pending_approval: { label: "Pendiente", tone: "amber" },
  suspended: { label: "Suspendido", tone: "red" },
};

type TeamMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "supervisor" | "admin" | "superadmin";
  status: "active" | "pending_approval" | "suspended";
};

const roleLabel: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  supervisor: "Supervisor",
};

export default async function AdminPromotoresPage() {
  const supabase = await createCooitzaServerClient();
  const [{ data }, { data: agencies }, { data: team }, { data: directory }, { data: profiles }] = await Promise.all([
    supabase.rpc("admin_promoter_stats"),
    supabase.from("agencies").select("id, name, region").eq("is_active", true).order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, status")
      .in("role", ["admin", "superadmin", "supervisor"])
      .order("role"),
    supabase.rpc("admin_user_directory"),
    supabase.from("profiles").select("id, full_name, phone, role, status, agency_id, supervised_region"),
  ]);
  const rows = ((data ?? []) as Stat[]).map((r) => ({ ...r, clients_count: Number(r.clients_count) }));
  const teamRows = (team ?? []) as TeamMember[];
  const agenciesList = (agencies ?? []) as { id: string; name: string; region: string }[];
  // Mapa id → { email, provider } para mostrar correo y fuente (Google vs admin).
  const dir = new Map(
    ((directory ?? []) as { id: string; email: string; provider: string }[]).map((d) => [d.id, d]),
  );
  // Mapa de perfiles para alimentar el modal de edición sin abrir el detalle.
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null; phone: string | null; role: string; status: string; agency_id: string | null; supervised_region: string | null }[]).map((p) => [p.id, p]),
  );
  const editUser = (id: string) => {
    const p = profileMap.get(id);
    return {
      id,
      full_name: p?.full_name ?? "",
      email: dir.get(id)?.email ?? "",
      phone: p?.phone ?? null,
      role: (p?.role ?? "promoter") as UserRole,
      status: (p?.status ?? "active") as UserStatus,
      agency_id: p?.agency_id ?? null,
      supervised_region: p?.supervised_region ?? null,
    };
  };

  const pending = rows.filter((p) => p.status === "pending_approval");
  const others = rows.filter((p) => p.status !== "pending_approval");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black tracking-tight text-slate-900">Promotores</h1>
        <div className="flex flex-wrap gap-2">
          <CreateTeamModal agencies={(agencies ?? []) as { id: string; name: string; region: string }[]} />
          <CreatePromotersModal agencies={(agencies ?? []) as { id: string; name: string; region: string }[]} />
        </div>
      </div>

      {pending.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60 p-4">
          <h2 className="mb-2 text-sm font-bold text-amber-800">Pendientes de aprobación ({pending.length})</h2>
          <ul className="divide-y divide-amber-100">
            {pending.map((p) => {
              const info = dir.get(p.id);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/promotores/${p.id}`} className="flex min-w-0 items-center gap-2.5 hover:underline">
                    <Avatar name={p.full_name || "P"} url={p.avatar_url} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{p.full_name || "(sin nombre)"}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs text-slate-500">{info?.email ?? "—"}</span>
                        {info?.provider === "google" ? (
                          <Badge tone="neutral">vía Google</Badge>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <EditUserModal user={editUser(p.id)} agencies={agenciesList} />
                    <ActionButton action={setPromoterStatus.bind(null, p.id, "active")} variant="primary">Aprobar</ActionButton>
                    <ActionButton action={setPromoterStatus.bind(null, p.id, "suspended")} variant="ghost" confirm="¿Rechazar este registro?">Rechazar</ActionButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {others.length === 0 && pending.length === 0 ? (
        <EmptyState emoji="👥" title="Aún no hay promotores" description="Creá el primero con el botón “Nuevo promotor”." />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_90px_80px_180px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase text-slate-400 sm:grid">
            <span>Promotor</span><span>Clientes</span><span>Puntos</span><span className="text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {others.map((p) => {
              const st = statusBadge[p.status] ?? { label: p.status, tone: "neutral" as const };
              return (
                <li key={p.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_90px_80px_180px] sm:items-center">
                  <Link href={`/admin/promotores/${p.id}`} className="flex min-w-0 items-center gap-2.5 hover:underline">
                    <Avatar name={p.full_name || "P"} url={p.avatar_url} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{p.full_name || "(sin nombre)"}</span>
                      <span className="block truncate text-xs text-slate-400">{p.agency_name ? `${p.agency_name} · ${p.region}` : "Sin agencia"}</span>
                      <span className="mt-0.5 block sm:hidden"><Badge tone={st.tone}>{st.label}</Badge></span>
                    </span>
                  </Link>
                  <div className="text-sm font-semibold text-slate-600">{p.clients_count} <span className="text-xs font-normal text-slate-400">clientes</span></div>
                  <div className="text-sm font-bold text-amber-600">{p.points_balance}</div>
                  <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                    <EditUserModal user={editUser(p.id)} agencies={agenciesList} />
                    {p.status === "active" ? (
                      <>
                        <ImpersonateButton promoterId={p.id} />
                        <ActionButton action={setPromoterStatus.bind(null, p.id, "suspended")} variant="ghost" confirm="¿Suspender a este promotor?">Suspender</ActionButton>
                      </>
                    ) : (
                      <ActionButton action={setPromoterStatus.bind(null, p.id, "active")} variant="primary">Activar</ActionButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {teamRows.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase text-slate-400">
            Equipo interno (admins y supervisores)
          </div>
          <ul className="divide-y divide-slate-100">
            {teamRows.map((m) => {
              const st = statusBadge[m.status] ?? { label: m.status, tone: "neutral" as const };
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Link href={`/admin/promotores/${m.id}`} className="flex min-w-0 items-center gap-2.5 hover:underline">
                    <Avatar name={m.full_name || "U"} url={m.avatar_url} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{m.full_name || "(sin nombre)"}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {roleLabel[m.role] ?? m.role}
                        {dir.get(m.id)?.email ? ` · ${dir.get(m.id)!.email}` : ""}
                      </span>
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <EditUserModal user={editUser(m.id)} agencies={agenciesList} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
