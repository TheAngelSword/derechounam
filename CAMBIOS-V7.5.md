# V7.5: Aura Crono con un solo reloj
- En la parte superior de Inicio, cuatro módulos: un reloj seleccionable; fecha, temperatura y pronóstico horario; celebraciones y acontecimientos del día; frase jurídica que rota cada 10 segundos más dos contadores.
- Selector con 26 **representaciones compactas** de los estilos nombrados en Aura Crono v3 (no portamos la simulación 3D completa en esta iteración). Guarda la elección localmente.
- Radio con 44 emisoras y géneros, a partir del catálogo Aura Crono v3 del usuario; URL alternativa cuando está disponible, inicio manual, sin reproducción automática. Disponibilidad depende de proveedores externos.
- Open-Meteo provee la temperatura y hasta 8 horas de previsión; geolocalización opcional, Ciudad de México por defecto.
- Celebraciones mediante intento de feed de Wikipedia y, si no está disponible, calendario editorial del ZIP de Aura Crono, claramente identificado, sin inventar eventos. Efemérides también se consultan desde Wikipedia.
- Las 20 frases editoriales se cargan del feed del portal `/api/frases` y rotan cada diez segundos (no son citas atribuidas a juristas).
- La retícula adapta 4/2/1 columnas y respeta reducir movimiento.
- CI compila sin usar DATABASE_URL remota; no modifica bases en producción.
