-- Atrio V6.8.1: fallback server-side para configuración del almacenamiento de medios.
-- Evita depender exclusivamente de variables de entorno del runtime de Vercel.

create table if not exists app_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'system'
);
