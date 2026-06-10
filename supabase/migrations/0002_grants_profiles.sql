-- ============================================================================
-- 0002 — GRANTs explícitos para la Data API
--
-- El proyecto se creó con "Automatically expose new tables" DESACTIVADO (buena
-- práctica de seguridad), así que las tablas nuevas NO reciben permisos para
-- los roles de la Data API (anon/authenticated). Sin GRANT, las queries fallan
-- con "permission denied for table" ANTES de evaluar RLS.
--
-- El GRANT da acceso a la TABLA; RLS sigue filtrando QUÉ FILAS ve cada usuario.
-- Ambos son necesarios. A partir de acá, CADA tabla nueva necesita su GRANT.
-- ============================================================================

-- profiles: el promotor lee/actualiza su propia fila (RLS lo limita a la suya).
-- INSERT lo hace el trigger de signup (security definer), no necesita grant.
grant select, update on public.profiles to authenticated;

-- Nota: no damos nada a 'anon' sobre profiles (no hay caso de uso público).
