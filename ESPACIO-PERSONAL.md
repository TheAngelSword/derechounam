# Espacio personal en pnota.com

El portal del grupo sigue en `https://derechounam.com`. En el repositorio y en la documentación anterior ese es el dominio público. **pnota.com no aparecía en el código:** es un dominio del titular y, a partir de esta versión, el sitio privado.

pnota.com muestra solo la agenda personal. No hay enlace en el menú del portal. Las tareas del grupo y las de este espacio son tablas distintas.

## Quién puede entrar

La sesión es de Better Auth en el servidor. Una URL escondida o una comprobación en el navegador no bastan.

- El titular es el correo listado en `PERSONAL_OWNER_EMAILS` (el mismo de su cuenta en el portal, si ambos proyectos usan la misma `DATABASE_URL`).
- Otra cuenta que inicie sesión ve «Esta entrada no está disponible» y las funciones del servidor responden no autorizado.
- Sin esa variable, nadie entra, tampoco un moderador.
- En pnota.com el alta y el botón de Google están ocultos. Hay que entrar con el correo y la clave que ya existen. Alguien puede intentar un alta directa contra Better Auth; eso crea una cuenta del portal, no le da esta agenda.
- Las visitas de pnota.com no se escriben en la bitácora del grupo.
- El calendario `.ics`, los datos y el webhook no se sirven en derechounam.com. Un token o una sesión del portal, usados en el host público, reciben «No encontrado.»

La cookie de sesión se llama `__Host-faculta-auth.session_token`. El prefijo `__Host-` obliga a que sea `Secure`, `Path=/` y **sin atributo `Domain`**. No existe `AUTH_COOKIE_DOMAIN` y no hay que inventarlo: una cookie compartida entre pnota.com y derechounam.com mezclaría las sesiones. Hay que iniciar sesión otra vez en pnota.com, aunque el correo y la clave sean los mismos. `www.pnota.com` es otro host: conviene redirigirlo al apex en el proyecto de Vercel.

## Cómo publicarlo

Hay dos formas. La recomendada es un proyecto de Vercel aparte: el inicio de sesión de derechounam.com no cambia de configuración. La otra sirve los dos dominios con el mismo despliegue.

No agregues pnota.com al proyecto del portal antes de definir las variables. Sin ellas, ese dominio mostraría el portal del grupo.

### A. Proyecto aparte (recomendado)

El proyecto de Vercel de este espacio se llama `pnota`.

1. Conecta ese proyecto a este repositorio y a la rama de producción que ya usas.
2. Dominio de producción: `pnota.com`. Añade también `www.pnota.com` y redirígelo a `https://pnota.com`.
3. Variables de Production (y un redespliegue después de guardarlas; las que empiezan por `VITE_` se hornean en el build):

| Variable | Valor |
|---|---|
| `SITE_MODE` | `personal` |
| `BETTER_AUTH_URL` | `https://pnota.com` |
| `APP_PUBLIC_URL` | `https://pnota.com` |
| `PERSONAL_PUBLIC_URL` | `https://pnota.com` |
| `PORTAL_PUBLIC_URL` | `https://derechounam.com` |
| `VITE_PUBLIC_HOSTNAME` | `pnota.com` |
| `VITE_SITE_MODE` | `personal` |
| `VITE_PERSONAL_HOSTNAME` | `pnota.com` |
| `VITE_PORTAL_PUBLIC_URL` | `https://derechounam.com` |
| `VITE_AUTH_ENABLED` | `true` |
| `DATABASE_URL` | La misma Neon de producción del portal, para reutilizar la cuenta |
| `BETTER_AUTH_SECRET` | Un secreto propio de 32 caracteres o más. Puede ser distinto del portal |
| `PERSONAL_OWNER_EMAILS` | El correo real del titular, en minúsculas |
| `PERSONAL_ICS_TOKEN` | Aleatorio, 24 caracteres o más |
| `CRON_SECRET` | Aleatorio, 16 caracteres o más |

`SITE_MODE=personal` trata cualquier host de ese proyecto (incluido el `*.vercel.app`) como espacio personal. No pongas `SITE_MODE` en el proyecto de derechounam.com.

El primer despliegue aplica la migración `0021_personal_space.sql`. Es aditiva. El otro proyecto, al construir, ve la migración ya registrada y no la repite.

### B. El mismo proyecto, dos dominios

Sirve si quieres un solo despliegue. `BETTER_AUTH_URL` y `APP_PUBLIC_URL` se quedan en `https://derechounam.com`. Cuando `PERSONAL_PUBLIC_URL` es otro origen, Better Auth deja de usar una sola `baseURL` y acepta los dos hosts. Cada uno conserva su propia cookie.

Añade en el proyecto que ya publica derechounam.com:

| Variable | Valor |
|---|---|
| `PERSONAL_PUBLIC_URL` | `https://pnota.com` |
| `PORTAL_PUBLIC_URL` | `https://derechounam.com` |
| `VITE_PERSONAL_HOSTNAME` | `pnota.com` |
| `VITE_PORTAL_PUBLIC_URL` | `https://derechounam.com` |
| `PERSONAL_OWNER_EMAILS` | Correo del titular |
| `PERSONAL_ICS_TOKEN` | Aleatorio, 24+ |
| `CRON_SECRET` | Aleatorio, 16+ |

No definas `SITE_MODE`. `VITE_PUBLIC_HOSTNAME` sigue siendo `derechounam.com`. Vuelve a desplegar después de cambiar variables `VITE_`.

En esta modalidad el cron de `vercel.json` también corre en el portal. La deduplicación evita un doble WhatsApp si más adelante los dos proyectos disparan el mismo aviso.

## DNS

El DNS de pnota.com está en HostGator, no en los nameservers de Vercel. Los registros del proyecto `pnota` son estos:

| Nombre | Tipo | Valor |
|---|---|---|
| `@` | A | `216.198.79.1` |
| `@` | A | `64.29.17.1` |
| `www` | CNAME | `be64b7e961a748b0.vercel-dns-017.com` |

Entran en el panel de DNS de HostGator. No uses `vercel dns add`: ese comando solo escribe en DNS que ya administra Vercel. El apex lleva los dos A; no lo sustituyas por un CNAME. `www` apunta al CNAME de arriba, y en el proyecto `pnota` conviene redirigirlo a `https://pnota.com`.

Comprueba con `vercel domains verify pnota.com --project pnota` o con el estado «Valid Configuration» del panel. El certificado HTTPS lo emite Vercel al verificar el DNS; suele tardar unos minutos.

derechounam.com no se toca.

## Calendario

Con la sesión del titular, la página muestra:

`https://pnota.com/api/personal/calendario.ics?token=…`

- Google Calendar: Otros calendarios → Desde URL → pegar el enlace. Google lo consulta periódicamente; no es instantáneo.
- Apple Calendar: Archivo → Nueva suscripción a calendario, o en iOS Ajustes → Calendario → Cuentas → Añadir cuenta → Otro → Añadir calendario suscrito.
- Outlook: Agregar calendario → Suscribirse desde la web.

El archivo lleva zona `America/Mexico_City`, omite lo archivado y lo que no tiene fecha, y avisa dentro del calendario con los mismos anticipos. Cada entrada con fecha tiene además un enlace «Google Calendar» para crear un evento suelto.

El token viaja en la query. Puede quedar en registros del hosting. Si se filtra, cambia `PERSONAL_ICS_TOKEN`, redespliega y vuelve a suscribir. No hay sincronización con la API de Google Calendar: el OAuth actual no pide ese permiso y los tokens de Drive son de archivos. La suscripción `.ics` y el enlace por evento cubren Google, Apple y Outlook sin otra cuenta.

Esa URL solo responde en el host personal. Token corto, ausente o incorrecto: `404` y el texto «No encontrado.»

## WhatsApp

Elige un proveedor con `WHATSAPP_PROVIDER`. Si la variable falta o no es `meta`, `twilio` o `callmebot`, no se envía nada y no se adivina el servicio. El número destino es `WHATSAPP_TO`, en dígitos E.164. En México suele empezar por `521`.

Los secretos van solo en el panel de Vercel. `.env.example` trae los nombres vacíos.

Anticipos que se pueden marcar en cada entrada: 1 semana, 2 días, 1 día, 3 horas, 1 hora y 15 minutos. Por defecto, 1 día y 1 hora. Un aviso de 15 minutos solo sale si algo llama al despacho dentro de esos 15 minutos (cron frecuente o el botón «Enviar pendientes ahora»). Un aviso de un día todavía puede salir en la pasada de la mañana siguiente, siempre que el evento no haya empezado. Nada se envía después de la hora del evento. La misma combinación entrada + anticipo + hora no se manda dos veces; un fallo se reintenta a los 10 minutos.

Al abrir la agenda también se despachan los pendientes. «Enviar mensaje de prueba» manda un texto al número configurado. «Enviar pendientes ahora» recorre la cola.

### Meta, WhatsApp Cloud API

1. En [developers.facebook.com](https://developers.facebook.com) crea una app de tipo Business y añade el producto WhatsApp.
2. En la API, anota el identificador del número (`WHATSAPP_CLOUD_PHONE_ID`) y genera un token de usuario del sistema con `whatsapp_business_messaging`. Pégalo en `WHATSAPP_CLOUD_TOKEN`. Los tokens temporales del panel caducan.
3. `WHATSAPP_TO` es el celular que recibirá los avisos, con código de país.
4. `WHATSAPP_CLOUD_MODE=text` es el modo por defecto. Fuera de la ventana de 24 horas desde el último mensaje de ese número, Meta rechaza el texto libre. Para avisos que salen sin que hayas escrito antes, crea una plantilla aprobada con **una** variable de cuerpo y define `WHATSAPP_CLOUD_MODE=template`, `WHATSAPP_CLOUD_TEMPLATE_NAME` y `WHATSAPP_CLOUD_TEMPLATE_LANG=es_MX`.
5. Webhook de entrada, opcional: URL `https://pnota.com/api/personal/whatsapp`. Token de verificación en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Secreto de la app en `WHATSAPP_APP_SECRET` (firma `X-Hub-Signature-256`). Suscribe el campo `messages`.

La versión de la API es `v21.0`. `WHATSAPP_CLOUD_VERSION` la cambia si Meta lo pide.

### Twilio

1. Cuenta en Twilio con el canal WhatsApp (sandbox o un número aprobado).
2. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_WHATSAPP_FROM=whatsapp:+1…` (el número de Twilio).
3. `WHATSAPP_TO` es tu celular, con o sin el prefijo `whatsapp:`.
4. En el sandbox hay que unirse con el código que muestra Twilio antes de que lleguen mensajes.
5. Para mensajes de entrada, el webhook de Twilio es `https://pnota.com/api/personal/whatsapp` (POST). La firma se calcula con `PERSONAL_PUBLIC_URL` cuando el host es pnota.com. La respuesta es TwiML vacío: el texto de vuelta lo manda el mismo canal de salida, para no duplicarlo.

### CallMeBot

Opción personal y gratuita, sin mensajes de entrada.

1. Sigue la activación en [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/) hasta que el número quede autorizado.
2. `WHATSAPP_PROVIDER=callmebot`, `CALLMEBOT_PHONE` con el mismo celular y `CALLMEBOT_APIKEY` con la clave que te dan.
3. La clave viaja en la query hacia CallMeBot. No la pongas en el repositorio ni en capturas. El programa la recorta si un error de red la trajera de vuelta.

### Escribirle al número

Solo se aceptan mensajes cuyo teléfono coincide con `WHATSAPP_TO` o `CALLMEBOT_PHONE`. Comandos, sin distinguir acentos:

- `ayuda`
- `hoy`
- `semana` o `qué hay esta semana`
- `tarea Leer amparo mañana`
- `examen Civil el viernes 10:00`
- `clase Procesal hoy 19:00`
- `repaso Actos jurídicos en 2 días`
- `lectura El Federalista`

También valen `audiolibro`, `junta`, `diplomado`, `actividad` y `compromiso`, más `pasado mañana`, `en 3 días`, `12/11` y `12 de noviembre`. La hora es la de Ciudad de México. Lo anotado queda a nombre del correo de `WHATSAPP_OWNER_EMAIL` si existe, y si no, del primer correo de `PERSONAL_OWNER_EMAILS`.

## Cron

`vercel.json` programa `GET /api/personal/recordatorios` a las **13:00 UTC** (`0 13 * * *`), las 07:00 en Ciudad de México. Vercel solo acepta cinco campos: minuto, hora, día, mes y día de la semana. Una expresión de seis campos, como `0 13 * * * *`, falla el despliegue con «Expected 5 values, but got 6». En plan Hobby también rechaza el despliegue si la expresión corre más de una vez al día (texto del error: «Hobby accounts are limited to daily cron jobs») y puede retrasar esa pasada hasta 59 minutos. Por eso el repositorio no trae `*/15`: un `*/15` tumbaría el deploy de derechounam.com si ese proyecto está en Hobby.

La ruta exige `Authorization: Bearer <CRON_SECRET>`. Vercel lo añade solo cuando esa variable existe en el proyecto. Secreto ausente o distinto: `404`, no `401`.

Para que un aviso de 15 minutos o de una hora salga a tiempo hace falta una pasada frecuente:

- Plan Pro (o superior): en `vercel.json` cambia el schedule a `*/15 * * * *` (cinco campos, sin segundos) y redespliega. Solo hazlo si **todos** los proyectos que despliegan este repo están en un plan que acepte ese intervalo.
- Plan Hobby: deja el cron diario y añade un programador externo (el que ya uses) cada 15 minutos:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://pnota.com/api/personal/recordatorios
```

El cron diario sí alcanza los avisos de un día, dos días y una semana cuya hora de envío cayó después de la pasada anterior, mientras el evento siga en el futuro. Abrir pnota.com también dispara los que ya están en hora.

Si el proyecto aparte y el del portal tienen los dos `CRON_SECRET` y despliegan este archivo, los dos pueden llamar. La clave única de cada aviso evita el duplicado. Basta con definir `CRON_SECRET` en el proyecto de pnota.com.

## Probar en local

Para ver la agenda sin base ni cuentas:

```bash
SITE_MODE=personal PERSONAL_OWNER_EMAILS=dev-user VITE_AUTH_ENABLED=false npm run dev
```

No definas `DATABASE_URL` en esa prueba. `dev-user` solo es titular fuera de producción. En cuanto pongas `NODE_ENV=production` o `VERCEL_ENV=production`, esa palabra deja de valer.

No uses `SITE_MODE=personal` mientras trabajas el portal: todas las funciones autenticadas exigirían al titular.

Con Postgres local, quita `SITE_MODE` si quieres el portal, o déjalo y entra con un usuario cuyo correo esté en `PERSONAL_OWNER_EMAILS`. La migración corre con `npm run db:migrate`.
