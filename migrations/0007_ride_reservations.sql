-- Atrio V6.5: solicitud y reserva de asientos en Rutas.

create table if not exists ride_reservations (
  id serial primary key,
  ride_id integer not null references rides(id) on delete cascade,
  user_id text not null,
  requester_alias text not null,
  created_at timestamptz not null default now(),
  unique (ride_id, user_id)
);

create index if not exists ride_reservations_ride_idx
  on ride_reservations (ride_id, created_at);
