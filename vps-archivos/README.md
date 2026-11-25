# Servidor de archivos en el VPS

Guarda los archivos que se suben al portal (biblioteca, bitácora, cátedras, servicios y noticias).
Textos, cuentas y votaciones siguen en PostgreSQL.

## Cómo funciona

1. El navegador pide permiso a `/api/drive-upload`. El portal revisa sesión, registro activo, formato, tamaño y cuota diaria, y firma un permiso de subida que vence en 6 horas.
2. El navegador envía el archivo directo a `https://archivos.derechounam.com/u/<id>` en bloques de 8 MiB (`Upload-Offset`). Si se corta, `HEAD` indica dónde seguir.
3. Al recibir el último byte, el servidor firma un recibo. `/api/drive-complete` lo verifica y marca el archivo como confirmado.
4. Para abrir un archivo, `/api/drive-file?id=` revisa los permisos y redirige a un enlace firmado que vence en 10 minutos. Admite rangos para audio y video.

El servidor no conoce usuarios: solo acepta permisos firmados con `ARCHIVOS_SECRET`.

## Dónde está

| Elemento | Ubicación |
|---|---|
| Código | `/srv/derechounam-archivos/app` |
| Archivos | `/srv/derechounam-archivos/data/<2 letras>/<id>` y `<id>.json` |
| Contenedor | `derechounam-archivos-archivos-1`, en `127.0.0.1:8795`, usuario `node`, disco de solo lectura salvo `/data` |
| HTTPS | Bloque `archivos.derechounam.com` en `/etc/caddy/Caddyfile` (copia previa: `Caddyfile.antes-derechounam`) |
| DNS | Registros A y AAAA `archivos` en Vercel DNS |
| Secretos | `ARCHIVOS_SECRET` en `app/.env` (permiso 600) y en Vercel Production; deben coincidir |

## Actualizar

```bash
scp Dockerfile compose.yml server.mjs token.mjs root@VPS:/srv/derechounam-archivos/app/
ssh root@VPS 'cd /srv/derechounam-archivos/app && chmod 644 Dockerfile compose.yml *.mjs && docker compose -p derechounam-archivos up -d --build'
```

## Rotar la clave

Genera una nueva, cámbiala en `app/.env` y en Vercel al mismo tiempo, reinicia el contenedor y vuelve a desplegar el portal. Los enlaces y subidas en curso dejarán de valer.

## Desactivar

Quita `ARCHIVOS_URL` en Vercel y vuelve a desplegar: el portal regresa a Google Drive (si está configurado). Los archivos ya guardados en el VPS no se mueven.

## Respaldo

**Pendiente.** Los archivos solo existen en el disco del VPS. Configura una copia diaria fuera del servidor antes de usarlo para material importante.
