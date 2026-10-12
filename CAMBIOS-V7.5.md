# V7.5: Aura Crono con un solo reloj
- En la parte superior de Inicio, cuatro módulos: un reloj seleccionable; fecha, temperatura y pronóstico horario; celebraciones y acontecimientos del día; frase jurídica que rota cada 10 segundos con los dos contadores solamente en el encabezado (sin repetirlos dentro de la tarjeta de frases).
- **V7.5.1:** los 26 estilos ahora se renderizan mediante los archivos originales de Aura Crono v3, incluidos los módulos de canvas/3D y mecanismos animados, en un visor aislado por iframe. Ya no se sustituyen por imitaciones compactas. La selección se guarda en localStorage y existe un botón para ampliar a pantalla completa.
- Radio con 44 emisoras y géneros, a partir del catálogo Aura Crono v3 del usuario; URL alternativa cuando está disponible, inicio manual, sin reproducción automática. Disponibilidad depende de proveedores externos.
- Open-Meteo provee la temperatura y hasta 8 horas de previsión; geolocalización opcional, Ciudad de México por defecto.
- Celebraciones mediante intento de feed de Wikipedia y, si no está disponible, calendario editorial del ZIP de Aura Crono, claramente identificado, sin inventar eventos. Efemérides también se consultan desde Wikipedia.
- Las 20 frases editoriales se cargan del feed del portal `/api/frases` y rotan cada diez segundos (no son citas atribuidas a juristas).
- La retícula adapta 4/2/1 columnas y respeta reducir movimiento.
- CI compila sin usar DATABASE_URL remota; no modifica bases en producción.

## Fuente original empaquetada
El ZIP original con los módulos del autor se incluye en `vendor/aura-crono-v3-original.zip` (SHA-256 verificado). `scripts/materialize-aura.mjs` extrae exclusivamente archivos permitidos a `public/aura-native/` antes de `dev`, `build`, `build:dev` y `build:code`. No requiere credenciales, no modifica Neon y evita mezclar los scripts del reloj con la sesión del portal.
