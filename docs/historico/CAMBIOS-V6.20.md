# Faculta de Derecho V6.20 — Disponibilidad flexible en Votaciones

## Cambios

- Se agregan tres modos de disponibilidad para participantes públicos:
  - **Fecha y hora**: selección exacta, como en V6.19.
  - **Me adapto**: no solicita día ni hora y registra disponibilidad total.
  - **Varios días**: permite seleccionar varios días de la semana (lunes a domingo) y una hora preferida opcional.
- El resumen de la votación ahora muestra:
  - número de personas que eligieron **Me adapto**;
  - conteo por día de la semana;
  - coincidencias de fecha/hora exacta.
- El administrador puede editar respuestas existentes conservando los tres modos de disponibilidad.
- Una persona puede volver a guardar con el mismo nombre para actualizar su disponibilidad sin duplicarse.

## Base de datos

Se agrega la migración `0016_flexible_poll_availability.sql`, que:

- añade `availability_mode`;
- añade `preferred_weekdays`;
- permite que `available_date` y `available_time` sean nulos cuando se usa **Me adapto** o **Varios días**.

No requiere cambios en HostGator ni en `media.ge01.com`.
