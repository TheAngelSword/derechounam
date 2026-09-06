-- Atrio V6: servicios del grupo y expediente vivo por cátedra.

create table if not exists class_materials (
  id serial primary key,
  course_code text not null,
  course_name text not null,
  class_date date not null,
  kind text not null,
  title text not null,
  body text not null,
  file_url text,
  file_name text,
  external_url text,
  author_alias text not null,
  created_at timestamptz not null default now(),
  created_by text not null default 'seed'
);

create index if not exists class_materials_course_date_idx
  on class_materials (course_code, class_date desc);

create table if not exists service_offers (
  id serial primary key,
  title text not null,
  category text not null,
  description text not null,
  price_text text not null,
  availability_days text not null,
  delivery_place text not null,
  order_cutoff text,
  how_to_order text not null,
  image_url text,
  image_name text,
  seller_alias text not null,
  created_at timestamptz not null default now(),
  created_by text not null default 'seed'
);

create index if not exists service_offers_created_idx
  on service_offers (created_at desc);
