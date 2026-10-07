# Faculta de Derecho V5.1 — Corrección de Biblioteca

## Problema corregido
El formulario de Biblioteca rechazaba referencias jurídicas extensas porque el campo **Autor** heredaba un límite genérico de 80 caracteres. El navegador terminaba mostrando el JSON técnico de validación (`too_big`, `maximum: 80`).

## Cambios
- Título: máximo 300 caracteres.
- Autor: máximo 400 caracteres.
- Materia: máximo 180 caracteres.
- Editorial: máximo 240 caracteres.
- Año / fecha bibliográfica: máximo 40 caracteres.
- Edición: máximo 240 caracteres.
- ISBN: máximo 80 caracteres.
- Notas: máximo 1800 caracteres.
- Alias / responsable: máximo 160 caracteres.
- Precio: máximo 120 caracteres.
- URLs: máximo 1500 caracteres.
- Las ligas pegadas sin `https://` se normalizan automáticamente.
- Los errores de validación ahora se muestran en español y ya no exponen el JSON interno de Zod.

## Archivos modificados
- `src/lib/content.ts`
- `src/routes/biblioteca.tsx`

No requiere migración de base de datos.
