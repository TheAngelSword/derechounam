-- Additive upgrade: no existing users, courses, materials or links are deleted.
create table if not exists drive_uploads (
  id text primary key,
  user_id text not null,
  category text not null check (category in ('biblioteca','bitacora','catedras','servicios','noticias')),
  file_name text not null,
  mime_type text not null,
  expected_size bigint not null check (expected_size > 0),
  parent_id text not null,
  drive_file_id text unique,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index if not exists drive_uploads_owner_created on drive_uploads(user_id,created_at);
create table if not exists study_progress (
  user_id text primary key,
  progress jsonb not null default '{}',
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists news_posts (
  id bigserial primary key,
  title text not null,
  summary text not null,
  source_name text not null,
  source_url text not null,
  category text not null,
  legal_stage text not null default 'Información',
  published_at timestamptz,
  event_date date,
  image_upload_id text references drive_uploads(id),
  video_upload_id text references drive_uploads(id),
  youtube_id text,
  pinned boolean not null default false,
  published boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now()
);
create table if not exists news_cache (
  source_id text primary key,
  items jsonb not null default '[]',
  fetched_at timestamptz,
  checked_at timestamptz,
  last_error text
);
create table if not exists news_refresh_locks (
  source_id text primary key,
  expires_at timestamptz not null
);

create table if not exists drive_daily_quotas (
  user_id text not null, quota_day date not null, attempts integer not null default 0,
  reserved_bytes bigint not null default 0, primary key(user_id,quota_day)
);
