# Faculta de Derecho V6.19 — Votaciones y disponibilidad

## Cambios principales

- Nueva sección **Votaciones** en el menú principal.
- Las actividades de **Agenda** pueden abrir una votación de disponibilidad.
- Una votación ligada a Agenda muestra el número de personas registradas y un acceso directo a la sección Votaciones.
- Cualquier visitante puede participar **sin crear cuenta**: sólo escribe su nombre, selecciona un día y una hora y pulsa Guardar.
- Si la misma persona vuelve a guardar usando el mismo nombre, se actualiza su disponibilidad en vez de duplicarse.
- La sección muestra:
  - total de personas registradas;
  - lista de nombres, día y hora;
  - resumen de combinaciones día/hora ordenadas por mayor coincidencia;
  - comentarios opcionales.
- El autor de la votación o un administrador puede editar título, pregunta, descripción y abrir/cerrar la votación.
- Los administradores pueden corregir o eliminar participaciones individuales y eliminar votaciones completas.
- Un administrador también puede crear una votación independiente sin ligarla a Agenda.
- Las votaciones públicas tienen validación de longitud, límite de participantes y un campo trampa anti-bots básico.

## Migración

Se agrega:

`migrations/0015_activity_polls.sql`

Crea las tablas:

- `activity_polls`
- `activity_poll_responses`

Vercel ejecutará la migración automáticamente durante `npm run db:migrate`.

## Archivos principales

- `src/routes/agenda.tsx`
- `src/routes/votaciones.tsx`
- `src/lib/votaciones.ts`
- `src/components/shell.tsx`
- `migrations/0015_activity_polls.sql`

No requiere cambios en HostGator ni en `media.ge01.com`.
