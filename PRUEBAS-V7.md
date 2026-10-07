# Informe de pruebas · Faculta de Derecho V7.0.0

Preparación: 6 de octubre de 2026, hora de México. Los logs se generaron el 7 de octubre UTC. Base de comparación: ZIP V6.24 proporcionado. Entorno: Node.js 22.16.0, TypeScript local y Chromium sin conexión a las cuentas del usuario.

## Resultado y alcance

| Comprobación | Resultado real | Qué no demuestra |
|---|---|---|
| Pruebas nuevas `test:v7` | 32 aprobadas; 0 fallidas | No prueban OAuth/Drive ni PostgreSQL reales. |
| Sintaxis TS/TSX | 97 archivos; 0 errores | No es el typecheck completo ni Vite. |
| Tipos estrictos de 8 módulos puros | Sin errores | Excluye React, servidor y dependencias no instaladas. |
| Vista previa independiente en Chromium | Inicio, Noticias, Plan y Optativas a 1440 y 390 px, sin desbordamiento horizontal ni errores de página | Es una vista de diseño, no una ejecución de la aplicación completa. |
| Interacciones de la vista previa | Menú móvil y tema oscuro comprobados | No inicia sesión, guarda datos, sube archivos ni consulta feeds. |
| Importaciones locales | Ninguna referencia local sin archivo de destino | No verifica las APIs de los paquetes externos. |
| Migraciones 0001–0017 | Las 17 son idénticas byte a byte a V6.24 | La migración nueva todavía debe ejecutarse en una base de pruebas. |
| Suite heredada de scripts | 195 pruebas: 177 aprobadas, 18 fallidas; mismos nombres de fallo que V6.24 | El conjunto global no está totalmente aprobado. |
| Instalación de dependencias | No completada: `EAI_AGAIN registry.npmjs.org` | No se certifican `npm run typecheck` ni una compilación completa. |

Los resultados no son una certificación de seguridad, compatibilidad total ni aptitud para producción. Los mocks de la subida prueban el comportamiento del cliente ante respuestas simuladas; no son una transferencia real de archivos.

## Pruebas nuevas

Se comprueban los totales y distribución del plan, identificadores únicos, seriación referida a materias existentes, avance, máximo de seis optativas por semestre y 450 créditos. Las claves que no quedaron verificadas se mantienen pendientes, no se convierten en claves oficiales por su identificador interno.

Se prueban el ID de carpeta, formatos y tamaños de archivo, subcarpetas y la forma válida de una URL de sesión reanudable. Las pruebas de cliente simulan la reserva, envío de bloques, recuperación de una respuesta de estado y comprobación final. El 100 % sólo se muestra después de la confirmación.

Se prueban RSS/Atom, extracción limitada de HTML, rechazo de entidades/DTD, URLs de fuentes permitidas, campos vacíos, deduplicación, recorte de extractos y fuentes que requieren JavaScript. No se asocian imágenes de HTML a eventos por mera cercanía.

## Comandos reproducibles

Con dependencias instaladas:

```bash
npm run test:v7
npm run check:syntax
npm run typecheck
npm run test
npm run build:code
```

La comprobación limitada de tipos ejecutada en esta entrega fue:

```bash
npx tsc --noEmit --allowImportingTsExtensions --strict --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM src/lib/drive/validation.ts src/lib/media-upload.ts src/lib/news/types.ts src/lib/news/sources.ts src/lib/news/parser.ts src/lib/news/snapshot.ts src/lib/study/plan.ts src/lib/study/progress.ts
```

Se ejecutó con el compilador local disponible, sin descargar otro. `check:syntax` encontró ese compilador mediante `NODE_PATH`; en una instalación normal utiliza el TypeScript del proyecto. Un log vacío de esta comprobación de tipos significa que terminó con código cero, no que se ejecutó el typecheck del proyecto entero.

Para comparar la suite heredada se ejecutó en cada árbol:

```bash
node --test 'scripts/**/*.test.mjs'
```

Se actualizó el resultado esperado de la prueba del manifiesto para que use el nombre solicitado. Los otros 18 fallos coinciden con la base. Los tests de autenticación que el script global encadena con `&&` no se ejecutaron después de esos fallos. Los nombres y detalles completos están en los logs.

## Fallos heredados que permanecen

Los fallos incluyen referencias a archivos de plantilla/fixtures ausentes en el ZIP original y expectativas de la plataforma original. No se han ocultado ni convertido en aprobados:

- `SKILL.md and AGENTS.md name the marker path and bound this script uses`
- `the sections that own the brand-task prohibition never affirm a wait`
- `SKILL.md tells the pass to self-check with the flag this CLI accepts`
- `the build side resolves the template's shipped app-env`
- `platform chrome overwrites share-card metas and always sets og:title`
- `published grok.me slug is still a title fallback`
- `emits og:image for a public host and prefers a custom card`
- `placeholder og:image appends site.color when it is 6-digit hex`
- `document title entities are not double-escaped on og:title`
- `injects into documents with no head element`
- `streaming injector matches </HEAD> case-insensitively`
- `uses the app name in the injected title tag`
- `nitro middleware and its bundled assets exist`
- `the auth schema ships outside the globbed directory`
- `the template ships auth off`
- `the wrapped command runs with the app env applied`
- `the CLI still runs when invoked through a symlinked path`
- `every hand-over the og skill prints is one this script accepts`

## Pendiente antes de producción

Instalar las dependencias y resolver los errores que pudieran aparecer; ejecutar la comprobación completa de tipos y Vite; probar la migración 0018 en una copia protegida de la base; validar sesión, roles y permisos con cuentas reales de prueba; autorizar Drive para la aplicación web y probar carga/lectura/rechazos; comprobar streaming con archivos largos y límites del hosting; contrastar la lectura de cada fuente desde ese servidor.

No hay un destino de Drive seleccionado por el usuario en esta entrega. La conexión de Drive disponible en el chat sólo se inspeccionó; no autoriza por sí misma al portal ni se modificaron las carpetas de esa conexión. Tampoco se han migrado los archivos antiguos, desplegado el sitio ni tocado PostgreSQL de producción.

## Evidencias incluidas

Los archivos `docs/v7/pruebas/` contienen la salida de las comprobaciones y los hashes de las migraciones originales. `docs/v7/vista-previa.html` y las imágenes en esa carpeta son materiales para revisar diseño. El ZIP no incluye `node_modules`, fuentes tipográficas, `.env` con credenciales ni tokens.
