# V7.4 - Portal Derecho UNAM
- Production requiere un BETTER_AUTH_SECRET persistente con 32 o más caracteres.
- Inicio con Aura Crono: fecha y hora de CDMX, reloj analógico, digital y orbital, efemérides de Wikipedia, clima de Open-Meteo, estaciones clásicas y jazz, personaje animado por mes, 20 frases jurídicas diarias y contadores al 28 de noviembre de 2026 y fin de año.
- Feed local JSON en /api/frases con veinte reflexiones editoriales originales seleccionadas cada día; no se atribuyen a autores externos.
- Noticias en las últimas 72 horas por defecto, sin mezclar archivos históricos con notas de hoy. Las fuentes se consultan al vencer su caché cuando hay visitas y podrían carecer de publicaciones nuevas.
- Juegos: iconografía diferenciada para siete materias y barra adaptable.
- Validación de CI aislada, sin migrar producción.
- Revisar Vercel Production (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL y VITE_AUTH_ENABLED) antes de publicar.
