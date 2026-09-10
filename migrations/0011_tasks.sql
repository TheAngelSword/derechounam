-- Atrio V6.9: Tareas por profesor, materia, fechas, recurso y método de entrega.

create table if not exists tasks (
  id serial primary key,
  professor_name text not null,
  course_code text not null,
  course_name text not null,
  assigned_date date not null,
  due_date date not null,
  title text not null,
  instructions text not null,
  delivery_method text not null check (delivery_method in (
    'A mano',
    'Computadora / archivo digital',
    'Impresa',
    'En línea / plataforma',
    'Oral / exposición',
    'Otro'
  )),
  delivery_details text,
  book_id integer references books(id) on delete set null,
  resource_title text,
  documentation_text text,
  author_alias text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_due_after_assigned check (due_date >= assigned_date)
);

create index if not exists idx_tasks_due_date on tasks (due_date);
create index if not exists idx_tasks_professor on tasks (professor_name);
create index if not exists idx_tasks_course_code on tasks (course_code);
