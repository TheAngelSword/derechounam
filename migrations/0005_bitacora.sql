-- Atrio V5: bitácora visual del grupo 9114.

create table if not exists class_posts (
  id serial primary key,
  title text not null,
  body text not null,
  image_url text,
  image_name text,
  shot_date date,
  place text,
  author_alias text not null,
  created_at timestamptz not null default now(),
  created_by text not null default 'seed'
);

insert into class_posts (title, body, image_url, image_name, shot_date, place, author_alias, created_by)
select
  'Primera jornada del grupo 9114',
  'Arranque de clases en D-106. Bitácora abierta para compartir fotos, acuerdos y evidencias de actividades.',
  null,
  null,
  '2026-09-04',
  'D-106',
  'Moderación 9114',
  'seed'
where not exists (select 1 from class_posts where title = 'Primera jornada del grupo 9114');

insert into class_posts (title, body, image_url, image_name, shot_date, place, author_alias, created_by)
select
  'Cruce a E-003',
  'Última materia del bloque diario. Aquí podrán subir fotos del cambio de edificio y avisos rápidos del grupo.',
  null,
  null,
  '2026-09-04',
  'E-003',
  'Grupo 9114',
  'seed'
where not exists (select 1 from class_posts where title = 'Cruce a E-003');
