# Actualizar a V7 en un entorno de pruebas

Esta es una entrega de código fuente. No se modificó tu despliegue actual. **No sustituyas producción sin respaldo y sin comprobar la compilación e integración.**

## 1. Respaldo y copia de pruebas

Respalda el código vigente, las variables privadas del hosting y PostgreSQL. Conserva los archivos del proveedor anterior. Crea una rama/copia de pruebas y usa una base de datos de pruebas o una copia autorizada y protegida de la actual. Una URL de vista previa no aísla la base: `DATABASE_URL` debe apuntar a la base correcta.

Las migraciones anteriores 0001–0017 son idénticas a las suministradas. La nueva `0018_faculta_drive_news_plan.sql` agrega tablas sin reemplazar las existentes. El ejecutor lleva registro en `_migrations`; revisa ese registro antes y después. No borres las migraciones antiguas ni cambies sus nombres.

## 2. Dependencias y variables

Usa Node.js 22 compatible con el proyecto. Instala las versiones del lockfile:

```bash
npm ci
```

Si falla, conserva el error completo para corregirlo; no cambies versiones ni ignores errores de pares a ciegas. En este entorno no pudo completarse por fallo DNS al registro npm, por lo que no se certifica una compilación integral.

Variables generales privadas del servidor:

```dotenv
DATABASE_URL=postgresql://USUARIO:CLAVE@HOST:5432/BASE_DE_PRUEBAS
BETTER_AUTH_URL=https://TU_DOMINIO_DE_PRUEBAS
APP_PUBLIC_URL=https://TU_DOMINIO_DE_PRUEBAS
BETTER_AUTH_SECRET=SECRETO_LARGO_ALEATORIO_PROPIO
```

Flag de construcción/ejecución (no contiene un secreto): `VITE_AUTH_ENABLED=true`.

Conserva `BETTER_AUTH_SECRET` en una actualización real para no invalidar sesiones innecesariamente. Configura aparte las variables `GOOGLE_DRIVE_*` según `CONFIGURAR-DRIVE.md`. Las variables de Google para iniciar sesión, si ya usabas ese proveedor, son independientes de las credenciales de almacenamiento.

`.env.example` es una referencia, no una autorización. Configura las variables en el panel del hosting. Un script Node no carga automáticamente `.env`: para el ejecutor de migraciones local puedes usar, con Node 22, `node --env-file=.env scripts/migrate.mjs` después de preparar tu archivo privado.

## 3. Comprobaciones

```bash
npm run test:v7
npm run check:syntax
npm run typecheck
npm run test
npm run build:code
npm run db:migrate
```

`test:v7` prueba la lógica nueva, no sustituye la compilación. La suite heredada `npm run test` contiene fallos de fixtures/plantilla ya presentes en la V6.24; consulta `PRUEBAS-V7.md` y no los confundas con una certificación completa del sitio.

`build:code` compila sin lanzar la migración desde el script de npm. El comando heredado `npm run build` hace **compilación y después migración**. Por ello, comprueba la `DATABASE_URL` de destino antes de construir en el hosting.

## 4. Alojamiento

La configuración suministrada usa Nitro con preset Vercel y TanStack Start; no es un sitio estático ni un programa PHP. En Vercel conserva la configuración compatible con este proyecto, usa `npm run build`, las variables correctas y un entorno de pruebas antes de promover a producción. La configuración de dominio y las credenciales del servicio no vienen en el ZIP.

Para otro servicio Node es necesario adaptar el preset/salida de Nitro y su comando de arranque; no se ha probado aquí ese despliegue. `npm run dev` no es un servidor de producción.

Los GET protegidos de archivos transmiten bytes desde Drive a través del servidor. Verifica los límites de streaming, tiempo de función y transferencia del proveedor para audios/videos largos. No se promete uso ilimitado ni se realizó una prueba de carga real.

## 5. Lista de aceptación

En el entorno de pruebas, comprueba inicio/cierre de sesión; acceso como visitante, alumno activo y moderador; horarios/cátedras/tareas anteriores; una carga y lectura real de cada formato usado; rechazo de archivos sin autorización; guardado/recarga del avance de dos usuarios; límite de optativas; borrador/publicación/ocultación de noticias; refresco y error de fuentes; comportamiento móvil y tema oscuro.

Sólo después del respaldo y de validar estos puntos aplica la migración y promueve el despliegue real. La migración no hace falta ejecutarla dos veces: su registro evita repetirla.

## Archivos antiguos

Los enlaces preexistentes se conservan. Los archivos no se han transferido de HostGator/otro proveedor a Drive, ni se han eliminado del origen. Una migración de archivos necesita inventario, acceso a los originales, copia, comprobación y sustitución de cada referencia: se debe realizar por separado. Tampoco cambia retroactivamente la privacidad de una URL antigua que ya era pública.
