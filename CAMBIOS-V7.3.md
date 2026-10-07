# Facultad de Derecho · V7.3

## Implementación

- Inicio incorpora Aprende algo hoy: materia seleccionable, pregunta de opción múltiple con respuesta y fuente, ¿Sabías que? y una pauta de estudio. No modifica el avance académico.
- Nueva sección Juegos en el menú y la búsqueda: quiz de cinco preguntas, fichas, memorama de cuatro parejas, relacionar conceptos, verdadero/falso y El tablero jurídico.
- Banco inicial: siete materias, diez fichas y diez preguntas por materia (70 de cada una), siete tableros y 21 pautas. Son ejercicios originales de apoyo basados en las seis planeaciones compartidas; no se presentan como lecturas completas ni preguntas oficiales de examen.
- Teoría General del Estado es provisional y se basa en el programa público UNAM para SUAYED/Modalidad Abierta, clave 1127: https://www.dgire.unam.mx/images/planes/der2/1127s.pdf . No se inventan fechas, tareas ni porcentajes de evaluación del docente.
- Cada respuesta incluye referencia a la página/unidad. No se publican los archivos originales de los docentes, datos de reuniones ni enlaces privados.
- El tablero acepta sinónimos expresamente configurados, acentos y mayúsculas, evita repetir puntos, tiene tres fallos y permite revelar. Sus puntos no son resultados de una encuesta ni una decisión colectiva.
- Historial de prácticas y notas privadas por usuario autenticado y materia. Se usa la identidad de sesión y se requiere registro activo. Los juegos NO cambian materias, calificaciones ni créditos. Visitantes juegan sin guardar. Las fichas son autoevaluación y el memorama registra parejas completadas, no una calificación del profesor.
- Nueva migración aditiva 0019_games_practice.sql: study_game_attempts y study_game_notes. No borra tablas anteriores. Notas con revisión optimista e historial con identificadores idempotentes para reintentos.
- Calendarios de Cátedras y Votaciones limitados a 440 px de ancho en escritorio, celdas de 48 px y panel lateral separado. Mes y navegación visibles, diseño de una columna en móvil.
- Noticias: imagen completa con object-fit:contain, fondo neutro y enlace Ver imagen completa. No se deforma ni se recorta la imagen para llenar el espacio. Las ilustraciones de respaldo siguen identificadas.
- Servicios: selección JPG/PNG/WEBP hasta 15 MB, vista previa local, quitar selección, rechazo de formatos inválidos. Seleccionar NO sube; Publicar usa el flujo real de Drive y confirma el archivo antes de guardar la publicación.

## Drive: qué significa el diagnóstico

Control muestra configuración ausente/presente/comprobada, nombres de variables faltantes (nunca sus secretos), entorno/rama y prioridad de carpeta. La carpeta en Control/base tiene prioridad sobre GOOGLE_DRIVE_FOLDER_ID.

Probar conexión sólo verifica una carpeta editable y enumera sus hijos directos; NO declara una subida. Crear archivo de prueba en Drive es otra acción explícita del moderador: crea un PNG pequeño en bitacora/diagnostico y da un enlace sólo tras la confirmación del servidor. Ese archivo se conserva para comprobarlo; no crea una publicación.

Contadores: historial de subidas confirmadas y sesiones pendientes de esta base, no inventario completo de la carpeta actual. Los registros de texto, notas, usuarios y avance viven en PostgreSQL. Archivos anteriores en otro alojamiento y noticias externas NO se trasladan automáticamente a Drive.

La conexión de administración de Vercel disponible durante esta implementación devolvió 403 para el equipo theangelswords-projects. Por ello, no se ha certificado desde esa conexión qué credenciales reales tiene el despliegue ni se ha ejecutado una subida con la cuenta del usuario. El control permite comprobarlo sin enviar secretos al chat.

## Validación y publicación

El workflow Validar Facultad V7.3 ejecuta 85 pruebas unitarias, comprobación de sintaxis, compilación sin base remota y navegador sobre servidor/base locales. Incluye las siete materias, los seis juegos, dos cuentas aisladas, notas/historial, formularios de fotos y tamaños de calendario a 390/1440/1920 px. El resultado efectivo se comprueba en GitHub Actions; escribir un test no demuestra que haya pasado.

La comprobación global de tipos de la base V7.2 conserva errores anteriores ajenos a estos módulos (Sidebar antigua, popup OAuth y props de componentes). No se presenta la prueba de sintaxis como un typecheck completo.

No se cambian package.json, package-lock.json, secretos ni main. Antes de Production: validar Preview, autorización/subida real de Drive y variables productivas por separado. No promover un Preview conectado a una base de pruebas.
