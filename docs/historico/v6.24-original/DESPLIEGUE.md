# Atrio — Cómo poner el sitio en derechounam.com

Este proyecto **no** es una carpeta de HTML para pegar en `public_html` de un hosting solo PHP. Es una aplicación Node.js con base de datos. El dominio derechounam.com debe apuntar a un servicio que ejecute Node 22 y PostgreSQL.

## Qué necesitas

- Node.js 22
- npm
- PostgreSQL 15 o superior
- Un proceso que quede encendido (Passenger, systemd, Docker, Railway, Render, Fly, VPS)
- HTTPS en derechounam.com

## Instalación

```bash
unzip atrio-derechounam.zip
cd atrio-derechounam
npm install
```

Variables de entorno del proceso (no las subas a un repositorio público):

```bash
export DATABASE_URL="postgres://USUARIO:CLAVE@HOST:5432/atrio"
export BETTER_AUTH_URL="https://derechounam.com"
export BETTER_AUTH_SECRET="una-cadena-larga-y-aleatoria"
export NODE_ENV="production"
```

Opcional, si vas a usar Google y X además del correo:

```bash
export GROK_AUTH_ISSUER="https://auth.grok.me"
export GROK_AUTH_CLIENT_ID="..."
export GROK_AUTH_CLIENT_SECRET="..."
```

El correo con clave ya está encendido en `src/lib/auth/email-password.ts`. Con eso el grupo puede darse de alta aunque aún no tengas Google/X.

## Base de datos

```bash
npm run db:migrate
```

Eso crea las tablas de cuentas, el padrón y el mural, y carga el horario del grupo 9114.

## Construcción y arranque

```bash
npm run build
```

El compilado queda en `.vercel/output`. En un VPS típico:

```bash
npx vite preview --host 0.0.0.0 --port 3000
```

O el arranque que use tu panel (Passenger / systemd / Docker). El proxy inverso (Nginx o Caddy) debe mandar `derechounam.com` a ese puerto, con SSL.

Ejemplo mínimo de Nginx:

```nginx
server {
  listen 443 ssl http2;
  server_name derechounam.com www.derechounam.com;
  ssl_certificate     /etc/letsencrypt/live/derechounam.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/derechounam.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Apunta el DNS:

- `A` derechounam.com → IP del servidor
- `CNAME` www → derechounam.com (o otro `A`)

## Primera sesión en el sitio

1. Abre https://derechounam.com
2. Entra con correo y crea la primera cuenta
3. Completa el padrón: esa ficha queda como moderador
4. Desde Control y Registro abre el resto del grupo

## Qué no hacer

- No subas solo la carpeta `src/` a un hosting PHP. No va a correr.
- No dejes `BETTER_AUTH_SECRET` vacío en producción.
- No expongas `DATABASE_URL` en el navegador.
- No borres `migrations/`; sin ellas el sitio nace vacío.

## Prueba en tu máquina

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:8080`. El horario se ve sin cuenta. Publicar pide entrada y padrón.
