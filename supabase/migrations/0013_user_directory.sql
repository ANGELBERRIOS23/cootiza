-- ============================================================================
-- 0013 — Directorio de usuarios (email + proveedor) para el panel admin
--
-- admin_promoter_stats lee `profiles` (no tiene email; el email vive en
-- auth.users). Esta RPC SECURITY DEFINER expone email + proveedor de alta
-- (email | google) SOLO a admins, para poder ver el correo antes de aprobar y
-- distinguir registros hechos con Google de los creados por un admin.
-- ============================================================================

create or replace function public.admin_user_directory()
returns table (id uuid, email text, provider text)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  return query
    select
      u.id,
      u.email::text,
      coalesce(u.raw_app_meta_data->>'provider', 'email') as provider
    from auth.users u;
end $$;

-- Las funciones SECURITY DEFINER otorgan EXECUTE a PUBLIC por defecto; revocamos
-- y solo permitimos a authenticated (el gate is_admin() decide adentro).
revoke execute on function public.admin_user_directory() from public, anon;
grant execute on function public.admin_user_directory() to authenticated;
