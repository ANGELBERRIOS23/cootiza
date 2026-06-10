-- ============================================================================
-- 0009 — Grants de service_role + Storage + avatar_url
--
-- BUG raíz: el proyecto se creó con "auto-expose new tables" OFF, así que las
-- tablas nuevas NO recibieron privilegios ni para `service_role` (solo
-- REFERENCES/TRIGGER/TRUNCATE). Por eso el panel admin (que escribe con
-- service_role) daba "permission denied for table ..." al crear premios,
-- aprobar promotores, etc. service_role es el rol backend de confianza: le
-- damos acceso total (igual salta RLS).
-- ============================================================================

grant usage on schema public to service_role;
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines  in schema public to service_role;

-- Que las tablas/objetos FUTUROS también le den acceso al service_role.
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines  to service_role;

-- --- Foto de perfil ----------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
-- Extiende el grant por columna de 0008: el usuario puede editar su foto.
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- --- Buckets de Storage (lectura pública) ------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('reward-images', 'reward-images', true)
on conflict (id) do nothing;

-- avatars: lectura pública; cada usuario escribe/edita en su carpeta {uid}/...
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- reward-images: lectura pública; escritura solo admin.
drop policy if exists "reward-images public read" on storage.objects;
create policy "reward-images public read" on storage.objects
  for select using (bucket_id = 'reward-images');

drop policy if exists "reward-images admin write" on storage.objects;
create policy "reward-images admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'reward-images' and public.is_admin())
  with check (bucket_id = 'reward-images' and public.is_admin());
