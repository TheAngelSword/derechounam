# V7.6.1 · Miniaturas completas en el lector de noticias

- Se elimina la exclusión permanente de artículos posteriores al sexto. Todas las entradas pueden enriquecerse, con un presupuesto temporal por fuente y tres solicitudes simultáneas; las tarjetas visibles completan cualquier recurso pendiente.
- Detección de imágenes Open Graph/Twitter, JSON-LD de artículos, imágenes del cuerpo, carga diferida, srcset y fondos enlazados de la lista. No se toma una foto de otra noticia, el menú o la barra lateral como portada.
- Detección de videos de YouTube tanto en enlaces como en iframes y datos estructurados. Miniatura de video y reproducción a petición.
- Lista de imágenes alternativas de la misma publicación: se intenta otra cuando falla la primera; se conserva la ilustración de referencia cuando no hay material utilizable.
- Caché persistente por URL de artículo: resultados válidos 24 horas, ausencia de multimedia 15 minutos y errores 1 minuto. Bloqueo de solicitudes duplicadas. Utiliza las tablas existentes; no requiere migración SQL.
- Se renueva el namespace del lector y la caché del cliente. Los titulares de la caché anterior se conservan si una fuente falla durante la primera actualización.
- El resolver público solo acepta artículos ya presentes en las fuentes recuperadas o las referencias revisadas. HTTPS y lista de dominios oficiales se mantienen; no es un proxy de URLs arbitrarias.
- No cambia autenticación, padrón, permisos, radio, relojes, mascota ni contenidos editoriales. No se modifican fechas históricas ni se presentan como noticias del día.
