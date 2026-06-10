-- ============================================================================
-- 0005 — Premios y canjes (Fase 6)
-- rewards (catálogo admin) + redemptions (canjes). RPC transaccional para
-- canjear con lock de stock. Descuento de puntos al APROBAR (configurable).
-- ============================================================================

do $$ begin
  create type redemption_status as enum ('requested', 'approved', 'delivered', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

-- --- rewards -----------------------------------------------------------------
create table if not exists public.rewards (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  image_url     text,
  points_cost   integer not null check (points_cost > 0),
  stock         integer,                        -- null = ilimitado
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_rewards_updated_at on public.rewards;
create trigger trg_rewards_updated_at before update on public.rewards
  for each row execute function public.set_updated_at();

-- --- redemptions -------------------------------------------------------------
create table if not exists public.redemptions (
  id                   uuid primary key default gen_random_uuid(),
  promoter_id          uuid not null references public.profiles(id) on delete cascade,
  reward_id            uuid not null references public.rewards(id) on delete restrict,
  points_cost_snapshot integer not null,        -- costo al momento del canje
  status               redemption_status not null default 'requested',
  handled_by           uuid references public.profiles(id) on delete set null,
  handled_at           timestamptz,
  admin_notes          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_redemptions_promoter on public.redemptions(promoter_id);
create index if not exists idx_redemptions_status on public.redemptions(status);

drop trigger if exists trg_redemptions_updated_at on public.redemptions;
create trigger trg_redemptions_updated_at before update on public.redemptions
  for each row execute function public.set_updated_at();

-- --- RPC: solicitar canje (transaccional, valida balance + stock) ------------
-- El promotor solo puede solicitar para sí mismo. El descuento de puntos ocurre
-- al aprobar (admin), pero validamos balance acá para no generar solicitudes
-- inviables. SECURITY INVOKER para que RLS aplique sobre quién es el caller.
create or replace function public.request_redemption(p_reward_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_redemption_id uuid;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;

  select * into v_reward from public.rewards where id = p_reward_id and is_active = true;
  if not found then raise exception 'Premio no disponible'; end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then
    raise exception 'Premio sin stock';
  end if;

  select points_balance into v_balance from public.profiles where id = v_uid;
  if coalesce(v_balance, 0) < v_reward.points_cost then
    raise exception 'Puntos insuficientes';
  end if;

  insert into public.redemptions (promoter_id, reward_id, points_cost_snapshot, status)
  values (v_uid, p_reward_id, v_reward.points_cost, 'requested')
  returning id into v_redemption_id;

  return v_redemption_id;
end $$;

-- --- RPC: aprobar canje (admin) — descuenta puntos + stock en una transacción
create or replace function public.approve_redemption(p_redemption_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_red public.redemptions%rowtype;
begin
  if not public.is_admin() then raise exception 'Solo admin'; end if;

  select * into v_red from public.redemptions where id = p_redemption_id for update;
  if not found then raise exception 'Canje no existe'; end if;
  if v_red.status <> 'requested' then raise exception 'El canje ya fue procesado'; end if;

  -- Lock del reward para evitar doble descuento de stock del último ítem.
  perform 1 from public.rewards where id = v_red.reward_id for update;
  update public.rewards
    set stock = case when stock is null then null else stock - 1 end
    where id = v_red.reward_id and (stock is null or stock > 0);
  if not found then raise exception 'Premio sin stock'; end if;

  -- Descontar puntos (ledger negativo). El trigger valida balance >= 0.
  insert into public.points_ledger (promoter_id, delta, reason, redemption_id, idempotency_key, description)
  values (v_red.promoter_id, -v_red.points_cost_snapshot, 'redemption', v_red.id,
          'redemption:' || v_red.id::text, 'Canje de premio aprobado');

  update public.redemptions
    set status = 'approved', handled_by = auth.uid(), handled_at = now(), updated_at = now()
    where id = p_redemption_id;
end $$;

-- --- RLS ---------------------------------------------------------------------
alter table public.rewards     enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists rw_select on public.rewards;
create policy rw_select on public.rewards
  for select to authenticated using (true);
drop policy if exists rw_admin_write on public.rewards;
create policy rw_admin_write on public.rewards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists rd_select on public.redemptions;
create policy rd_select on public.redemptions
  for select to authenticated
  using (promoter_id = auth.uid() or public.is_admin());
-- INSERT vía RPC request_redemption (security definer). UPDATE solo admin (status).
drop policy if exists rd_admin_update on public.redemptions;
create policy rd_admin_update on public.redemptions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.rewards to authenticated;
grant select on public.redemptions to authenticated;
grant execute on function public.request_redemption(uuid) to authenticated;
grant execute on function public.approve_redemption(uuid) to authenticated;
