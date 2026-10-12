# Faculta de Derecho · versión 7.0.0

Portal estudiantil independiente de la comunidad 9114, modalidad abierta. No es un sitio oficial de la UNAM.

Esta entrega contiene **código fuente modificado y una vista previa del diseño**, no un despliegue ya realizado. La base es la versión 6.24 proporcionada. No se ha accedido a la base de datos de producción ni transferido archivos de tus cuentas.

## Qué cambió

Inicio y navegación nuevos; noticias multimedia y fuentes configurables; plan 2125 completo con avance personal; todas las nuevas cargas de archivos dirigidas exclusivamente a Google Drive. Las funciones anteriores de cátedras, biblioteca, tareas, horarios, agenda, votaciones, bitácora, rutas y comunidad se conservan.

## Empieza aquí

1. `CAMBIOS-V7.0.md`: alcance y diferencias respecto a 6.24.
2. `INSTALACION-V7.md`: actualización en una copia de pruebas y despliegue.
3. `CONFIGURAR-DRIVE.md`: autorización de la cuenta y carpeta del portal.
4. `FUENTES-NOTICIAS.md`: fuentes, estados y configuración RSS/HTML.
5. `PRUEBAS-V7.md`: comprobaciones realizadas y pendientes.

La vista previa independiente se abre con doble clic en `docs/v7/vista-previa.html`. Tiene Inicio, Noticias, Plan y Optativas. **No está conectada al backend ni a Drive** y no guarda el avance.

## Desarrollo

Necesita Node.js 22 compatible con las dependencias y npm. Revisa el archivo `.env.example`; nunca publiques secretos.

```bash
npm ci
npm run dev
```

Sin `DATABASE_URL`, el proyecto utiliza la base de desarrollo en memoria heredada, que se pierde al reiniciar. Para conservar datos, configura PostgreSQL. El arranque local y la compilación completa deben validarse en un entorno con acceso al registro npm; consulta `PRUEBAS-V7.md`.

## Conservación de datos

Las migraciones 0001–0017 se mantienen sin cambios. La migración 0018 agrega tablas; no borra ni reemplaza contenido previo. Los archivos que ya estaban en otro proveedor conservan sus enlaces: **no se han migrado a Drive**. Los documentos de la entrega anterior quedan exclusivamente en `docs/historico/`, no son las instrucciones de esta versión.
