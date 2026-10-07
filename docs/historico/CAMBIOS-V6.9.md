# Faculta de Derecho Derecho UNAM – V6.9

## Nueva sección: Tareas

Se agregó `/tareas` al portal y al menú principal.

### Cada tarea registra
- Profesor (se selecciona primero).
- Materia asociada al profesor.
- Fecha en que se dejó la tarea.
- Fecha límite de entrega.
- Título e instrucciones completas.
- Libro o recurso opcional de la Biblioteca de Faculta de Derecho.
- Documentación o referencia adicional opcional.
- Método de entrega:
  - A mano
  - Computadora / archivo digital
  - Impresa
  - En línea / plataforma
  - Oral / exposición
  - Otro
- Detalle adicional de cómo debe entregarse.
- Usuario que registró la tarea.

### Consulta
- Filtros: Todas, Próximas y Vencidas.
- Filtro por profesor.
- Indicador de tareas que vencen en los próximos 7 días.
- Indicador visual de TAREA VENCIDA y ENTREGA PRÓXIMA.
- Visualización del libro/recurso y documentación relacionada.

### Permisos
- Cualquier usuario activo del padrón puede registrar tareas.
- Sólo el autor de la tarea o un administrador/moderador puede editarla.
- Un administrador puede eliminar tareas desde Control.

### Base de datos
Nueva migración:
`migrations/0011_tasks.sql`

La migración crea la tabla `tasks` y sus índices. Vercel la ejecuta automáticamente en el deploy mediante el flujo de migraciones actual.

### Almacenamiento
Esta actualización no necesita cambios en `media.ge01.com`, porque las tareas relacionan libros/documentación existente y no agregan un nuevo tipo de archivo subido.
