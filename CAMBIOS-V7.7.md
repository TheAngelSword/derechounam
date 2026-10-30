# V7.7 · Espacio personal en pnota.com y fuentes comprobadas

- pnota.com no estaba en el repositorio. El portal público sigue en https://derechounam.com. El espacio personal se sirve en pnota.com: proyecto de Vercel aparte con `SITE_MODE=personal`, o el mismo proyecto si `PERSONAL_PUBLIC_URL` es otro origen. La guía de DNS, cookies y variables está en `ESPACIO-PERSONAL.md`.
- La sesión sigue en la cookie `__Host-faculta-auth.session_token`, sin dominio compartido. Hay que entrar otra vez en pnota.com. Solo el correo de `PERSONAL_OWNER_EMAILS` pasa el middleware. El resto recibe no autorizado. En el host público las rutas personales responden «No encontrado.»
- En pnota.com el inicio no muestra alta ni Google. Las páginas del portal redirigen a `PORTAL_PUBLIC_URL`. La bitácora del grupo no registra esas visitas. El HTML lleva `noindex`.
- Agenda privada: tarea, examen, actividad, diplomado, repaso, lectura, clase, reunión y compromiso. Sección de fechas que importan (tareas, exámenes e importantes). Repasos con espaciado. Lecturas con páginas, minutos, capítulos o porcentaje. Zona horaria America/Mexico_City.
- Calendario: suscripción `.ics` con token, solo en el host personal, y enlace por evento a Google Calendar. No se conectó la API de Google Calendar.
- WhatsApp por `WHATSAPP_PROVIDER=meta|twilio|callmebot`, solo con variables de entorno. Cron diario a las 07:00 de México para no romper un plan Hobby. Avisos de 15 minutos requieren cron frecuente o el botón de pendientes. Deduplicación en `personal_reminder_log`. Webhook de entrada en Meta y Twilio.
- Migración 0021, solo tablas nuevas. No borra datos del grupo.
- Noticias, comprobadas el 24 de octubre de 2026: Gaceta de la Facultad pasa a su RSS real; se añade el RSS de www.scjn.gob.mx; el DOF deja de repetir la misma nota con el año 1926 y 2026. Acentos españoles en títulos. Lo que respondió 403 o un reto anti-bot no se conectó.
- Versión 7.7.0. Pruebas en `tests/v77`.
