-- ============================================================================
-- 0014 — is_admin() debe reconocer al service_role
--
-- BUG: las Server Actions admin llaman RPCs (approve_redemption, etc.) con el
-- cliente service_role, donde auth.uid() es NULL. is_admin() solo chequeaba
-- profiles por auth.uid() → devolvía FALSE → la RPC lanzaba "Solo admin" y NINGÚN
-- canje se podía aprobar.
--
-- FIX: is_admin() devuelve true si el rol de la conexión es service_role (backend
-- de confianza) o si el usuario autenticado es admin/superadmin. Seguro:
--   - authenticated  → auth.role()='authenticated' → cae al chequeo de profiles (igual que antes)
--   - anon           → sin uid → false (igual que antes)
--   - service_role   → true (backend admin; RLS ya lo bypassa de todos modos)
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(auth.role(), '') = 'service_role'
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'superadmin')
      );
$$;
