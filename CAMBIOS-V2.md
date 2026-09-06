# Atrio — actualización visual y funcional V2

## Cambios principales

- Inicio convertido en dashboard dinámico "Hoy".
- Próxima clase / clase en curso según hora de Ciudad de México.
- Barra de progreso de la jornada 07:00–14:00.
- Resumen de materias, próximos eventos y avisos fijos.
- Accesos rápidos a agenda, biblioteca, mesas y cátedras.
- Navegación móvil simplificada a una sola barra con menú "Más".
- Menú lateral de escritorio renovado con mejor jerarquía visual.
- Tarjetas, botones, campos y estados con microinteracciones suaves.
- Nuevo fondo, sombras, radios, contraste y estilo visual más moderno.
- Página de Clases transformada en línea de tiempo con clase actual destacada.
- Fecha de Agenda dinámica; se eliminó la fecha fija 2026-09-16.
- `isSoon()` ahora usa la fecha real de Ciudad de México; se eliminó la fecha fija 2026-09-05.
- Confirmación visual al publicar una actividad en Agenda.
- Registro: nuevas altas ya no pueden elegir por sí mismas el rol Profesor.
- Nuevas altas (salvo el primer bootstrap) quedan como alumno pendiente hasta aprobación.
- Bitácora detallada de accesos visible sólo para moderadores.
- Mejoras de foco, `aria-current`, `aria-pressed` y soporte de reducción de movimiento.

## Archivos principales modificados

- `src/styles.css`
- `src/components/ui.tsx`
- `src/components/shell.tsx`
- `src/routes/index.tsx`
- `src/routes/clases.tsx`
- `src/routes/agenda.tsx`
- `src/routes/registro.tsx`
- `src/lib/format.ts`
- `src/lib/members.ts`

## Validación realizada

Los archivos TypeScript/TSX modificados fueron validados mediante el compilador de TypeScript en modo de transpilación para detectar errores de sintaxis.

No se pudo ejecutar el `typecheck`/build completo porque el ZIP no incluye `node_modules` y la instalación de dependencias no concluyó en el entorno de revisión. Al probar localmente, ejecutar:

```bash
npm ci
npm run typecheck
npm run dev
```

## Nota de seguridad

Se reforzó el alta de miembros y la privacidad de la bitácora. El proyecto conserva el mecanismo de bootstrap existente donde la primera cuenta de una instalación vacía se convierte en moderador; para una publicación pública conviene sustituir ese bootstrap por una invitación o identidad administrativa preconfigurada.
