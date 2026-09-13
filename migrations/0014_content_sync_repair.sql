-- V6.13: reparación idempotente para instalaciones que saltaron V6.11.
-- V6.12 usa estos campos al cargar el tablero; si faltan, React Query cae al seed
-- y las publicaciones/ediciones parecen no guardarse aunque la mutación se ejecute.

alter table courses
  add column if not exists professor_phone text;

alter table courses
  add column if not exists professor_email text;

alter table books
  add column if not exists created_at timestamptz not null default now();

alter table events
  add column if not exists created_at timestamptz not null default now();

alter table class_materials
  add column if not exists audio_url text;

alter table class_materials
  add column if not exists audio_label text;
