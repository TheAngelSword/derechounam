# Faculta de Derecho V6.4 — edición de publicaciones

## Nueva regla de edición

Las publicaciones del portal ahora pueden editarse con una regla estricta:

- El usuario que creó la publicación puede modificarla.
- Un moderador/administrador activo también puede modificarla.
- Los demás usuarios sólo pueden verla.
- La validación se aplica tanto en la interfaz como en el servidor; no basta con ocultar el botón.

## Secciones con botón Editar

- Biblioteca / Libros
- Bitácora
- Servicios
- Cátedras (apuntes, tareas, fotos y materiales)
- Agenda
- Rutas
- Mesas
- Mural

## Archivos adjuntos

Al editar una publicación con archivo o fotografía:

- si no se selecciona un archivo nuevo, se conserva el existente;
- si se selecciona uno nuevo, se sube a `media.ge01.com` y la publicación queda apuntando al nuevo archivo.

## Base de datos

No requiere una migración nueva. Las tablas actuales ya conservan `created_by`, que ahora se usa para verificar la propiedad de cada publicación.
