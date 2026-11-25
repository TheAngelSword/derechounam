-- Additive. 0021 is reserved by the personal-space branch.
alter table activity_poll_responses add column if not exists edit_token_hash text;

-- Locks the ride so simultaneous requests cannot exceed its seats.
create or replace function portal_reserve_ride(p_ride integer, p_user text, p_alias text) returns text language plpgsql as $$
declare
 ride rides%rowtype;
 taken integer;
begin
 select * into ride from rides where id=p_ride for update;
 if not found then return 'missing'; end if;
 if ride.created_by=p_user then return 'own'; end if;
 if exists(select 1 from ride_reservations where ride_id=p_ride and user_id=p_user) then return 'already'; end if;
 select count(*) into taken from ride_reservations where ride_id=p_ride;
 if taken>=ride.seats then return 'full'; end if;
 insert into ride_reservations(ride_id,user_id,requester_alias) values(p_ride,p_user,p_alias);
 return 'ok';
end;
$$;
