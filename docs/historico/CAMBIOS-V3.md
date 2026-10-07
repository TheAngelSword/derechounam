# Faculta de Derecho V3 — identidad UNAM + Google OAuth directo

## Cambios visuales
- Paleta principal actualizada a la identidad compartida por el usuario:
  - Azul PMS 654 C: `#003D79`
  - Oro PMS 1245 C: `#D59F0F`
  - Oro metálico de apoyo (aproximación digital de PMS 871): `#A99A67`
- Fondos y superficies aclarados para mejorar contraste y legibilidad.
- Logo UNAM añadido al acceso y al sidebar en escritorio.
- `theme-color` del navegador actualizado a azul UNAM.

## Autenticación
- Se eliminó la dependencia de producción del broker `auth.grok.me` para Google.
- Google ahora usa el proveedor nativo de Better Auth.
- Nuevas variables de Vercel:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `VITE_GOOGLE_AUTH_ENABLED=true`
- Callback de Google para producción:
  - `https://derechounam.com/api/auth/callback/google`

## Nota
Mantener también `BETTER_AUTH_URL=https://derechounam.com`, `BETTER_AUTH_SECRET`, `DATABASE_URL` y `VITE_AUTH_ENABLED=true`.
