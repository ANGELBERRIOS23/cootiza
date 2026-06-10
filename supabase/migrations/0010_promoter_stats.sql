-- ============================================================================
-- 0010 — Métricas de promotores (sin N+1) + índices
--
-- RPC admin_promoter_stats: agrega clientes por promotor en UNA query.
-- SECURITY INVOKER → respeta RLS: un admin ve todos los promotores; un promotor
-- (si lo llamara) solo se vería a sí mismo. Sin necesidad de service_role.
-- ============================================================================

create or replace function public.admin_promoter_stats()
returns table (
  id             uuid,
  full_name      text,
  avatar_url     text,
  status         public.user_status,
  points_balance integer,
  clients_count  bigint,
  last_client_at timestamptz
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    p.id, p.full_name, p.avatar_url, p.status, p.points_balance,
    count(lm.id) as clients_count,
    max(lm.created_at) as last_client_at
  from public.profiles p
  left join public.lead_mirror lm on lm.promoter_id = p.id
  where p.role = 'promoter'
  group by p.id, p.full_name, p.avatar_url, p.status, p.points_balance
  order by p.points_balance desc, count(lm.id) desc;
$$;

grant execute on function public.admin_promoter_stats() to authenticated;

-- Índices para listar/ordenar clientes rápido.
create index if not exists idx_lead_mirror_created on public.lead_mirror(created_at desc);
create index if not exists idx_lead_mirror_promoter_created on public.lead_mirror(promoter_id, created_at desc);
