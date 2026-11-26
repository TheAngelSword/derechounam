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

Copia diaria a Google Drive con rclone (remoto `gdrive`, permiso `drive.file`: solo ve lo que rclone creó).

| Elemento | Ubicación |
|---|---|
| Script | `/usr/local/sbin/respaldo-derechounam` |
| Horario | `respaldo-derechounam.timer`, 04:00 UTC ± 15 min; si el VPS estaba apagado, corre al encender |
| Destino | `Respaldo-derechounam/actual` en Drive (copia espejo, sin `*.part`) |
| Borrados | Lo eliminado o reemplazado pasa a `Respaldo-derechounam/borrados/<fecha>` |
| Último éxito | `/var/lib/respaldo-derechounam.ok` |
| Credencial | `/root/.config/rclone/rclone.conf` (permiso 600) |

Revisar:

```bash
systemctl list-timers respaldo-derechounam.timer
journalctl -u respaldo-derechounam -n 20
cat /var/lib/respaldo-derechounam.ok
```

Restaurar todo (o una carpeta `<2 letras>`):

```bash
rclone copy gdrive:Respaldo-derechounam/actual /srv/derechounam-archivos/data
chown -R 1000:1000 /srv/derechounam-archivos/data
```

Un archivo borrado se recupera de `borrados/<fecha>/<2 letras>/<id>` (y su `<id>.json`).

Si `rclone about gdrive:` dice que el token venció, vuelve a autorizar: abre un túnel `ssh -L 53682:127.0.0.1:53682 root@VPS`, ejecuta `rclone config reconnect gdrive:` y abre en esta PC el enlace que imprime.

La carpeta `borrados` crece sin límite; bórrala a mano cuando haga falta (`rclone purge gdrive:Respaldo-derechounam/borrados/<fecha>`).
