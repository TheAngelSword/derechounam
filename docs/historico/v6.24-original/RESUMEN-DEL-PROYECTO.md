# Atrio — Resumen del proyecto

**Sitio:** [derechounam.com](https://derechounam.com)  
**Producto:** mural interno del grupo 9114, primer semestre  
**Fecha de este paquete:** 5 de septiembre de 2026

## Qué es

Atrio es el patio digital de la generación: un sitio web donde el grupo publica y controla lo que ocurre alrededor de la jornada diaria. No es un directorio público de la facultad. Es un mural de aula, con cuentas, roles y bitácora de accesos.

Quien entra ve el horario, las cátedras, los talleres, los libros, las rutas y los avisos. Quien se registra puede ir subiendo contenido. Quien modera puede quitar lo que ya no corre y suspender fichas.

## Jornada que ya está cargada (grupo 9114)

| Hora | Clave | Asignatura | Salón |
|---|---|---|---|
| 07:00–08:00 | 1122 | Derecho romano I | D-106 |
| 08:00–09:00 | 1121 | Acto jurídico y derecho de las personas | D-106 |
| 09:00–10:00 | 1123 | Historia del derecho mexicano | D-106 |
| 10:00–11:00 | 1127 | Teoría general del Estado | D-106 |
| 11:00–12:00 | 1126 | Sociología jurídica | D-106 |
| 12:00–13:00 | 1124 | Introducción a la teoría del derecho | D-106 |
| 13:00–14:00 | 1125 | Ser universitario y cultura de la legalidad | E-003 |

Seis horas en D-106. A las 13:00 el grupo cruza al edificio E.

## Mapa del sitio

| Ruta | Para qué sirve |
|---|---|
| Inicio | Jornada 07–14, avisos fijos y talleres de la quincena |
| Clases | Bloque diario con clave, salón y hora |
| Cátedras | Cubículos y horas de atención después de las 14:00 |
| Agenda | Talleres, conferencias y actividades |
| Libros | Préstamo, venta y recomendaciones por materia |
| Rutas | Ida 06:35 a D-106 y vuelta 14:10 desde E-003 |
| Mesas | Grupos de estudio por asignatura |
| Mural | Recados del día y cambios de salón |
| Registro | Padrón de alumnos, profesores y moderadores |
| Control | Subir clases o cátedras y quitar contenido |
| Entrar | Google, X o correo |

## Contenido de partida

Además del horario hay:

- Siete fichas de cátedra (Romano, Personas, Historia, TGE, Sociología, Teoría, Ser universitario)
- Seis actividades de septiembre (lectura de Gayo, mapa del acto jurídico, línea del tiempo, cineforo, seminario de Estado, observación de campo)
- Siete títulos de estantería (de Justiniano a García Máynez)
- Cinco rutas del grupo
- Cinco mesas de estudio
- Cuatro avisos fijos (jornada, cruce a E-003, lista de asistencia, fotocopias)

Todo eso se puede ampliar o quitar desde el sitio.

## Control de accesos

Hay tres figuras:

- **Alumno.** Lee todo. Publica en agenda, libros, rutas, mesas y mural si su ficha está activa.
- **Profesor.** Lo mismo, y además puede subir clases y cátedras.
- **Moderador.** Activa o suspende fichas, asigna un responsable por área y quita contenido.

La primera cuenta que se da de alta en el padrón queda como moderador, para poder abrir el resto.

Cada área puede tener un moderador propio: Clases, Cátedras, Agenda, Libros, Rutas, Mesas, Mural.

El registro guarda una bitácora: quién entró a cada zona y quién publicó.

## Cómo está hecho el software

- Aplicación web en React 19 con TanStack Start y Vite
- Estilos con Tailwind
- Cuentas con Better Auth: Google, X y correo con clave
- Base de datos PostgreSQL (en local de prueba usa un motor embebido)
- El mural, el padrón y la bitácora quedan guardados; no se pierden al recargar

### Tablas

- `members`, `area_mods`, `access_log`
- `courses`, `professors`, `events`, `books`, `rides`, `study_groups`, `notices`
- Tablas de sesión de Better Auth (`user`, `session`, `account`, `verification`)

### Archivos principales

- `src/routes/` — cada página del sitio
- `src/lib/content.ts` — alta y baja del mural
- `src/lib/members.ts` — padrón, roles y bitácora
- `src/lib/seed.ts` — copia de arranque del grupo 9114
- `migrations/` — esquema y datos iniciales
- `docs/` — este resumen, la guía de uso y el instructivo de despliegue

## Lo que no es

- No pide teléfono ni datos personales en los formularios públicos. Se publica con alias de mesa o casillero.
- No sustituye el sistema oficial de inscripciones de la facultad.
- No es un sitio estático de HTML suelto: necesita Node.js 22 y PostgreSQL. El detalle está en `docs/DESPLIEGUE.md`.

## Empaque de este ZIP

El archivo `atrio-derechounam.zip` trae el código listo para instalar, las migraciones, la carpeta `public/` y los tres documentos de `docs/`. No incluye `node_modules` (se instalan con `npm install`) ni capturas de prueba.
