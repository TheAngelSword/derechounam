# Faculta de Derecho V6.5 — Reservación de asientos en Rutas

## Cambios

- Cada ruta ahora muestra **lugares disponibles** en tiempo real.
- Los integrantes activos del grupo pueden pulsar **Pedir un asiento**.
- Se guarda el **nombre/alias del compañero que reservó** y aparece en la tarjeta de la ruta.
- Cada usuario sólo puede reservar un asiento por ruta.
- El conductor/autor de la ruta no puede reservar su propia ruta.
- Un pasajero puede **Cancelar mi asiento** para liberar el lugar.
- Cuando las reservas alcanzan la capacidad publicada, la ruta muestra **LLENO** en rojo y ya no acepta nuevas solicitudes.
- El autor o administrador puede seguir editando la ruta, pero no puede reducir el número de asientos por debajo de las reservas ya confirmadas.

## Base de datos

Nueva migración:

`migrations/0007_ride_reservations.sql`

Crea `ride_reservations` con una reserva única por usuario y ruta.

## Archivos principales modificados

- `src/routes/rutas.tsx`
- `src/lib/content.ts`
- `src/lib/types.ts`
- `src/lib/seed.ts`
- `src/lib/store.ts`
- `migrations/0007_ride_reservations.sql`
