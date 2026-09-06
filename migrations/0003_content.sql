create table if not exists professors (
  id serial primary key,
  full_title text not null,
  area text not null,
  office text not null,
  hours text not null,
  modality text not null,
  created_by text not null default 'seed'
);

create table if not exists courses (
  id serial primary key,
  code text not null,
  name text not null,
  chair text not null,
  modality text not null,
  weekday text not null,
  time_slot text not null,
  place text not null,
  semester text not null,
  group_code text not null default '9114',
  created_by text not null default 'seed'
);

create table if not exists events (
  id serial primary key,
  title text not null,
  kind text not null,
  event_date date not null,
  time_slot text not null,
  place text not null,
  modality text not null,
  description text not null,
  host_alias text not null,
  created_by text not null default 'seed'
);

create table if not exists books (
  id serial primary key,
  title text not null,
  author text not null,
  kind text not null,
  course text,
  notes text not null,
  owner_alias text not null,
  created_by text not null default 'seed'
);

create table if not exists rides (
  id serial primary key,
  direction text not null,
  from_place text not null,
  to_place text not null,
  weekday text not null,
  time_slot text not null,
  seats integer not null,
  notes text not null,
  owner_alias text not null,
  created_by text not null default 'seed'
);

create table if not exists study_groups (
  id serial primary key,
  name text not null,
  course text not null,
  when_text text not null,
  place text not null,
  notes text not null,
  created_by text not null default 'seed'
);

create table if not exists notices (
  id serial primary key,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  created_by text not null default 'seed'
);

insert into professors (full_title, area, office, hours, modality) values
  ('Cátedra de Derecho romano I', 'Histórico', 'Edificio D · cubículo 12', 'Lun y mié 14:15–15:15', 'Presencial'),
  ('Cátedra de Acto jurídico y personas', 'Civil', 'Edificio D · cubículo 08', 'Mar y jue 14:15–15:15', 'Presencial'),
  ('Cátedra de Historia del derecho mexicano', 'Histórico', 'Edificio D · cubículo 18', 'Vie 14:15–15:30', 'Presencial'),
  ('Cátedra de Teoría general del Estado', 'Público', 'Edificio E · cubículo 04', 'Lun 15:30–16:30', 'Presencial'),
  ('Cátedra de Sociología jurídica', 'Social', 'Edificio D · cubículo 21', 'Mié 15:30–16:30', 'Presencial'),
  ('Cátedra de Teoría del derecho', 'Fundamentos', 'Edificio D · cubículo 05', 'Jue 15:30–16:30', 'Presencial'),
  ('Cátedra de Ser universitario', 'Formación', 'Edificio E · cubículo 11', 'Vie 15:30–16:15', 'Presencial');

insert into courses (code, name, chair, modality, weekday, time_slot, place, semester, group_code) values
  ('1122', 'Derecho romano I', 'Cátedra de Derecho romano I', 'Presencial', 'Lunes a viernes', '07:00–08:00', 'D-106', 'Primer semestre', '9114'),
  ('1121', 'Acto jurídico y derecho de las personas', 'Cátedra de Acto jurídico y personas', 'Presencial', 'Lunes a viernes', '08:00–09:00', 'D-106', 'Primer semestre', '9114'),
  ('1123', 'Historia del derecho mexicano', 'Cátedra de Historia del derecho mexicano', 'Presencial', 'Lunes a viernes', '09:00–10:00', 'D-106', 'Primer semestre', '9114'),
  ('1127', 'Teoría general del Estado', 'Cátedra de Teoría general del Estado', 'Presencial', 'Lunes a viernes', '10:00–11:00', 'D-106', 'Primer semestre', '9114'),
  ('1126', 'Sociología jurídica', 'Cátedra de Sociología jurídica', 'Presencial', 'Lunes a viernes', '11:00–12:00', 'D-106', 'Primer semestre', '9114'),
  ('1124', 'Introducción a la teoría del derecho', 'Cátedra de Teoría del derecho', 'Presencial', 'Lunes a viernes', '12:00–13:00', 'D-106', 'Primer semestre', '9114'),
  ('1125', 'Ser universitario y cultura de la legalidad', 'Cátedra de Ser universitario', 'Presencial', 'Lunes a viernes', '13:00–14:00', 'E-003', 'Primer semestre', '9114');

insert into events (title, kind, event_date, time_slot, place, modality, description, host_alias) values
  ('Lectura de instituciones de Gayo', 'Taller', '2026-09-08', '16:00–17:30', 'Biblioteca · mesa 2', 'Presencial', 'Derecho romano I. Ficha de una cuartilla sobre personas y cosas.', 'Mesa 9114'),
  ('Mapa de elementos del acto jurídico', 'Taller', '2026-09-10', '16:00–17:30', 'D-106', 'Presencial', 'Consentimiento, objeto y solemnidad. Traer el código civil anotado.', 'Mesa civil'),
  ('Línea del tiempo del derecho novohispano', 'Actividad', '2026-09-11', '16:00–18:00', 'Jardín del edificio D', 'Presencial', 'Historia del derecho mexicano. Cada equipo cubre un siglo.', 'Mesa histórica'),
  ('Cineforo: cultura de la legalidad', 'Actividad', '2026-09-12', '16:30–18:30', 'E-003', 'Presencial', 'Proyección corta y mesa de Ser universitario. Cupo del grupo 9114.', 'Grupo 9114'),
  ('Seminario: Estado, soberanía y constitución', 'Conferencia', '2026-09-15', '16:00–18:00', 'Aula virtual 1', 'En línea', 'Teoría general del Estado. Preguntas al final, una por mesa.', 'Cátedra de TGE'),
  ('Observación de campo para sociología jurídica', 'Taller', '2026-09-17', '16:00–18:00', 'Patio central', 'Presencial', 'Registro de normas vividas en el campus. Entrega de nota el viernes.', 'Mesa sociología');

insert into books (title, author, kind, course, notes, owner_alias) values
  ('Instituciones de Justiniano', 'Trad. García del Corral', 'Préstamo', 'Derecho romano I', 'Casillero D-106. Devolución el lunes siguiente.', 'Mesa romana'),
  ('Derecho civil. Personas', 'Rojina Villegas', 'Venta', 'Acto jurídico y personas', 'Usado, poco subrayado. Precio a convenir en el mural.', 'Estantería 9114'),
  ('Historia del derecho mexicano', 'Guillermo Floris Margadant', 'Préstamo', 'Historia del derecho mexicano', 'Hay dos ejemplares. Recoger en D-106 al terminar la hora.', 'Mesa histórica'),
  ('Teoría general del Estado', 'Jellinek / García Pelayo', 'Recomendación', 'Teoría general del Estado', 'Empieza por el capítulo de soberanía. Hay fotocopias en E-003.', 'Mesa pública'),
  ('Sociología jurídica', 'Elías Díaz / Treves', 'Recomendación', 'Sociología jurídica', 'Lectura corta para el taller de campo.', 'Mesa sociología'),
  ('Introducción al estudio del derecho', 'García Máynez', 'Venta', 'Introducción a la teoría del derecho', 'Pasta suave. Dejar recado en el casillero del grupo.', 'Estantería 9114'),
  ('Ética y cultura de la legalidad', 'Material de la cátedra', 'Préstamo', 'Ser universitario y cultura de la legalidad', 'Cuadernillo de la materia. Se queda en E-003.', 'Grupo 9114');

insert into rides (direction, from_place, to_place, weekday, time_slot, seats, notes, owner_alias) values
  ('Ida', 'Parada principal', 'Edificio D · D-106', 'Lunes', '06:35', 3, 'Para llegar a Romano a las 07:00. Punto: banqueta oriente.', 'Ruta 9114'),
  ('Ida', 'Parada principal', 'Edificio D · D-106', 'Martes', '06:35', 3, 'Misma ruta. Avisar la noche anterior en el mural.', 'Ruta 9114'),
  ('Vuelta', 'Edificio E · E-003', 'Parada principal', 'Lunes', '14:10', 4, 'Sale al terminar Ser universitario.', 'Ruta 9114'),
  ('Vuelta', 'Edificio E · E-003', 'Parada principal', 'Miércoles', '14:10', 3, 'Una parada en la biblioteca si hay quien baje.', 'Ruta 9114'),
  ('Ida', 'Parada norte', 'Edificio D · D-106', 'Viernes', '06:40', 2, 'Solo viernes. Llegar con diez minutos.', 'Ruta norte');

insert into study_groups (name, course, when_text, place, notes) values
  ('Mesa romana', 'Derecho romano I', 'Lunes 16:00', 'Biblioteca · mesa 2', 'Una institución por semana. Ficha de una cuartilla.'),
  ('Mesa de personas', 'Acto jurídico y derecho de las personas', 'Martes 16:00', 'D-106', 'Casos de capacidad y nulidad. Código a la mano.'),
  ('Mesa histórica', 'Historia del derecho mexicano', 'Jueves 16:00', 'Cafetería D', 'Un periodo por sesión. Línea del tiempo compartida.'),
  ('Mesa de teoría', 'Introducción a la teoría del derecho', 'Sábado 10:00', 'En línea · aula 7', 'Norma, validez y fuentes. Un esquema por domingo.'),
  ('Círculo de sociología', 'Sociología jurídica', 'Miércoles 16:00', 'Patio central', 'Notas de campo. Máximo ocho personas.');

insert into notices (title, body, pinned) values
  ('Jornada del grupo 9114', 'Siete horas seguidas: 07:00 a 14:00. Seis materias en D-106; Ser universitario pasa a E-003 a las 13:00.', true),
  ('Cambio de salón a las 13:00', 'Al terminar Teoría del derecho hay que cruzar al edificio E. Dejar mochilas listas a las 12:50.', true),
  ('Lista de asistencia en D-106', 'Pasa al inicio de Romano. Quien llegue después de las 07:10 firma al final.', false),
  ('Fotocopias de García Máynez', 'Hay un tanto en el casillero del grupo, junto al pizarrón de D-106.', false);
