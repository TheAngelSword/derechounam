-- Atrio V4: docentes reales del grupo 9114 y biblioteca académica ampliada.

-- Complementos bibliográficos y enlaces/archivos.
alter table books add column if not exists publisher text;
alter table books add column if not exists publication_year text;
alter table books add column if not exists edition text;
alter table books add column if not exists isbn text;
alter table books add column if not exists file_url text;
alter table books add column if not exists file_name text;
alter table books add column if not exists external_url text;
alter table books add column if not exists commerce_url text;
alter table books add column if not exists price_text text;

-- Datos académicos proporcionados para el grupo 9114.
update courses set chair = 'Mtra. Roxana Trigueros Olivares', weekday = 'Lunes a viernes', time_slot = '07:00–08:00', place = 'D-106'
where code = '1122' and group_code = '9114';
update courses set chair = 'Lic. Arturo Belmont Martínez', weekday = 'Lunes a viernes', time_slot = '08:00–09:00', place = 'D-106'
where code = '1121' and group_code = '9114';
update courses set chair = 'Lic. Dionisio Eduardo Barco Martínez', weekday = 'Lunes a viernes', time_slot = '09:00–10:00', place = 'D-106'
where code = '1123' and group_code = '9114';
update courses set chair = 'Dr. Marcial Manuel Cruz Vázquez', weekday = 'Lunes a viernes', time_slot = '10:00–11:00', place = 'D-106'
where code = '1127' and group_code = '9114';
update courses set chair = 'Mtra. María Fernanda González Nahle', weekday = 'Lunes a viernes', time_slot = '11:00–12:00', place = 'D-106'
where code = '1126' and group_code = '9114';
update courses set chair = 'Mtra. Lizzet Urbina Anguas', weekday = 'Lunes a viernes', time_slot = '12:00–13:00', place = 'D-106'
where code = '1124' and group_code = '9114';
update courses set chair = 'Lic. Apolinar Medardo Ramírez Figueroa', weekday = 'Lunes a viernes', time_slot = '13:00–14:00', place = 'E-003'
where code = '1125' and group_code = '9114';

-- Las fichas de cátedra ahora muestran al docente real.
update professors set full_title = 'Mtra. Roxana Trigueros Olivares' where id = 1;
update professors set full_title = 'Lic. Arturo Belmont Martínez' where id = 2;
update professors set full_title = 'Lic. Dionisio Eduardo Barco Martínez' where id = 3;
update professors set full_title = 'Dr. Marcial Manuel Cruz Vázquez' where id = 4;
update professors set full_title = 'Mtra. María Fernanda González Nahle' where id = 5;
update professors set full_title = 'Mtra. Lizzet Urbina Anguas' where id = 6;
update professors set full_title = 'Lic. Apolinar Medardo Ramírez Figueroa' where id = 7;

-- Metadatos iniciales para que las tarjetas existentes puedan producir una referencia bibliográfica.
update books set publisher = 'Imprenta de Jaime Molinas', publication_year = '1889', edition = 'Edición digital / consulta'
where title = 'Instituciones de Justiniano' and publisher is null;
update books set publisher = 'Porrúa', publication_year = 's. f.', edition = 'Consulta la edición disponible'
where title = 'Derecho civil. Personas' and publisher is null;
update books set publisher = 'Porrúa', publication_year = 's. f.', edition = 'Consulta la edición disponible'
where title = 'Historia del derecho mexicano' and publisher is null;
update books set publication_year = 's. f.', edition = 'Consulta la edición disponible', kind = 'Bibliografía'
where title = 'Teoría general del Estado' and publisher is null;
update books set publication_year = 's. f.', edition = 'Consulta la edición disponible', kind = 'Bibliografía'
where title = 'Sociología jurídica' and publisher is null;
update books set publisher = 'Porrúa', publication_year = 's. f.', edition = 'Consulta la edición disponible'
where title = 'Introducción al estudio del derecho' and publisher is null;
update books set publication_year = 's. f.', edition = 'Material de cátedra'
where title = 'Ética y cultura de la legalidad' and publisher is null;
