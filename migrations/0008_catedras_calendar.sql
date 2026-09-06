-- Atrio V6.7: Cátedras como calendario académico por sesión.

alter table class_materials add column if not exists professor_name text;
alter table class_materials add column if not exists references_text text;
alter table class_materials add column if not exists bibliography_text text;

-- Completa el profesor de materiales antiguos usando la materia existente.
update class_materials cm
set professor_name = c.chair
from courses c
where cm.course_code = c.code
  and (cm.professor_name is null or btrim(cm.professor_name) = '');

update class_materials
set professor_name = 'Docente no registrado'
where professor_name is null or btrim(professor_name) = '';

create index if not exists class_materials_date_idx
  on class_materials (class_date desc, course_code);
