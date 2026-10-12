# Faculta de Derecho V6.13 — reparación de guardado y edición

## Problema encontrado
El repositorio desplegado tenía `0013_catedras_audio.sql`, pero faltaba `0012_schedule_professor_contacts.sql`.
El código V6.12 ya intenta leer `courses.professor_phone` y `courses.professor_email`. Si esas columnas no existen, `loadBoard()` falla y la interfaz cae silenciosamente a los datos de respaldo (`seedBoard`). Eso hace que una publicación o edición parezca no guardarse.

## Correcciones
- Se restaura `0012_schedule_professor_contacts.sql` en el parche.
- Se añade `0014_content_sync_repair.sql`, idempotente, para garantizar los campos de V6.11/V6.12 aunque se haya saltado una versión.
- Cátedras muestra un aviso visible si la base de datos no puede sincronizarse.
- Cátedras permite guardar una sesión basada sólo en audio, archivo, referencias, bibliografía o liga; ya no parece que el botón “no haga nada” por campos HTML requeridos fuera de pantalla.
- Agenda muestra errores reales, estado “Guardando…”, confirmación de éxito y un aviso visible si la base no carga.
- Agenda ya no bloquea la edición por campos secundarios vacíos; Lugar, Nota y Responsable pueden quedar sin capturar.
