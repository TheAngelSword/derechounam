# Facultad de Derecho · V7.2

Esta revisión implementa cambios sobre la rama prueba-v7; no publica Production ni modifica credenciales.

## Interfaz real
- Inicio: Un portal para ti. Cabecera amplia con Justicia dorada, seis accesos académicos, avance por sesión, próxima clase según horario semanal, votación activa con tendencia y próximos eventos.
- Nuevo emblema WebP a partir de la ilustración de Justicia aprobada en la conversación. Sustituye el pictograma anterior en barra lateral, cabecera, login y favicon. Conserva el aviso de comunidad estudiantil independiente.
- Distribución a todo el ancho disponible después de la barra lateral; no se duplica el margen de ésta. Adaptación a móvil y menú compacto.
- Noticias: Todas las noticias. Rutas: Comparte tu vehículo.

## Noticias
- El filtro inicial es Todas las fechas: la pantalla anterior ocultaba entradas antiguas y sin fecha por abrir en últimos 90 días. Se mantienen Archivo y Fecha no informada, sin cambiar fechas reales para aparentar actualidad.
- Contadores por tema, buscador, filtros, guardados, vista compacta, paginación de 12 en 12 y accesos a fuentes originales.
- Se complementa Gaceta temática con portada de Gaceta filtrada por temas jurídicos/Universidad Abierta y El Búho. Ensayos, avisos y noticias conservan su fuente y no se presentan como legislación vigente.
- El lector complementa encabezados con enlaces de artículos y carteles con texto alternativo. Respeta límites de tamaño, tiempo, hosts y contenido. La caché reader-v72 permite renovar la extracción sin borrar las lecturas previas ni cambiar preferencias administrativas.
- Fotos proceden de sus fuentes; si no existen se usan ilustraciones rotuladas. No se incorporan los titulares o cifras ficticias de las imágenes conceptuales.

## Preservación y validación
No hay nuevas migraciones, cambios en package.json/package-lock.json, contraseñas, permisos, registros o ficheros subidos. Se conserva TanStack corregido de la rama. El panel lee las APIs existentes; no modifica votos ni calificaciones.

Se añaden 16 pruebas de selección de noticias, extracción y fechas del horario. El workflow ejecuta las suites anteriores, sintaxis, compilación sin base remota y comprobaciones de navegador de Inicio/Noticias/Rutas a 390, 1440 y 1920 px. El resultado efectivo está en GitHub Actions; definir una prueba no demuestra que haya pasado.

Antes de Production: revisar Preview, validar Drive y comprobar por separado las variables del entorno productivo siguiendo PUBLICAR-V7.1.md. No hacer Promote de un Preview que utiliza la base de pruebas.
