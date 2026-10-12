# Faculta de Derecho V6.11 — Horarios editables y ficha docente

## Cambios

- La sección **Horarios** ahora permite editar cada materia desde la propia tarjeta del horario.
- Se pueden modificar:
  - clave,
  - materia,
  - profesor,
  - horario,
  - salón,
  - días,
  - grupo,
  - semestre,
  - modalidad,
  - teléfono del profesor,
  - correo electrónico del profesor.
- Los permisos de edición respetan el sistema existente: autor del horario, moderador general o moderador asignado al área Horarios.
- Se agregó un **Directorio docente** dentro de Horarios con una ficha por profesor/materia.
- Teléfono y correo son clicables (`tel:` / `mailto:`) cuando existen.
- La tabla administrativa dejó de ser estática y ahora usa los mismos datos vivos del horario.
- Los indicadores de materias, jornada y salones también se calculan desde el horario vigente.
- Al crear una materia desde Control también pueden capturarse teléfono y correo del docente.

## Base de datos

La migración `0012_schedule_professor_contacts.sql` agrega a `courses`:

- `professor_phone`
- `professor_email`

No elimina ni altera los registros existentes.
