# Faculta de Derecho V6.10 — Tareas compactas, archivo automático y corrección de publicación

## Correcciones

- Se corrige el error `can't access property "reset", e.currentTarget is null` al publicar una tarea.
- El formulario conserva una referencia estable al formulario antes de ejecutar operaciones asíncronas.
- Las instrucciones admiten hasta **20,000 caracteres**.
- El detalle de entrega admite hasta **20,000 caracteres**.
- La documentación/referencia admite hasta **10,000 caracteres**.
- El título admite hasta **300 caracteres**.

## Nueva presentación de Tareas

- La pantalla principal sólo muestra tareas **activas**, es decir, cuya fecha de entrega todavía no ha pasado.
- Las tareas activas aparecen como una lista compacta con:
  - materia,
  - profesor,
  - fecha de entrega,
  - método de entrega,
  - pequeño extracto de las instrucciones,
  - recurso/bibliografía cuando corresponda,
  - botón Editar para autor o administrador.
- Las tareas cuya fecha de entrega ya pasó se mueven automáticamente a **Tareas pasadas**.
- `Tareas pasadas` está colapsada por defecto y no ocupa la pantalla principal.
- Las tareas pasadas siguen siendo editables por su autor o un administrador.
- Se conserva el filtro por profesor y se agrega el filtro de próximas 7 días.

## Base de datos

No requiere migración nueva: los campos de texto de PostgreSQL ya soportan los nuevos límites y la separación entre activas/pasadas se calcula por `due_date`.
