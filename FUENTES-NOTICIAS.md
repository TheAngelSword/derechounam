# Noticias: fuentes y configuración

Revisión: 6 de octubre de 2026. Las direcciones siguientes identifican fuentes; **no todas publican un RSS ni todas permitieron comprobar su contenido desde este entorno**.

## Fuentes incluidas

| Fuente | Dirección | Configuración inicial / comprobación |
|---|---|---|
| DUA, modalidad abierta | https://duaderecho.unam.mx/ | Adaptador HTML habilitado. La página depende de contenido que no fue legible en la revisión final. No se afirma que se hayan extraído avisos en directo. Se conserva acceso al sitio y se permite publicar avisos revisados manualmente. |
| Facultad de Derecho, eventos | https://www.derecho.unam.mx/eventos/ | Página oficial consultada, con títulos, horarios y carteles. Adaptador HTML habilitado, pendiente de probar en el servidor. No se inventa un año de evento cuando falta. |
| Gaceta UNAM, Facultad de Derecho | https://www.gaceta.unam.mx/tag/facultad-de-derecho/ | Portada temática consultada. Adaptador HTML habilitado. El endpoint propuesto terminado en `/feed/` devolvió un error de acceso: no se considera RSS comprobado. |
| Diario Oficial de la Federación | https://dof.gob.mx/index.php | Adaptador HTML habilitado, a comprobar desde el hosting. Su configurador RSS oficial sí fue consultado: https://dof.gob.mx/website/filtroRss.php . Debe pegarse el enlace generado, no el configurador. |
| SCJN, comunicados | https://www.internet2.scjn.gob.mx/red2/comunicados/ | Deshabilitada por defecto; la revisión devolvió HTTP 403. Permite configurar y probar una URL del mismo host oficial. |
| Cámara de Diputados, reformas | https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm | Fuente de referencia, deshabilitada hasta comprobar acceso y adaptación. No se afirma que exista un RSS verificado. |
| Poder Judicial de Coahuila | https://www.pjecz.gob.mx/consultas/fuentes-rss/ | Fuente estatal opcional, deshabilitada por defecto. Documenta RSS oficiales; se incluye `https://www.pjecz.gob.mx/feeds/comunicados.rss.xml` para probar. No es una fuente federal ni de la UNAM. |

El archivo editable es `src/lib/news/sources.ts`. La interfaz de Control permite cambiar formato, URL, palabras y activación de estas fuentes, dentro de sus hosts permitidos. Para agregar una institución distinta hay que agregar una definición de fuente y revisar su seguridad; no se aceptan URLs arbitrarias a redes privadas.

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
