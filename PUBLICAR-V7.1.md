# Publicar V7.1 sin mezclar las bases

## Primero: Preview

1. Abrir el último deployment de `prueba-v7`, no uno antiguo de `main`. Esperar Ready y revisar que el commit sea el de V7.1. La dirección estable de la rama permanece igual.
2. Entrar con una cuenta A: marcar una materia Aprobada y otra Reprobada, recargar. En otra sesión entrar con una cuenta B y comprobar que no hereda esos cambios. Sólo la aprobada suma créditos. El avance ya estaba separado por usuario en V7 y esta actualización conserva esa separación.
3. Noticias: en Control, usar Guardar y probar para renovar las fuentes; la caché ya existente puede conservar portadas previas hasta que venza. Revisar foto, referencia gráfica y video. Una fuente puede no proporcionar imagen o impedir su carga; debe aparecer la ilustración, nunca una foto ajena.
4. Votaciones: probar Me adapto, varios días, hora exacta, empate y fecha pasada en una votación de prueba. Comparar recuentos y tabla. Confirmar que Editar, creación de actividades y participantes conservan su comportamiento.
5. Comprobar cátedras, biblioteca, login, materiales antiguos y el aspecto móvil. No publicar hasta que las comprobaciones de GitHub y Vercel hayan terminado correctamente.

## Production: revisar las variables por separado

En las capturas varias variables pasaron de Production and Preview a Preview / prueba-v7. Eso no prueba que sus entradas de Production sigan existiendo. En Vercel filtrar por Production y comprobar, sin compartir valores secretos:

| Variable | Valor/entorno correcto |
| --- | --- |
| DATABASE_URL | Conexión de Neon **production**, no prueba-v7. |
| BETTER_AUTH_URL | https://derechounam.com |
| APP_PUBLIC_URL | https://derechounam.com |
| VITE_PUBLIC_HOSTNAME | derechounam.com |
| BETTER_AUTH_SECRET | Secreto estable propio de Production. No cambiarlo sólo por actualizar la interfaz. |
| VITE_AUTH_ENABLED | true |
| GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REFRESH_TOKEN | Autorización del servidor de la aplicación, no del chat. |
| GOOGLE_DRIVE_FOLDER_ID | Carpeta definitiva del portal, no una carpeta de pruebas por accidente. |

Si falta una entrada de Production, crearla para Production; no mover la entrada de Preview. No copiar el DATABASE_URL de pruebas para resolver un fallo de producción. La alternativa de cuenta de servicio para Drive exige una unidad compartida compatible; ver CONFIGURAR-DRIVE.md.

## Google Drive

La conexión de Drive en ChatGPT no configura la aplicación de Vercel. Usar el asistente `scripts/authorize-drive.mjs` y las instrucciones de `CONFIGURAR-DRIVE.md`. No compartir `.env.drive.local`, el JSON OAuth, el refresh token ni capturas con contraseñas.

Antes de publicar, Control → Google Drive → Probar conexión. Después subir un archivo pequeño sin datos sensibles, verificar que llega a la carpeta correcta y abrirlo desde otra sesión autorizada. Los enlaces a archivos antiguos se conservan; no se trasladan ni se eliminan con esta actualización.

Una contraseña de Neon apareció en una captura previa. Si también se utilizaba en otra rama, revisar y rotar la credencial afectada en esa rama y actualizar su variable correspondiente; el cambio de una rama no debe asumirse como rotación de todas. Coordinar el cambio para no interrumpir producción.

## Pase a producción

1. Identificar y conservar el deployment de producción que funciona y preparar respaldo de la base productiva con las herramientas de Neon. No sobrescribir production con una copia de prueba-v7.
2. Cuando el Preview y las pruebas de aceptación estén correctos, revisar la Pull Request de `prueba-v7` a `main`. Resolver conflictos sin forzar la rama ni aceptar todo un lado a ciegas.
3. Fusionar la Pull Request para que Vercel construya Production con sus variables propias. Esta actualización no publica main automáticamente.
4. Verificar `https://derechounam.com`: versión visible 7.1.0, login, plan personal, noticias, votaciones, materiales existentes y una subida de prueba a la carpeta definitiva.

No se incluye ninguna migración SQL nueva en V7.1. Las migraciones previas pendientes de V7 sí seguirán ejecutándose en el build habitual; conservar la carpeta `migrations/`.

El rollback de un deployment no revierte cambios de datos realizados por usuarios. Si surge un fallo, conservar logs sin secretos y revisar el entorno/commit antes de hacer cambios.

## Validación local opcional

Desde la raíz, después de sincronizar la rama:

```sh
npm ci
node --experimental-strip-types --test tests/v7/*.test.ts tests/v71/*.test.ts
npm run check:syntax
npm run build:code
```

No usar `npm audit fix --force` a ciegas. Una captura de instalación anterior mostraba dos alertas altas sin detalle; revisar `npm audit` antes del pase definitivo. El build correcto por sí solo no demuestra ausencia de vulnerabilidades.
