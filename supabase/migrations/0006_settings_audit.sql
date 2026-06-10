-- ============================================================================
-- 0006 — Configuración y auditoría (Fases 1, 7)
-- app_settings (clave/valor) + audit_log (acciones admin, insert-only).
-- ============================================================================

-- --- app_settings ------------------------------------------------------------
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Seeds de configuración inicial.
insert into public.app_settings (key, value) values
  ('registration_mode',     '"approval"'::jsonb),   -- open | approval | invite
  ('lead_assignment_mode',  '"manual"'::jsonb),      -- manual | random
  ('landing_hero_title',    '"Vendé viajes con Viajexmundo"'::jsonb),
  ('landing_hero_subtitle', '"Sumate a nuestra red de promotores y ganá puntos por cada venta."'::jsonb),
  ('lead_rate_limit_per_hour', '30'::jsonb)
on conflict (key) do nothing;

-- --- audit_log (insert-only) -------------------------------------------------
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_table text,
  target_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_log_created on public.audit_log(created_at desc);

-- --- RLS ---------------------------------------------------------------------
alter table public.app_settings enable row level security;
alter table public.audit_log    enable row level security;

-- app_settings: lectura para autenticados (textos landing, modos); escritura admin.
-- Nota: la landing pública lee settings vía service_role en el server (SSR), no
-- con anon, para no exponer toda la tabla. Acá damos lectura a authenticated.
drop policy if exists as_select on public.app_settings;
create policy as_select on public.app_settings
  for select to authenticated using (true);
drop policy if exists as_admin_write on public.app_settings;
create policy as_admin_write on public.app_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- audit_log: solo admin lee; inserción solo service_role.
drop policy if exists al_admin_select on public.audit_log;
create policy al_admin_select on public.audit_log
  for select to authenticated using (public.is_admin());

grant select on public.app_settings to authenticated;
grant select on public.audit_log to authenticated;
