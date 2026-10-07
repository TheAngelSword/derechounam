# Facultad de Derecho · V7.1

## Cambios implementados

- Avance personal: mantiene `study_progress.user_id` obtenido de la sesión. Añade Reprobada, No presentada y Baja, filtros y recuentos. Sólo Aprobada suma créditos. La malla curricular es común; los estados son individuales. No existe sincronización con SIAE.
- Noticias: obtiene imágenes Open Graph/Twitter y miniaturas asociadas al enlace exacto; reconoce video y YouTube. Enriquece hasta seis artículos por fuente durante la actualización del caché, con límites de tiempo, tamaño y redirecciones a hosts oficiales. Cada categoría tiene una ilustración original rotulada como referencia si no hay imagen. Hay filtros Recientes / Último año / Todo el archivo.
- Votaciones: donut de modos de respuesta, barras por día, tabla de compatibilidad y orientación. No mezcla el día más mencionado con otra hora para inventar una propuesta. Muestra empates; no recomienda fechas pasadas. Los flexibles añaden compatibilidad, no preferencias. La fecha calendarizada continúa administrándose desde Editar; la gráfica no cierra ni altera votaciones. Se conserva el registro público y la administración de participantes con sus permisos existentes.
- Identidad: azul `#002B7A`, dorado `#D59F0F`, icono de cada sección en su cabecera, logo vectorial original de Justicia con balanza y espada, favicon y cabecera de login. Se corrige Facultad de Derecho y se mantiene el aviso de portal estudiantil independiente.
- Validación: GitHub Actions instala el lockfile existente, ejecuta las suites V7/V7.1, comprueba sintaxis y realiza build de código sin migraciones remotas.

## Conservación

No se cambian `package.json`, `package-lock.json`, secretos, roles, archivos subidos ni migraciones SQL. Se conserva TanStack Start 1.168.60 de la rama prueba-v7. La versión visible del portal está en `src/lib/app-version.ts` (7.1.0); el nombre/versionado npm anterior se conserva para evitar cambios innecesarios en el lockfile.

La implementación definitiva de esta rama no añade la migración 0019 ni un cierre automático de votaciones. Descripciones de prototipos anteriores no deben tomarse como la lista de archivos publicada.

## Pruebas realizadas y límites

Durante preparación: 54 pruebas V7/V7.1 aprobadas, 103 archivos TS/TSX comprobados sintácticamente y comprobación estricta de módulos puros. La composición final debe confirmarse mediante el workflow y el despliegue de Preview. No se ha probado desde este entorno una conexión real a Neon, una sesión real de dos cuentas o una subida a Drive; esas verificaciones forman parte de la aceptación antes de Production. Una comprobación sintáctica no equivale a un build completo ni a una auditoría de seguridad.

Las imágenes conceptuales generadas en el chat no son capturas del despliegue real. El código conserva las funciones y navegación de V7 y aplica los cambios descritos arriba; no incorpora noticias ni datos académicos ficticios de esos conceptos.
