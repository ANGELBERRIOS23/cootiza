-- ============================================================================
-- 0001 — Identidad y roles (Fase 1)
-- Tabla profiles (1:1 con auth.users), enums de rol/estado, trigger de signup
-- que crea el profile automáticamente, y RLS estricto.
-- ============================================================================

-- --- Enums -------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('promoter', 'admin', 'superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('pending_approval', 'active', 'suspended');
exception when duplicate_object then null; end $$;

-- --- Tabla profiles ----------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  phone           text,                                   -- E.164, default +502
  role            user_role   not null default 'promoter',
  status          user_status not null default 'pending_approval',
  vxm_promoter_code text unique,                          -- código del promotor en VXM
  points_balance  integer not null default 0,             -- denormalizado: solo trigger del ledger lo toca
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.profiles.points_balance is
  'Denormalizado. Solo se actualiza por el trigger del points_ledger, nunca por escritura directa.';

-- --- updated_at automático ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- --- Trigger de signup: crea el profile al registrarse -----------------------
-- Toma full_name del user_metadata (Google manda 'full_name' o 'name').
-- El status inicial depende de app_settings.registration_mode (Fase 1.4); por
-- ahora arranca 'pending_approval' (modo approval, el más seguro). El admin
-- aprueba desde el panel. Cuando exista app_settings se lee de ahí.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  insert into public.profiles (id, full_name)
  values (new.id, v_full_name)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- RLS ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Helper: ¿el usuario actual es admin/superadmin? (evita recursión de RLS al
-- consultar profiles desde dentro de una policy de profiles).
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- SELECT: el promotor ve su propio registro; admin ve todos.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- UPDATE: el promotor puede actualizar SOLO su full_name/phone (no role/status).
-- La restricción de columnas se hace a nivel app (Server Action valida); a nivel
-- RLS permitimos update de la propia fila. role/status solo cambian vía admin
-- (RPC con service_role o policy admin). Para impedir auto-escalada, agregamos
-- un trigger que bloquea cambios de role/status salvo que sea admin.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Trigger anti-escalada: un no-admin no puede cambiarse role ni status.
create or replace function public.guard_profile_privilege()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'No autorizado a cambiar role';
    end if;
    if new.status is distinct from old.status then
      raise exception 'No autorizado a cambiar status';
    end if;
    if new.points_balance is distinct from old.points_balance then
      raise exception 'points_balance es de solo lectura';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_privilege on public.profiles;
create trigger trg_guard_profile_privilege
  before update on public.profiles
  for each row execute function public.guard_profile_privilege();

-- INSERT: nadie inserta directo (lo hace el trigger de signup con security definer).
-- DELETE: nadie borra desde cliente (soft-delete vía status='suspended').
