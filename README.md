# Pagina Videos ONOFF

Aplicación Next.js para administrar videos `.mp4` de los canales TiendasOn, YaDinero y TryController.

La app sube videos autorizados a Vercel Blob, guarda un manifiesto `videos/manifest.json` y entrega una URL directa `.mp4` para probar nodos `media` en Ikono/Menuflow.

## Variables en Vercel

```env
BLOB_READ_WRITE_TOKEN=...
ADMIN_PASSWORD=una-clave-segura
NEXT_PUBLIC_LIBRARY_TITLE=Videos de Canales ONOFF
```

## Uso

1. Configura Vercel Blob en el proyecto.
2. Abre la página desplegada.
3. Escribe la contraseña admin.
4. Sube un video `.mp4` autorizado.
5. Copia la URL directa o el nodo `media` sugerido.
