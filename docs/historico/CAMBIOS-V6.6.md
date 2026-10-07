# Faculta de Derecho V6.6 — Sincronización Control ↔ Cátedras

## Problema corregido
La página de Cátedras estaba construyendo sus tarjetas directamente desde `courses` (Horarios), mientras que el panel Control eliminaba registros de `professors`. Por eso quitar una cátedra en Control no tenía efecto visual en la página de Cátedras.

## Nuevo comportamiento
- Cátedras sólo muestra materias cuyo docente/cátedra siga activo en el inventario de Cátedras de Control.
- Quitar una cátedra en Control la oculta de Cátedras y de su expediente de materiales, pero conserva la materia en Horarios.
- Para borrar también el horario se usa el inventario “Horarios / materias”.
- El formulario “Subir una cátedra” ahora permite seleccionar una materia/docente existente, evitando errores de nombres escritos de forma distinta.
- Los materiales de una cátedra oculta tampoco se muestran dentro de “Todas”.

## Archivos modificados
- `src/routes/catedras.tsx`
- `src/routes/control.tsx`

No requiere migración de base de datos ni cambios en Vercel/HostGator.
