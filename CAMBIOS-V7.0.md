# Cambios de Faculta de Derecho · V7.0.0

Fecha de preparación: 6 de octubre de 2026. Base: ZIP V6.24 proporcionado.

## Identidad e interfaz

El nombre visible pasa a ser **Faculta de Derecho**, tal como fue solicitado. Se renovaron Inicio, navegación lateral, encabezado, accesos rápidos, buscador de secciones, estilos generales, modo claro/oscuro, presentación móvil, iconos y tarjeta para compartir. Se declara que es una comunidad estudiantil independiente y no un sitio oficial.

Las pantallas anteriores siguen disponibles dentro de la nueva estructura. No se ha sustituido el proyecto por una maqueta: el ZIP conserva su backend, autenticación, base de datos, rutas y formularios.

## Plan de estudios

Nueva ruta `/plan-estudios`, independiente del horario del grupo. Contiene las 51 obligatorias de los semestres 1–8, doce espacios para optativas en los semestres 9–10 y el catálogo de 87 opciones. Muestra créditos y los requisitos de seriación publicados. Sólo se muestran las claves numéricas recuperadas de esa seriación; las demás obligatorias aparecen como «CLAVE POR CONFIRMAR» y las optativas sin clave. Los identificadores internos no se presentan como claves oficiales. La ficha no sustituye la consulta del SIAE.

Avance personal por usuario: pendiente, cursando o aprobada; selección de seis optativas por cada uno de los últimos dos semestres; cálculo de hasta 450 créditos, guardado con control de revisión para evitar pisar cambios de otra pestaña, exportación CSV e impresión. Es un registro personal, no un historial SIAE ni una inscripción.

Fuente: https://www.dgae-siae.unam.mx/educacion/planes.php?acc=est&pde=2125&planop=1

Datos estructurados: `src/lib/study/plan.ts` y `docs/v7/plan-2125.json`.

## Noticias

Sección en Inicio y ruta `/noticias`, con filtros por tema/fuente, búsqueda, guardados por navegador, vista compacta y enlaces originales. Tarjetas con gráficos de categoría, imágenes de feeds cuando hay asociación explícita, fotos/gráficos propios y videos subidos a Drive. YouTube se incrusta únicamente después de pulsar reproducir.

Control incorpora editor, borradores, publicación/ocultación, edición, destacado y configuración de fuentes. La lectura es bajo demanda con caché —no un cron ni actualización en tiempo real—. Se guardan los errores y la fecha de última lectura válida. Las referencias iniciales se identifican como tales y no simulan noticias en directo.

No se asigna a un evento una fotografía tomada de un bloque vecino de HTML ni se infiere el año de un cartel a partir de la fecha actual. La DUA permanece enlazada aunque su contenido requiera JavaScript y el adaptador no pueda leerlo. Revisa `FUENTES-NOTICIAS.md`.

## Archivos a Drive

Se reemplazó la ruta de carga utilizada por biblioteca, cátedras, audios, videos, bitácora, servicios y noticias. No existe fallback silencioso a HostGator ni Blob: sin autorización válida, la carga falla con un mensaje. Los endpoints antiguos de carga devuelven un aviso de retirada (HTTP 410).

El servidor autoriza una sesión reanudable; el navegador envía bloques a Google y el servidor confirma el archivo recibido antes de mostrar éxito. Se comprueban usuario, sección, extensión, tamaño, carpeta y metadatos del archivo. No se implementa análisis antivirus del contenido.

Los nuevos archivos se sirven por una ruta protegida del portal. Sólo las imágenes/videos de una noticia expresamente publicada son accesibles sin sesión. No se cambia a “cualquiera con el enlace” en Drive. No se puede garantizar privacidad frente a permisos de compartición que ya existan en la carpeta elegida.

Los datos de usuarios y publicaciones siguen en PostgreSQL: Drive almacena archivos, no sustituye la base de datos. Las notas/enlaces externos no se copian automáticamente.

## Migración y alcance real

`0018_faculta_drive_news_plan.sql` agrega tablas de subidas, cuotas, avance, noticias, caché y bloqueos de actualización. No elimina datos anteriores. El nombre antiguo sólo se conserva en documentos históricos y comentarios de migraciones inmutables, no en la identidad visible.

Esta entrega no cambia el servidor en producción, no transfiere los archivos anteriores y no contiene tokens de Google. El informe de pruebas delimita lo que se ha comprobado.
