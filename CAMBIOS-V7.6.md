# V7.6 · Administración del registro y bitácora privada

- Registro: tabla con búsqueda, filtros por rol/estado, paginación y acciones Revisar, Editar y Eliminar del padrón para moderadores activos.
- Revisión: muestra correo de la cuenta, nombre, alias, grupo, rol, estado, ID y fechas. No consulta ni devuelve contraseñas o tokens.
- Edición: alias, grupo, rol y estado, con revisión optimista para impedir sobrescribir una edición simultánea.
- Eliminación: requiere escribir ELIMINAR. Retira membresía y permisos por área y revoca sesiones; conserva la cuenta de autenticación, los materiales y los accesos históricos. La persona puede solicitar ingreso nuevamente como pendiente.
- Protección: operaciones atómicas, autenticación y rol verificados en servidor, sin autorretiro ni pérdida del último moderador activo. Cada edición/eliminación queda en registry_admin_audit.
- La bitácora se consulta mediante un endpoint exclusivo de moderadores. loadDirectory ya no consulta ni entrega accesos a usuarios ordinarios. Respuestas privadas sin caché.
- Filtros de bitácora: fechas inclusivas de Ciudad de México, usuario, sección y acción. Vista paginada de 50 eventos, resúmenes completos del filtro.
- Excel .xlsx real, generado en el navegador sin subir datos a terceros: Resumen usuarios, Usuarios y secciones, Accesos y Criterios. Fechas Excel, encabezados congelados y filtros; conteos por fórmula con valores almacenados. Los valores introducidos por usuarios son texto, no fórmulas.
- La descarga incluye todo el filtro, no solo la página visible. Máximo 10,000 eventos por archivo; solicita acotar el periodo en vez de truncar silenciosamente.
- Fechas de la bitácora normalizadas a ISO en el servidor y mostradas con día, mes, año, hora, minutos y segundos en CDMX.
- Un rastreador de navegación en la raíz cubre las secciones del portal sin duplicar visitas por cambios del objeto de sesión. Eventos con ID único. No se borran repeticiones históricas.
- Migración 0020 aditiva: revisiones/fecha de edición, ID de evento, índices, auditoría y función de administración. No elimina filas al desplegar.
- Se conservaron sin cambios la configuración de autenticación, variables de entorno, mascota, relojes, radio y archivos de contenido.
