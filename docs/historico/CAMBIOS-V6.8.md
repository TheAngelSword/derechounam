# Faculta de Derecho V6.8 – Biblioteca por formatos

## Biblioteca

- Cada ficha puede guardar **tres archivos independientes**:
  - PDF
  - Word editable (`.doc` / `.docx`)
  - EPUB
- Cada tarjeta muestra un botón individual para los formatos disponibles.
- El campo **“Liga para compra o venta”** cambia a **“Enlace para comprar en línea”**.
- El enlace de consulta externa se mantiene como opción independiente.
- Cada archivo tiene límite de **100 MB**.
- Los archivos continúan almacenándose directamente en HostGator bajo:
  `media.ge01.com/biblioteca/AAAA/MM/`
- La URL y metadatos de cada formato se guardan en Neon.

## Compatibilidad

La migración `0009_library_file_formats.sql` agrega columnas separadas para PDF, Word y EPUB y conserva/clasifica los archivos anteriores que estaban guardados en `file_url`.

## HostGator

Para permitir Word, también se debe reemplazar `media.ge01.com/_upload/upload.php` por la versión V6.8. El gateway ahora acepta PDF, EPUB, DOC y DOCX en la categoría Biblioteca.
