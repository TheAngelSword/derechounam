# Faculta de Derecho V6.2 - reparación de archivos desincronizados

Este parche re-sincroniza V6 + V6.1 después del error de Vercel:

- `addClassMaterial` faltante en `src/lib/content.ts`
- `addServiceOffer` faltante en `src/lib/content.ts`

Incluye también los tipos, rutas, almacenamiento HostGator y migración V6 correspondientes para evitar versiones mezcladas.

## Importante

En GitHub elimina si existe:

`src/routes/Faculta de DerechoRoutesExample.tsx`

Ese archivo no rompe el build, pero TanStack Router lo detecta como archivo de rutas inválido y muestra una advertencia.
