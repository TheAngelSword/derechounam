-- V6.12: audios por enlace en Cátedras y fecha de creación de libros.

alter table books
  add column if not exists created_at timestamptz not null default now();

alter table events
  add column if not exists created_at timestamptz not null default now();

alter table class_materials
  add column if not exists audio_url text;

alter table class_materials
  add column if not exists audio_label text;
