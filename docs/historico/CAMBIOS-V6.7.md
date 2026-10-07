# Faculta de Derecho V6.7 — Cátedras como calendario académico

## Cambio principal
La sección Cátedras deja de ser un directorio de tarjetas por materia y se convierte en un calendario/bitácora académica por fecha.

## Funcionalidad
- Calendario mensual con navegación entre meses.
- Indicador del número de registros guardados en cada día.
- Al seleccionar una fecha se muestran las clases programadas del grupo 9114 con:
  - materia,
  - clave,
  - profesor,
  - horario,
  - salón.
- Botón Registrar en cada clase para precargar materia y profesor.
- Formulario de sesión con selección explícita de materia y profesor.
- Registro de:
  - fecha,
  - tipo de contenido,
  - tema,
  - apuntes / resumen,
  - referencias,
  - bibliografía,
  - fotografía o archivo,
  - liga complementaria.
- Las fotografías y archivos siguen almacenándose en media.ge01.com organizados por cátedra/año/mes.
- El autor de la publicación o un administrador puede editar cada sesión.

## Base de datos
Nueva migración `migrations/0008_catedras_calendar.sql` que agrega a `class_materials`:
- `professor_name`
- `references_text`
- `bibliography_text`

Los registros anteriores reciben automáticamente el profesor relacionado con la clave de la materia cuando es posible.
