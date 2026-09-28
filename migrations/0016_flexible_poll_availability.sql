-- V6.20: disponibilidad flexible, "Me adapto" y selección de varios días.

alter table activity_poll_responses
  add column if not exists availability_mode text not null default 'specific';

alter table activity_poll_responses
  add column if not exists preferred_weekdays text not null default '';

alter table activity_poll_responses
  alter column available_date drop not null;

alter table activity_poll_responses
  alter column available_time drop not null;

-- Los registros existentes siguen siendo fecha/hora específica.
update activity_poll_responses
set availability_mode = 'specific'
where availability_mode is null or availability_mode = '';
