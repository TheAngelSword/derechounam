# Faculta de Derecho V6.23 — Persistencia de ligas en Cátedras

- Corrige el guardado y refresco de ligas de audio y ligas complementarias en Cátedras.
- El servidor confirma con `RETURNING` que las URLs quedaron persistidas antes de mostrar éxito.
- Después de publicar o editar se fuerza un refetch real del tablero y se abre el registro guardado.
- Las URLs admiten hasta 4,000 caracteres y se eliminan espacios/saltos de línea accidentales al pegar.
- Al editar, una liga existente se conserva si el campo queda vacío; para borrarla hay una casilla explícita.
- La vista de detalle muestra la URL guardada además del botón para abrirla.
- Si un registro no tiene recursos guardados, se indica explícitamente.
- Se corrige además una declaración duplicada en la validación de archivos de Cátedras.

No requiere migración de Neon ni cambios en HostGator.
