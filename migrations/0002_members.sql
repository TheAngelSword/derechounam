create table if not exists members (
  user_id text primary key,
  alias text not null,
  role text not null,
  group_code text not null default '9114',
  status text not null default 'activo',
  created_at timestamptz not null default now()
);

create table if not exists area_mods (
  user_id text not null,
  area text not null,
  primary key (user_id, area)
);

create table if not exists access_log (
  id serial primary key,
  user_id text not null,
  alias text not null,
  area text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists access_log_created_idx on access_log (created_at desc);
