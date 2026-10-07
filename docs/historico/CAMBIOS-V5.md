# Faculta de Derecho / Derecho UNAM – V5

## Cambios realizados

1. **Branding superior renovado**
   - Se eliminó el texto "Faculta de Derecho · Comunidad jurídica" del encabezado lateral.
   - Se colocó el **logo de la UNAM / Facultad de Derecho** en la parte superior con más presencia visual.

2. **Sección “Clases” renombrada a “Horarios”**
   - El menú ahora muestra **Horarios**.
   - La página de horarios fue enriquecida con:
     - resumen del bloque 07:00–14:00,
     - tarjetas con datos clave,
     - línea de tiempo de materias,
     - tabla completa basada en el horario proporcionado.

3. **Nueva sección “Bitácora”**
   - Se agregó una nueva ruta `/bitacora`.
   - Permite publicar entradas con:
     - título,
     - descripción,
     - lugar,
     - fecha,
     - **foto de la clase**.
   - Las imágenes se suben mediante **Vercel Blob**.

4. **Efectos visuales / más animación**
   - Fondo con movimiento sutil.
   - Hover más dinámico en menú y tarjetas.
   - Animaciones de entrada escalonadas.
   - Resaltado visual mejorado en bloques principales.

5. **Base de datos / backend**
   - Nueva migración `0005_bitacora.sql` para crear la tabla `class_posts`.
   - Nuevas funciones de carga y publicación para la bitácora.
   - Nuevo endpoint `/api/bitacora-upload` para subir fotos.

## Archivos principales modificados

- `src/components/shell.tsx`
- `src/routes/clases.tsx`
- `src/routes/bitacora.tsx`
- `src/routes/api/bitacora-upload.ts`
- `src/lib/content.ts`
- `src/lib/members.ts`
- `src/lib/types.ts`
- `src/lib/seed.ts`
- `src/lib/store.ts`
- `src/styles.css`
- `src/routes/__root.tsx`
- `src/routeTree.gen.ts`
- `migrations/0005_bitacora.sql`

## Importante

Para que la **Bitácora con fotos** funcione correctamente en producción, el proyecto en Vercel debe tener conectado **Vercel Blob**.
