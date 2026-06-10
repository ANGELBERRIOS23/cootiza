-- ============================================================================
-- 0004 — Sistema de puntos (Fase 5)
-- Puntos = rendimiento del presupuesto. Base: 1 punto por Q1 de agency_yield
-- (ratio configurable). Ledger inmutable + balance denormalizado por trigger.
-- ============================================================================

do $$ begin
  create type points_reason as enum ('sale_closed', 'redemption', 'admin_adjustment', 'reversal');
exception when duplicate_object then null; end $$;

-- --- points_rules: configuración del ratio puntos/rendimiento ----------------
-- Arranca con una regla global: 1 punto por cada Q1 de rendimiento.
create table if not exists public.points_rules (
  id                  uuid primary key default gen_random_uuid(),
  points_per_q_yield  numeric(10,4) not null default 1.0 check (points_per_q_yield >= 0),
  is_active           boolean not null default true,
  note                text,
  effective_from      date,
  effective_until     date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
drop trigger if exists trg_points_rules_updated_at on public.points_rules;
create trigger trg_points_rules_updated_at before update on public.points_rules
  for each row execute function public.set_updated_at();

insert into public.points_rules (points_per_q_yield, note)
select 1.0, 'Regla por defecto: 1 punto por cada Q1 de rendimiento.'
where not exists (select 1 from public.points_rules);

-- --- points_ledger: libro mayor inmutable ------------------------------------
create table if not exists public.points_ledger (
  id              uuid primary key default gen_random_uuid(),
  promoter_id     uuid not null references public.profiles(id) on delete cascade,
  delta           integer not null,            -- + abono / - canje o reverso
  reason          points_reason not null,
  lead_id         uuid references public.lead_mirror(id) on delete set null,
  redemption_id   uuid,                         -- FK lógica a redemptions (0005)
  adjusted_by     uuid references public.profiles(id) on delete set null,
  description     text,
  idempotency_key text not null unique,         -- ej. 'sale:{vxm_opportunity_id}'
  created_at      timestamptz not null default now()
);
create index if not exists idx_points_ledger_promoter on public.points_ledger(promoter_id);

-- --- Trigger: recalcular balance + impedir balance negativo ------------------
create or replace function public.recalc_points_balance()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
begin
  select coalesce(sum(delta), 0) into v_balance
  from public.points_ledger where promoter_id = new.promoter_id;

  if v_balance < 0 then
    raise exception 'El balance de puntos no puede ser negativo (resultaría %)', v_balance;
  end if;

  update public.profiles set points_balance = v_balance, updated_at = now()
  where id = new.promoter_id;
  return new;
end $$;

drop trigger if exists trg_recalc_points_balance on public.points_ledger;
create trigger trg_recalc_points_balance
  after insert on public.points_ledger
  for each row execute function public.recalc_points_balance();

-- --- RLS ---------------------------------------------------------------------
alter table public.points_rules  enable row level security;
alter table public.points_ledger enable row level security;

drop policy if exists pr_select on public.points_rules;
create policy pr_select on public.points_rules
  for select to authenticated using (true);   -- transparencia: todos ven el ratio
drop policy if exists pr_admin_write on public.points_rules;
create policy pr_admin_write on public.points_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists pl_select on public.points_ledger;
create policy pl_select on public.points_ledger
  for select to authenticated
  using (promoter_id = auth.uid() or public.is_admin());
-- INSERT/UPDATE/DELETE: solo service_role (otorgamiento, canjes, ajustes admin).
-- NUNCA update/delete del ledger (inmutable).

grant select on public.points_rules to authenticated;
grant select on public.points_ledger to authenticated;
