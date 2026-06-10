-- ============================================================================
-- 0011 — Agencias + regiones + rol Supervisor
-- (el enum `region` y el valor 'supervisor' de user_role se crean antes, en su
--  propia transacción, por restricción de Postgres con ALTER TYPE ADD VALUE)
-- ============================================================================

-- --- Agencias ----------------------------------------------------------------
create table if not exists public.agencies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  region     region not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_agencies_name on public.agencies (lower(name));
create index if not exists idx_agencies_region on public.agencies (region);

drop trigger if exists trg_agencies_updated_at on public.agencies;
create trigger trg_agencies_updated_at before update on public.agencies
  for each row execute function public.set_updated_at();

-- --- profiles: agencia + región supervisada ----------------------------------
alter table public.profiles add column if not exists agency_id uuid references public.agencies(id) on delete set null;
alter table public.profiles add column if not exists supervised_region region;
create index if not exists idx_profiles_agency on public.profiles (agency_id);

-- Guard anti-escalada: agency_id y supervised_region solo los toca admin/backend.
create or replace function public.guard_profile_privilege()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if not public.is_admin() then
    if new.role is distinct from old.role then raise exception 'No autorizado a cambiar role'; end if;
    if new.status is distinct from old.status then raise exception 'No autorizado a cambiar status'; end if;
    if new.points_balance is distinct from old.points_balance then raise exception 'points_balance es de solo lectura'; end if;
    if new.vxm_promoter_code is distinct from old.vxm_promoter_code then raise exception 'vxm_promoter_code lo asigna el administrador'; end if;
    if new.agency_id is distinct from old.agency_id then raise exception 'La agencia la asigna el administrador'; end if;
    if new.supervised_region is distinct from old.supervised_region then raise exception 'La región la asigna el administrador'; end if;
  end if;
  return new;
end $$;

-- --- RLS agencias ------------------------------------------------------------
alter table public.agencies enable row level security;
drop policy if exists ag_select on public.agencies;
create policy ag_select on public.agencies for select to authenticated using (true);
drop policy if exists ag_admin_write on public.agencies;
create policy ag_admin_write on public.agencies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.agencies to authenticated;

-- --- RPC: admin_promoter_stats (ahora con agencia) ---------------------------
drop function if exists public.admin_promoter_stats();
create function public.admin_promoter_stats()
returns table (
  id uuid, full_name text, avatar_url text, status public.user_status,
  points_balance integer, clients_count bigint, last_client_at timestamptz,
  agency_id uuid, agency_name text, region region
)
language sql security invoker stable set search_path = public as $$
  select p.id, p.full_name, p.avatar_url, p.status, p.points_balance,
         count(lm.id), max(lm.created_at), a.id, a.name, a.region
  from public.profiles p
  left join public.agencies a on a.id = p.agency_id
  left join public.lead_mirror lm on lm.promoter_id = p.id
  where p.role = 'promoter'
  group by p.id, p.full_name, p.avatar_url, p.status, p.points_balance, a.id, a.name, a.region
  order by p.points_balance desc, count(lm.id) desc;
$$;
grant execute on function public.admin_promoter_stats() to authenticated;

-- --- RPC: supervisor_promoter_stats (alcance por agencia o región) -----------
-- SECURITY DEFINER: el alcance se calcula del PROPIO supervisor (auth.uid()),
-- así un supervisor solo ve a sus promotores. Admin ve todos.
create or replace function public.supervisor_promoter_stats()
returns table (
  id uuid, full_name text, avatar_url text, status public.user_status,
  points_balance integer, clients_count bigint, last_client_at timestamptz,
  agency_name text, region region
)
language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_agency uuid;
  v_region public.region;
  v_is_admin boolean := public.is_admin();
begin
  select role, agency_id, supervised_region into v_role, v_agency, v_region
  from public.profiles where id = v_uid;
  if not v_is_admin and v_role <> 'supervisor' then return; end if;

  return query
    select p.id, p.full_name, p.avatar_url, p.status, p.points_balance,
           count(lm.id), max(lm.created_at), a.name, a.region
    from public.profiles p
    left join public.agencies a on a.id = p.agency_id
    left join public.lead_mirror lm on lm.promoter_id = p.id
    where p.role = 'promoter'
      and (
        v_is_admin
        or (v_agency is not null and p.agency_id = v_agency)
        or (v_region is not null and a.region = v_region)
      )
    group by p.id, p.full_name, p.avatar_url, p.status, p.points_balance, a.name, a.region
    order by p.points_balance desc, count(lm.id) desc;
end $$;
grant execute on function public.supervisor_promoter_stats() to authenticated;
