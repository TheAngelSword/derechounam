# Faculta de Derecho V6.8.1 – respaldo de configuración de medios en Neon

## Problema corregido
En algunos deployments de Vercel con TanStack Start + Nitro la variable `FACULTA_MEDIA_UPLOAD_SECRET` puede no estar disponible para la función aunque aparezca configurada en Production.

## Solución
- Faculta de Derecho sigue intentando usar primero `FACULTA_MEDIA_UPLOAD_SECRET` y `FACULTA_MEDIA_UPLOAD_URL` de Vercel.
- Si el secreto no está disponible, usa un respaldo server-side guardado en Neon.
- El panel **Control** ahora incluye **Almacenamiento de archivos → media.ge01.com**.
- Sólo un moderador activo puede guardar/cambiar esa configuración.
- El secreto nunca se devuelve ni se muestra después de guardarlo.
- `media-token` usa el respaldo de Neon automáticamente.

## Nueva migración
`migrations/0010_media_settings.sql`

Crea la tabla `app_settings` para guardar la configuración privada de medios.

## Cómo terminar la configuración
Después del deployment:
1. Entra a **Control** con una cuenta moderadora.
2. Busca **Almacenamiento de archivos → media.ge01.com**.
3. URL: `https://media.ge01.com/_upload/upload.php`
4. Pega el mismo secreto de 64 caracteres que está en `/home1/angelto1/faculta_upload_config.php`.
5. Guarda.
6. Prueba una subida desde Libros/Bitácora/Cátedras/Servicios.
