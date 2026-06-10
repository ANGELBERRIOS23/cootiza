-- ============================================================================
-- 0003 — Leads (espejo) + historial de pipeline + mapeo de etapas (Fases 3-4)
-- Cooitza guarda un espejo del lead que manda a VXM, para "Mis Leads" rápido
-- y resiliencia. La fuente de verdad del pipeline es VXM (crm_opportunities);
-- el espejo se refresca por sync. RLS + GRANTs explícitos.
-- ============================================================================

do $$ begin
  create type lead_sync_status as enum ('pending', 'sent', 'confirmed', 'failed');
exception when duplicate_object then null; end $$;

-- --- pipeline_stage_map: nombre VXM → nombre amigable para el promotor -------
create table if not exists public.pipeline_stage_map (
  id            uuid primary key default gen_random_uuid(),
  vxm_stage_code text unique not null,         -- ej. 'VENTA_CERRADA'
  display_name  text not null,                 -- lo que ve el promotor
  is_terminal   boolean not null default false,
  is_won        boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_psm_updated_at on public.pipeline_stage_map;
create trigger trg_psm_updated_at before update on public.pipeline_stage_map
  for each row execute function public.set_updated_at();

-- Seed con los stages reales de VXM (CRM_PIPELINE_STAGES).
insert into public.pipeline_stage_map (vxm_stage_code, display_name, is_terminal, is_won, display_order) values
  ('LEAD_NUEVO',                'Nuevo',                  false, false, 1),
  ('PERFILADO',                 'En contacto',            false, false, 2),
  ('PROPUESTA_EN_PREPARACION',  'Preparando propuesta',   false, false, 3),
  ('COTIZACION_EN_SEGUIMIENTO', 'Cotización enviada',     false, false, 4),
  ('APARTADO',                  'Apartado',               false, false, 5),
  ('VENTA_CERRADA',             'Venta cerrada',          false, true,  6),
  ('VIAJE_EN_CURSO',            'Viaje en curso',         false, true,  7),
  ('POST_VIAJE',                'Post-viaje',             false, true,  8),
  ('CLIENTE_GANADO',            'Cliente ganado',         true,  true,  9),
  ('CERRADO_PERDIDO',           'No concretado',          true,  false, 10),
  ('DORMIDO',                   'En pausa',               false, false, 11)
on conflict (vxm_stage_code) do nothing;

-- --- lead_mirror -------------------------------------------------------------
create table if not exists public.lead_mirror (
  id               uuid primary key default gen_random_uuid(),
  promoter_id      uuid not null references public.profiles(id) on delete cascade,
  vxm_lead_id      text,                       -- id del lead en crm_leads de VXM
  vxm_opportunity_id text,                     -- id de la opp cuando se convierte
  client_name      text not null,
  client_phone     text not null,             -- E.164
  client_email     text,
  package_vxm_id   text,                       -- id del paquete en VXM (si aplica)
  package_title    text,
  notes            text,
  current_stage    text not null default 'LEAD_NUEVO',
  stage_updated_at timestamptz,
  sync_status      lead_sync_status not null default 'pending',
  idempotency_key  uuid not null default gen_random_uuid() unique,
  points_awarded   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_lead_mirror_promoter on public.lead_mirror(promoter_id);
create index if not exists idx_lead_mirror_opp on public.lead_mirror(vxm_opportunity_id) where vxm_opportunity_id is not null;
create index if not exists idx_lead_mirror_unsettled on public.lead_mirror(sync_status) where sync_status in ('pending','failed');

drop trigger if exists trg_lead_mirror_updated_at on public.lead_mirror;
create trigger trg_lead_mirror_updated_at before update on public.lead_mirror
  for each row execute function public.set_updated_at();

-- --- lead_stage_history ------------------------------------------------------
create table if not exists public.lead_stage_history (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.lead_mirror(id) on delete cascade,
  from_stage  text,
  to_stage    text not null,
  source      text not null default 'sync',   -- 'sync' | 'manual_admin'
  received_at timestamptz not null default now()
);
create index if not exists idx_lead_stage_history_lead on public.lead_stage_history(lead_id);

-- --- RLS ---------------------------------------------------------------------
alter table public.pipeline_stage_map enable row level security;
alter table public.lead_mirror        enable row level security;
alter table public.lead_stage_history enable row level security;

-- pipeline_stage_map: lectura para autenticados; escritura solo admin.
drop policy if exists psm_select on public.pipeline_stage_map;
create policy psm_select on public.pipeline_stage_map
  for select to authenticated using (true);
drop policy if exists psm_admin_write on public.pipeline_stage_map;
create policy psm_admin_write on public.pipeline_stage_map
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- lead_mirror: el promotor ve/crea los suyos; admin ve todos. UPDATE solo backend.
drop policy if exists lm_select on public.lead_mirror;
create policy lm_select on public.lead_mirror
  for select to authenticated
  using (promoter_id = auth.uid() or public.is_admin());
drop policy if exists lm_insert on public.lead_mirror;
create policy lm_insert on public.lead_mirror
  for insert to authenticated
  with check (promoter_id = auth.uid());
-- UPDATE/DELETE: solo service_role (sync, admin). Sin policy = denegado a authenticated.

-- lead_stage_history: el promotor ve el historial de SUS leads; admin todos.
drop policy if exists lsh_select on public.lead_stage_history;
create policy lsh_select on public.lead_stage_history
  for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.lead_mirror lm
      where lm.id = lead_stage_history.lead_id and lm.promoter_id = auth.uid()
    )
  );

-- --- GRANTs (auto-expose desactivado → explícito) ----------------------------
grant select on public.pipeline_stage_map to authenticated;
grant select, insert on public.lead_mirror to authenticated;
grant select on public.lead_stage_history to authenticated;
