# Faculta de Derecho V4 — Clases y biblioteca académica

## Clases del grupo 9114

Se actualizaron las siete materias con los datos proporcionados:

| Clave | Materia | Docente | Horario | Salón |
| --- | --- | --- | --- | --- |
| 1122 | Derecho romano I | Mtra. Roxana Trigueros Olivares | 07:00–08:00 | D-106 |
| 1121 | Acto jurídico y derecho de las personas | Lic. Arturo Belmont Martínez | 08:00–09:00 | D-106 |
| 1123 | Historia del derecho mexicano | Lic. Dionisio Eduardo Barco Martínez | 09:00–10:00 | D-106 |
| 1127 | Teoría general del Estado | Dr. Marcial Manuel Cruz Vázquez | 10:00–11:00 | D-106 |
| 1126 | Sociología jurídica | Mtra. María Fernanda González Nahle | 11:00–12:00 | D-106 |
| 1124 | Introducción a la teoría del derecho | Mtra. Lizzet Urbina Anguas | 12:00–13:00 | D-106 |
| 1125 | Ser universitario y cultura de la legalidad | Lic. Apolinar Medardo Ramírez Figueroa | 13:00–14:00 | E-003 |

La página **Clases** ahora muestra explícitamente al docente en cada bloque. **Cátedras** se convirtió en un directorio académico basado en los datos reales de materia, docente, horario y salón, evitando mostrar cubículos u horarios de atención que no fueron proporcionados.

## Biblioteca V4

La sección de libros ahora permite:

- Crear fichas bibliográficas por materia.
- Registrar editorial, año, edición e ISBN.
- Copiar una referencia bibliográfica generada automáticamente.
- Filtrar por Bibliografía, Descarga, Préstamo, Venta o Recomendación.
- Buscar por título, autor, materia, editorial o ISBN.
- Adjuntar archivos PDF o EPUB de hasta 100 MB.
- Mostrar progreso de carga.
- Agregar una liga externa de consulta o descarga.
- Agregar una liga para compra o venta.
- Registrar precio o leyenda como "A convenir".
- Mostrar botones de Descargar, Consultar y Comprar/Ver venta en las tarjetas.

## Migración de base de datos

Se agregó:

`migrations/0004_classes_library.sql`

La migración actualiza los docentes del grupo 9114 y añade a `books`:

- `publisher`
- `publication_year`
- `edition`
- `isbn`
- `file_url`
- `file_name`
- `external_url`
- `commerce_url`
- `price_text`

Se ejecuta automáticamente con `npm run build` en Vercel.

## Para activar "Subir libro" en Vercel

Faculta de Derecho V4 utiliza Vercel Blob con cargas presignadas. Se agregó la dependencia `@vercel/blob`.

1. Abre el proyecto `derechounam` en Vercel.
2. Ve a **Storage** y crea/conecta un **Blob store** al proyecto.
3. Para esta versión usa almacenamiento **Public**, porque las tarjetas enlazan directamente al archivo descargable.
4. Mantén habilitada la conexión/OIDC del proyecto.
5. Haz un nuevo deployment.

La ruta que autoriza las cargas es:

`/api/library-upload`

Sólo una cuenta con sesión iniciada y estado `activo` en el padrón puede obtener autorización para subir archivos.

> Importante: el formulario recuerda que sólo deben compartirse archivos que se tengan derecho a distribuir. También se puede crear una ficha sin subir archivo y usar únicamente enlaces externos legales.
