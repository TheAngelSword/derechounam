# Noticias: fuentes y configuración

Revisión: 24 de octubre de 2026. Las direcciones siguientes identifican fuentes. Lo que no respondió con un feed o un HTML utilizable desde este entorno no se conectó.

## Fuentes incluidas

| Fuente | Dirección | Configuración inicial / comprobación |
|---|---|---|
| DUA, modalidad abierta | https://duaderecho.unam.mx/ | Adaptador HTML habilitado. La página depende de contenido que no fue legible en la revisión final. No se afirma que se hayan extraído avisos en directo. Se conserva acceso al sitio y se permite publicar avisos revisados manualmente. |
| Facultad de Derecho, eventos | https://www.derecho.unam.mx/eventos/ | Página oficial consultada, con títulos, horarios y carteles. Adaptador HTML habilitado, pendiente de probar en el servidor. No se inventa un año de evento cuando falta. |
| Gaceta UNAM, Facultad de Derecho | https://www.gaceta.unam.mx/tag/facultad-de-derecho/feed/ | RSS comprobado el 24 de octubre de 2026 (HTTP 200, entradas de la etiqueta). El adaptador pasa de HTML a RSS. Una configuración guardada con la URL vieja, sin `/feed/` y en HTML, se actualiza sola a este feed. |
| Diario Oficial de la Federación | https://dof.gob.mx/index.php | Adaptador HTML. El 24 de octubre de 2026 `https://dof.gob.mx` respondió 200. `https://www.dof.gob.mx` falla el certificado (el nombre no coincide): no se usa www. No hay un RSS único; el configurador sigue siendo https://dof.gob.mx/website/filtroRss.php y hay que pegar el enlace generado. La portada a veces repite el mismo `codigo` con fecha 1926 y 2026; el lector se queda con la fecha más reciente. |
| SCJN, RSS oficial | https://www.scjn.gob.mx/rss.xml | Habilitada. RSS comprobado el 24 de octubre de 2026 (síntesis informativa y avisos del sitio). No es el Semanario Judicial. |
| SCJN, comunicados (sitio anterior) | https://www.internet2.scjn.gob.mx/red2/comunicados/ | Sigue en HTTP 403 el 24 de octubre de 2026. Deshabilitada. La página HTML de comunicados en www.scjn.gob.mx no trae fichas legibles sin JavaScript, así que no se añadió como HTML. |
| Cámara de Diputados, reformas | https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm | Fuente de referencia, deshabilitada hasta comprobar acceso y adaptación. No se afirma que exista un RSS verificado. |
| Poder Judicial de Coahuila | https://www.pjecz.gob.mx/consultas/fuentes-rss/ | Fuente estatal opcional, deshabilitada por defecto. Documenta RSS oficiales; se incluye `https://www.pjecz.gob.mx/feeds/comunicados.rss.xml` para probar. No es una fuente federal ni de la UNAM. |

El archivo editable es `src/lib/news/sources.ts`. La interfaz de Control permite cambiar formato, URL, palabras y activación de estas fuentes, dentro de sus hosts permitidos. Para agregar una institución distinta hay que agregar una definición de fuente y revisar su seguridad; no se aceptan URLs arbitrarias a redes privadas.

## Qué se probó y no se conectó

El 24 de octubre de 2026, desde este entorno:

- `https://www.gaceta.unam.mx/feed/` responde RSS de toda la UNAM. Se deja como portada HTML filtrada por palabras (`gaceta-actualidad`), no como feed general.
- El Búho (`WebFeedGatewayPlugin/rss2` y Atom), `internet2.scjn.gob.mx`, `dgae.unam.mx` y `escolar.unam.mx` respondieron HTTP 403. Siguen fuera.
- `https://sjf2.scjn.gob.mx` devuelve un reto de Incapsula. El servicio SOAP del Semanario existe, pero no se comprobó como feed estable. No está integrado.
- `https://www.derecho.unam.mx/avisos/` y `/calendario/` respondieron 404. La agenda que ya usa el portal es `/eventos/`.
- El RSS del CJF falló el certificado. No se añadió.

## Cómo configurarlas en el portal

En **Control → Noticias y fuentes → Configurar feeds y probar las fuentes**, selecciona el formato real (RSS/Atom o página oficial), ajusta las palabras clave y la frecuencia y pulsa **Guardar y probar**. Un filtro vacío admite todos los titulares de la fuente. El resultado se consulta en Noticias → Fuentes, frecuencia y estado de lectura.

Para DOF entra al configurador oficial, selecciona los criterios deseados, genera el RSS y copia su URL de salida. Después elige RSS/Atom y pega ese enlace en la entrada DOF del portal. Una selección limitada a una fecha fija puede no traer publicaciones futuras: comprueba el alcance del filtro generado.

## Frecuencia y estados

La frecuencia predeterminada es 60 minutos, ajustable entre 15 y 360. **La lectura se activa al visitar el sitio una vez vencida la caché.** No hay una tarea programada persistente ni garantía de noticias minuto a minuto. Cada fuente tiene una caché compartida en PostgreSQL y un bloqueo breve contra refrescos simultáneos.

Si una fuente falla se conserva su última lectura correcta, se muestra el error y no se sustituye por titulares inventados. Sin base de datos disponible se muestran referencias iniciales fechadas como tales. La vista previa HTML no hace peticiones de noticias reales.

## Imágenes, video y criterios editoriales

Un feed puede aportar su propia imagen explícita. El adaptador HTML utiliza gráficos de categoría en lugar de asociar a un evento una fotografía vecina sin evidencia. Los moderadores pueden subir fotos, infografías y videos propios o autorizados a Drive, o insertar un video oficial de YouTube. No se descargan ni reubican automáticamente fotos/videos de terceros.

El editor permite borradores, publicación, edición, destacado y ocultación. Una publicación debe identificar la fuente original. La casilla de publicación advierte que sus adjuntos serán visibles para visitantes sin sesión. Los guardados de noticias son locales al navegador y no se sincronizan entre dispositivos.

Las etiquetas diferencian información, aviso académico, evento, iniciativa, publicación DOF y jurisprudencia; no se genera una afirmación de entrada en vigor a partir de un titular. La verificación editorial del texto, transitorios, fecha y ámbito sigue siendo necesaria.

## Referencias iniciales

La DUA se presenta como fuente de consulta, no como un evento comprobado. Dos tarjetas de eventos corresponden a la agenda de la Facultad consultada y remiten a confirmar programa y año. La nota de vitrales de Gaceta se conserva como archivo, no como noticia de octubre:
https://www.gaceta.unam.mx/develan-vitrales-de-narcissus-quagliata/

Los textos son reseñas breves y enlaces, no reproducciones de artículos completos.
