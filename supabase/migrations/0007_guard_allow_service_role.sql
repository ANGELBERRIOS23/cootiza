-- ============================================================================
-- 0007 — El guard de privilegios debe permitir al service_role
-- El panel admin cambia role/status vía Server Actions con service_role. Ese
-- contexto tiene auth.uid() null → is_admin() false → el guard lo bloqueaba.
-- Permitimos cambios cuando el caller es service_role (operaciones de backend
-- admin), manteniendo el bloqueo para promotores normales.
-- ============================================================================

create or replace function public.guard_profile_privilege()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- service_role (backend admin) puede todo. Promotores no pueden auto-escalar.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
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
