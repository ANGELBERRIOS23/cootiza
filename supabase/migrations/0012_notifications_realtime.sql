-- ============================================================================
-- 0012 — Notificaciones in-app + Realtime
-- Cierra gaps del plan (Fases 4/6/7): notificaciones al promotor y actualización
-- en vivo de "Mis Leads". Las notificaciones las crea el backend (service_role);
-- el usuario solo lee y marca leídas las suyas (RLS + grant por columna).
-- ============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  kind       text not null default 'info',  -- info | stage | redemption | points
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications (user_id) where is_read = false;

alter table public.notifications enable row level security;

-- El usuario ve solo las suyas; marca leídas (solo la columna is_read).
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- INSERT/DELETE: solo service_role (backend). Sin policy = denegado a authenticated.

grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- --- Realtime ----------------------------------------------------------------
-- Agregar tablas a la publicación de realtime (idempotente).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='lead_mirror') then
    alter publication supabase_realtime add table public.lead_mirror;
  end if;
end $$;
