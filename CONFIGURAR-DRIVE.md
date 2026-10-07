# Conectar Google Drive al portal

## Qué está listo y qué falta

El código de carga ya utiliza Google Drive exclusivamente. Falta autorizar la cuenta que será propietaria del almacenamiento del sitio y establecer la carpeta raíz. **Instalar Google Drive en ChatGPT no autoriza automáticamente una aplicación alojada en tu dominio ni proporciona al proyecto un token reutilizable.** No se ha elegido ni modificado ninguna de tus carpetas desde esta conversación.

Google documenta la autorización por aplicación en https://developers.google.com/identity/protocols/oauth2/web-server y las cargas en https://developers.google.com/workspace/drive/api/guides/manage-uploads .

No envíes tokens, archivos JSON de credenciales o secretos al chat. Configúralos sólo en tu equipo y en las variables privadas del servidor.

## Opción A · Cuenta personal y carpeta nueva dedicada (menor alcance)

1. En Google Cloud crea o elige un proyecto y habilita Google Drive API. Configura la pantalla de consentimiento OAuth. Crea un cliente OAuth de tipo **Aplicación de escritorio** y descarga su JSON a tu equipo, fuera del repositorio. Para un cliente web, registra exactamente la dirección local de retorno que utiliza el asistente: `http://127.0.0.1:8765/oauth2/callback`.
2. Abre una terminal en la carpeta del proyecto y ejecuta con Node.js 22:

```bash
node scripts/authorize-drive.mjs --credentials="C:/ruta/privada/client_secret.json"
```

En macOS/Linux utiliza la ruta equivalente. El asistente sólo escucha en `127.0.0.1:8765`, genera estado y verificador PKCE y muestra una dirección que debes abrir en el navegador **del mismo equipo**. Comprueba qué cuenta autorizas.

3. Autoriza el acceso. El asistente solicita el alcance `drive.file`, crea una carpeta nueva llamada **Faculta de Derecho** y guarda estas variables en `.env.drive.local`:

```dotenv
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...
```

Ese archivo está excluido de Git; guárdalo de manera privada. El script no muestra los tokens en el navegador ni los copia a la conversación. No se sobrescribe una autorización existente sin `--overwrite`.

4. Copia las cuatro variables al entorno **privado** del servicio que aloja la aplicación. No uses prefijos `VITE_` para secretos. En un panel de variables, pega el valor sin las comillas envolventes que se emplean en el archivo. Configura también `APP_PUBLIC_URL`, por ejemplo `https://derechounam.com`. Despliega y abre **Control → Google Drive → Probar conexión**. El comprobador revisa que la carpeta exista y sea editable, sin subir ni borrar un archivo de prueba.

La configuración OAuth externa en estado de prueba puede tener restricciones y caducidad de autorizaciones. Revisa la política actual de Google y el estado del consentimiento antes de usarla permanentemente con el grupo.

## Opción B · Una carpeta que ya existe

Una liga no concede permisos. La cuenta autorizada debe poder editar esa carpeta, y el alcance OAuth debe permitir al cliente acceder a ella.

El asistente permite una carpeta existente con permiso amplio **sólo mediante aceptación explícita**:

```bash
node scripts/authorize-drive.mjs --credentials="C:/ruta/privada/client_secret.json" --folder=ID_DE_CARPETA --allow-full-drive
```

Esta opción solicita el alcance `drive`, que es más amplio que `drive.file`; se aconseja una cuenta dedicada al portal. No se ha implementado Google Picker para seleccionar una carpeta existente con autorización limitada por archivo. La opción A evita otorgar acceso amplio a una cuenta con documentos personales.

Después de autorizar, en Control puedes pegar la liga o el ID de una carpeta a la que ese cliente ya tenga acceso. **Guardar y comprobar carpeta** verifica permisos antes de guardar. Cambiar el destino afecta a nuevas cargas; no traslada las anteriores.

## Opción C · Cuenta de servicio y unidad compartida de Workspace

Configura `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` como variable privada y `GOOGLE_DRIVE_FOLDER_ID`. La cuenta de servicio debe tener permisos sobre una carpeta de una **unidad compartida**, no simplemente sobre una carpeta personal que aparece en “Compartido conmigo”. El proyecto rechaza una cuenta de servicio para una carpeta de Mi unidad.

Las cuentas de servicio no tienen cuota de almacenamiento propia ni pueden ser propietarias de archivos de Mi unidad; Google indica utilizar unidades compartidas o actuar en nombre de un usuario mediante OAuth: https://developers.google.com/workspace/drive/api/guides/handle-errors#storageQuotaExceeded .

No configures simultáneamente OAuth y cuenta de servicio salvo que entiendas que el código prioriza OAuth si están presentes sus tres variables.

## Organización y permisos

Las subcarpetas se crean al realizar una carga, no al probar la conexión:

```text
Carpeta raíz elegida/
  biblioteca/
  catedras/CLAVE/AÑO/MES/
  bitacora/AÑO/MES/
  servicios/AÑO/MES/
  noticias/imagenes/
  noticias/videos/
```

Las cargas exigen sesión y registro activo; noticias exige además moderación. El servidor guarda tamaño, tipo, usuario e identificador, limita a 100 intentos o 5 GiB por usuario y día y verifica la sesión al terminar. El protocolo reintenta bloques durante la misma carga; **no implementa reanudación persistente después de cerrar el navegador**.

Límites por archivo: biblioteca 100 MiB; bitácora 20 MiB; cátedras 512 MiB; servicios 15 MiB; noticias 256 MiB. También aplican cuota, políticas y permisos de Google.

Los archivos no se vuelven públicos mediante permisos de Drive. La cuenta del servidor los lee y el portal controla su entrega. Antes de elegir la carpeta revisa sus permisos heredados: usar una carpeta ya pública puede hacer públicos los archivos fuera del portal. Una noticia publicada permite mostrar sus adjuntos en Inicio sin sesión; un borrador no.

Los permisos actuales de otros integrantes de una carpeta siguen existiendo. No se eliminan automáticamente. Los archivos borrados desde Google dejarán de estar disponibles aunque la publicación continúe en la base de datos.

## Comprobación real después del despliegue

Inicia sesión con un moderador activo, prueba la conexión y sube un archivo pequeño en una sección. Confirma que aparece en la carpeta correcta, que se abre en el portal y que un visitante no autenticado no puede abrir su URL protegida. Publica después una noticia de prueba con un adjunto autorizado y comprueba su visibilidad; vuelve a ocultarla. Prueba también un audio/video, una interrupción de conexión y un tamaño excedido.

Los archivos grandes se suben del navegador a Google, pero su consulta protegida pasa por el servidor del portal. Verifica tiempo de ejecución, streaming y transferencia del hosting. Google Drive no debe tratarse como una CDN pública sin límites. Esta entrega no incluye una prueba de carga real con tu cuenta.
