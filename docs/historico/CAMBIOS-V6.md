# Faculta de Derecho Derecho UNAM – V6

## 1. Nueva sección: Servicios

Se agregó `/servicios` como marketplace interno del grupo 9114.

Cada integrante activo puede publicar:
- Desayunos
- Comidas
- Sándwiches
- Postres
- Bebidas
- Otros servicios

Cada publicación incluye:
- nombre del producto/servicio,
- categoría,
- descripción,
- precio,
- días disponibles,
- lugar de entrega,
- hora límite para pedir,
- forma de solicitarlo,
- foto opcional.

Las fotos usan Vercel Blob, igual que Bitácora/Biblioteca.

## 2. Cátedras como expediente vivo por materia

La sección Cátedras conserva las siete materias y sus docentes, pero ahora cada materia puede acumular contenido por fecha de clase.

Se pueden publicar:
- Apuntes
- Tareas
- Fotos
- Materiales
- Avisos

Cada entrada guarda:
- materia,
- fecha en que se realizó la clase,
- tipo de contenido,
- título,
- descripción/apuntes,
- archivo o foto opcional,
- liga externa opcional,
- autor de la publicación.

Archivos permitidos: PDF, DOCX, JPG, PNG y WEBP, hasta 40 MB.

## 3. Más animación y efectos

- tarjetas con elevación y brillo al pasar el cursor,
- imágenes con zoom suave,
- entradas escalonadas,
- fondos animados sutiles,
- microinteracciones en navegación y botones,
- animaciones respetan `prefers-reduced-motion`.

## 4. Base de datos

Nueva migración:
`migrations/0006_services_catedras.sql`

Crea:
- `class_materials`
- `service_offers`

## 5. Archivos principales nuevos

- `src/routes/servicios.tsx`
- `src/routes/api/catedra-upload.ts`
- `src/routes/api/services-upload.ts`
- `migrations/0006_services_catedras.sql`

## 6. Archivos principales modificados

- `src/routes/catedras.tsx`
- `src/routes/index.tsx`
- `src/components/shell.tsx`
- `src/lib/content.ts`
- `src/lib/members.ts`
- `src/lib/types.ts`
- `src/lib/seed.ts`
- `src/styles.css`
- `src/routes/__root.tsx`
- `src/routeTree.gen.ts`

## Nota de despliegue

No requiere nuevas variables de entorno. Para subir fotos/archivos, Vercel Blob debe seguir conectado al proyecto.
