# Faculta de Derecho V6.1 – almacenamiento en HostGator / ge01.com

## Cambio principal

Faculta de Derecho deja de usar Vercel Blob para las nuevas cargas y guarda los archivos en el hosting de `ge01.com`.

La subida es directa desde el navegador a `https://media.ge01.com/_upload/upload.php`, autorizada por un token corto generado por Faculta de Derecho en Vercel. Esto evita exponer credenciales FTP y evita el límite de carga de las Functions de Vercel.

## Estructura de carpetas

- `biblioteca/YYYY/MM/`
- `bitacora/YYYY/MM/`
- `catedras/CLAVE/YYYY/MM/`
- `servicios/YYYY/MM/`

Ejemplos:

- `biblioteca/2026/09/20260906-...-constitucion.pdf`
- `bitacora/2026/09/20260906-...-clase-romano.jpg`
- `catedras/1122/2026/09/20260906-...-apuntes.pdf`
- `servicios/2026/09/20260906-...-sandwich.jpg`

## Qué queda en Neon

Los títulos, fechas, autores, descripción, materia, precio, etc. continúan en PostgreSQL/Neon. El archivo físico queda en HostGator y Neon guarda su URL pública.

## Variables nuevas en Vercel

- `FACULTA_MEDIA_UPLOAD_SECRET`: secreto aleatorio de al menos 32 caracteres. Debe ser idéntico al configurado en HostGator.
- `FACULTA_MEDIA_UPLOAD_URL`: `https://media.ge01.com/_upload/upload.php`

## HostGator

El directorio `hostgator-media/` incluido con el proyecto contiene el gateway PHP y las carpetas base que deben instalarse en el document root del subdominio `media.ge01.com`.
