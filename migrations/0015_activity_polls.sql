-- V6.19: Votaciones públicas de disponibilidad ligadas a actividades de Agenda.

create table if not exists activity_polls (
  id serial primary key,
  event_id integer null references events(id) on delete cascade,
  title text not null,
  prompt text not null default '¿Qué día y hora puedes asistir?',
  description text not null default '',
  is_open boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists activity_polls_event_unique
  on activity_polls(event_id)
  where event_id is not null;

create table if not exists activity_poll_responses (
  id serial primary key,
  poll_id integer not null references activity_polls(id) on delete cascade,
  participant_name text not null,
  participant_key text not null,
  available_date date not null,
  available_time time not null,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, participant_key)
);

create index if not exists activity_poll_responses_poll_idx
  on activity_poll_responses(poll_id, available_date, available_time);
