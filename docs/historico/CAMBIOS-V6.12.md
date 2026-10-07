# Faculta de Derecho V6.12 — audios, recursos protegidos y portada de actividad

## Cátedras
- Se agregó un campo opcional para **Audio por enlace** dentro de cada sesión de clase.
- El audio se registra con una URL (por ejemplo Google Drive/Docs) y una descripción corta.
- **El audio no se sube a HostGator**; Faculta de Derecho guarda únicamente la liga.
- El audio queda asociado a fecha, materia, profesor y sesión académica.
- Autor o administrador pueden editar posteriormente la liga y la descripción.

## Acceso a recursos
- Las fichas de Biblioteca y Cátedras siguen siendo visibles públicamente.
- Para abrir/descargar **PDF, Word, EPUB o audios**, el usuario debe tener una cuenta activa en el padrón.
- Si no está registrado, Faculta de Derecho muestra: **“Regístrate para poder usar los recursos.”** y un acceso a Registro.
- Los enlaces de consulta externa y compra de libros continúan visibles porque no son descargas del repositorio.

## Inicio
- Nuevo título: **Las últimas actividades**.
- La portada ya no se centra sólo en el horario del día.
- Genera automáticamente segmentos por categoría y muestra como máximo **5 categorías**.
- En cada categoría aparecen sus **3 publicaciones más recientes**.
- Puede incluir: Audios, Libros, Trabajos y tareas, Servicios, Actividades, Bitácora y Mural.
- Las categorías se ordenan por actividad reciente y las que no tienen contenido no ocupan espacio.

## Cambios de títulos
- Agenda: **Actividades del grupo 9114**.
- Tareas: **Trabajos y tareas**.
- Mural: **Mural de avisos**.
- Texto del Mural: **“Tienes un aviso para todo el grupo, lo puedes publicar aquí”**.

## Base de datos
La migración `0013_catedras_audio.sql`:
- agrega `created_at` a `books` y `events` para ordenar actividad reciente;
- agrega `audio_url` y `audio_label` a `class_materials`.

No requiere cambios en HostGator ni en `media.ge01.com` para los audios.
