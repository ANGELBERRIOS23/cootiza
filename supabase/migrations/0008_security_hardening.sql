-- ============================================================================
-- 0008 — Endurecimiento de seguridad (Fase 8)
-- Revisión adversarial de RLS + privilegios. Cierra dos brechas:
--   1) El UPDATE sobre profiles era a nivel TABLA (todas las columnas). El
--      trigger anti-escalada bloqueaba role/status/points_balance, pero
--      vxm_promoter_code quedaba editable por el propio promotor. Pasamos a
--      GRANT por columna (solo full_name, phone) — Postgres rechaza ANTES de
--      RLS cualquier intento de tocar columnas sensibles. El trigger queda
--      como defensa en profundidad y ahora también cubre vxm_promoter_code.
--   2) request_redemption no verificaba status='active' ni evitaba solicitudes
--      duplicadas. Un promotor suspendido podía canjear vía Server Action
--      saltándose la UI. Ahora exige cuenta activa y bloquea duplicados.
-- ============================================================================

-- --- 1) GRANT por columna en profiles ----------------------------------------
-- Quitamos el UPDATE amplio y damos solo las dos columnas que el promotor puede
-- editar de su propia fila. role/status/points_balance/vxm_promoter_code quedan
-- fuera de su alcance a nivel de privilegios (no solo por trigger).
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Trigger anti-escalada: agrega vxm_promoter_code a las columnas protegidas.
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
    if new.vxm_promoter_code is distinct from old.vxm_promoter_code then
      raise exception 'vxm_promoter_code lo asigna el administrador';
    end if;
  end if;
  return new;
end $$;

-- --- 2) request_redemption: exigir cuenta activa + sin duplicados ------------
create or replace function public.request_redemption(p_reward_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_status public.user_status;
  v_balance integer;
  v_redemption_id uuid;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;

  -- La cuenta debe estar activa (un suspendido/pendiente no transacciona).
  select status, points_balance into v_status, v_balance
  from public.profiles where id = v_uid;
  if v_status is distinct from 'active' then
    raise exception 'Tu cuenta no está activa';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id and is_active = true;
  if not found then raise exception 'Premio no disponible'; end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then
    raise exception 'Premio sin stock';
  end if;

  if coalesce(v_balance, 0) < v_reward.points_cost then
    raise exception 'Puntos insuficientes';
  end if;

  -- Evitar solicitudes duplicadas del mismo premio aún sin procesar.
  if exists (
    select 1 from public.redemptions
    where promoter_id = v_uid and reward_id = p_reward_id and status = 'requested'
  ) then
    raise exception 'Ya tenés una solicitud pendiente de este premio';
  end if;

  insert into public.redemptions (promoter_id, reward_id, points_cost_snapshot, status)
  values (v_uid, p_reward_id, v_reward.points_cost, 'requested')
  returning id into v_redemption_id;

  return v_redemption_id;
end $$;
