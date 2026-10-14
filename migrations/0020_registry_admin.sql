-- Registry management: additive schema only. No existing member or log is removed.
alter table members add column if not exists revision integer not null default 1;
alter table members add column if not exists updated_at timestamptz not null default now();
alter table access_log add column if not exists event_id text;
create unique index if not exists access_log_event_id_unique on access_log(event_id);
create index if not exists access_log_user_date_idx on access_log(user_id,created_at desc,id desc);
create index if not exists access_log_area_date_idx on access_log(area,created_at desc,id desc);
create table if not exists registry_admin_audit (
 id bigserial primary key,
 actor_user_id text not null,
 target_user_id text not null,
 operation text not null,
 before_data jsonb,
 after_data jsonb,
 created_at timestamptz not null default now()
);

-- Invoker rights. The authenticated server supplies the actor, never the browser.
-- Locking serializes moderation operations and protects the last moderator.
create or replace function portal_manage_member(
 p_actor text,p_target text,p_operation text,p_revision integer,p_changes jsonb
) returns jsonb language plpgsql as $$
declare
 actor members%rowtype;
 target members%rowtype;
 changed members%rowtype;
 next_alias text;
 next_group text;
 next_role text;
 next_status text;
 active_mods integer;
begin
 lock table members in share row exclusive mode;
 select * into actor from members where user_id=p_actor;
 if not found or actor.role <> 'moderador' or actor.status <> 'activo' then
  raise exception 'Solo un moderador activo puede administrar el padrón' using errcode='42501';
 end if;
 select * into target from members where user_id=p_target;
 if not found then raise exception 'El registro ya no existe'; end if;
 if p_revision is not null and target.revision<>p_revision then
  raise exception 'El registro cambió. Actualiza la lista y vuelve a intentarlo';
 end if;
 if p_operation not in ('editar','eliminar') then raise exception 'Operación no válida'; end if;
 next_alias=coalesce(p_changes->>'alias',target.alias);
 next_group=coalesce(p_changes->>'groupCode',target.group_code);
 next_role=coalesce(p_changes->>'role',target.role);
 next_status=coalesce(p_changes->>'status',target.status);
 if char_length(trim(next_alias)) not between 2 and 80 or char_length(trim(next_group)) not between 1 and 30 then
  raise exception 'Revisa el alias y el grupo';
 end if;
 if next_role not in ('alumno','profesor','moderador') or next_status not in ('pendiente','activo','suspendido') then
  raise exception 'Rol o estado no válido';
 end if;
 if p_target=p_actor and (p_operation='eliminar' or next_role<>'moderador' or next_status<>'activo') then
  raise exception 'No puedes eliminar, suspender ni retirar tu propio permiso de moderador';
 end if;
 if target.role='moderador' and target.status='activo' and
    (p_operation='eliminar' or next_role<>'moderador' or next_status<>'activo') then
  select count(*) into active_mods from members where role='moderador' and status='activo';
  if active_mods<=1 then raise exception 'Debe permanecer al menos un moderador activo'; end if;
 end if;
 if p_operation='eliminar' then
  delete from area_mods where user_id=p_target;
  delete from "session" where "userId"=p_target;
  delete from members where user_id=p_target;
  insert into registry_admin_audit(actor_user_id,target_user_id,operation,before_data)
   values(p_actor,p_target,'eliminar_padron',to_jsonb(target));
  return jsonb_build_object('ok',true);
 end if;
 update members set alias=trim(next_alias),group_code=trim(next_group),role=next_role,
  status=next_status,revision=revision+1,updated_at=now() where user_id=p_target returning * into changed;
 if changed.status<>'activo' then
  delete from area_mods where user_id=p_target;
  delete from "session" where "userId"=p_target;
 end if;
 insert into registry_admin_audit(actor_user_id,target_user_id,operation,before_data,after_data)
  values(p_actor,p_target,'editar',to_jsonb(target),to_jsonb(changed));
 return jsonb_build_object('ok',true,'revision',changed.revision);
end;
$$;
