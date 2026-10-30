-- Espacio personal del titular. No modifica tablas del portal.
create table if not exists personal_items (
  id text primary key,
  owner_user_id text not null,
  kind text not null check (kind in ('tarea','examen','actividad','diplomado','repaso','lectura','clase','reunion','compromiso')),
  title text not null,
  notes text not null default '',
  subject text not null default '',
  location text not null default '',
  url text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  due_at timestamptz,
  all_day boolean not null default false,
  priority text not null default 'normal' check (priority in ('normal','importante','critico')),
  status text not null default 'pendiente' check (status in ('pendiente','hecho','archivado')),
  reminder_minutes text not null default '1440,60',
  ease double precision not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  next_review_at timestamptz,
  progress_current integer not null default 0,
  progress_total integer not null default 0,
  progress_unit text not null default 'paginas' check (progress_unit in ('paginas','minutos','capitulos','porcentaje')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists personal_items_owner_idx on personal_items (owner_user_id, status);
create table if not exists personal_reminder_log (
  id bigserial primary key,
  owner_user_id text not null,
  item_id text references personal_items(id) on delete cascade,
  dedup_key text not null unique,
  channel text not null,
  status text not null,
  error text,
  sent_at timestamptz not null default now()
);
create table if not exists personal_inbound (
  provider_message_id text primary key,
  received_at timestamptz not null default now()
);
