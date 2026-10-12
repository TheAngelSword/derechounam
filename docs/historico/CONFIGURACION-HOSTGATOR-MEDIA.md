# Configuración rápida de media.ge01.com

1. Crea el subdominio `media.ge01.com` en cPanel y usa como document root una carpeta dedicada, por ejemplo `public_html/faculta-media`.
2. Sube dentro de ese document root el contenido de la carpeta `hostgator-media/`.
3. Crea un FTP independiente restringido exactamente a ese document root.
4. Copia `faculta_upload_config.example.php` fuera del document root y renómbralo `faculta_upload_config.php`.
5. Genera un secreto aleatorio largo y colócalo en ese archivo.
6. En Vercel agrega el mismo secreto como `FACULTA_MEDIA_UPLOAD_SECRET`.
7. En Vercel agrega `FACULTA_MEDIA_UPLOAD_URL=https://media.ge01.com/_upload/upload.php`.
8. Ajusta PHP para aceptar archivos grandes: `upload_max_filesize=128M`, `post_max_size=128M` o más, `max_execution_time=300`, `max_input_time=300`.
9. Comprueba `https://media.ge01.com/_upload/status.php`.
10. Haz un redeploy de Faculta de Derecho y prueba una imagen pequeña primero.

No pongas usuario ni contraseña FTP en Vercel, GitHub ni el navegador. Faculta de Derecho no los necesita.
