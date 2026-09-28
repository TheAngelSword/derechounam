-- V6.22: calendario de compromisos y detalles ampliados de votaciones.

alter table activity_polls
  add column if not exists scheduled_date date null;

alter table activity_polls
  add column if not exists scheduled_time text null;

alter table activity_polls
  add column if not exists location_text text null;

alter table activity_polls
  add column if not exists maps_url text null;

alter table activity_polls
  add column if not exists notes text not null default '';

create index if not exists activity_polls_scheduled_date_idx
  on activity_polls(scheduled_date);
