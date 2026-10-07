# Faculta de Derecho V6.3 — corrección de contraste en bloques destacados

## Problema corregido
Los bloques principales de Servicios, Bitácora, Biblioteca y Horarios podían aparecer con fondo claro y texto casi blanco en producción.

La causa era una colisión entre el fondo base `bg-surface` del componente `Card` y el fondo `bg-forest` añadido en algunas páginas. Dependiendo del orden generado por Tailwind, el fondo claro podía ganar la cascada.

## Solución
Se agregó una clase visual independiente `unam-hero-card` con:
- gradiente azul institucional UNAM,
- texto claro forzado con contraste estable,
- borde azul y sombra,
- brillo dorado decorativo,
- compatibilidad con las animaciones existentes.

## Secciones corregidas
- Servicios
- Bitácora
- Biblioteca / Libros
- Horarios

No requiere migraciones de base de datos ni cambios de variables en Vercel/HostGator.
