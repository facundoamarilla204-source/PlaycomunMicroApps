# Checklist de Publicación (para el dueño del proyecto)

Pasos manuales que se deben realizar la primera vez que se publica el sitio web en Vercel, o cuando se agrega un nuevo dominio.

1. **Subir el código a GitHub** y conectar el repositorio a un nuevo proyecto en Vercel.
2. **Configurar las variables de entorno** en el dashboard de Vercel (Configuración > Environment Variables):
   - `NEXT_PUBLIC_SITE_URL`: `https://playcomun.online` (sin barra al final).
   - `NEXT_PUBLIC_GSC_VERIFICATION`: El código de verificación provisto por Google Search Console (opcional, pero recomendado).
3. **Agregar el dominio `playcomun.online`** en Vercel (Project > Settings > Domains) y apuntar los DNS.
   - Elegir el dominio base (`playcomun.online`) como el canónico.
   - Si se agrega la variante `www`, configurar redirección hacia la variante sin `www`.
4. **Alta en Google Search Console**:
   - Dar de alta la propiedad del dominio o prefijo de URL en GSC.
   - Verificar la propiedad.
   - Enviar la URL del sitemap en el menú Sitemaps: `https://playcomun.online/sitemap.xml`.
5. **Comprobación manual de URLs clave**:
   - Usar la herramienta de Inspección de URLs de Search Console en el Home (`/`) y verificar que se pueda indexar.
   - Utilizar el [Test de resultados enriquecidos de Google](https://search.google.com/test/rich-results) con la URL del Home para verificar el esquema `WebSite` y `Organization`.
6. **Construcción de autoridad externa**:
   - Agregar un link directo desde el menú principal o sección de "Herramientas" en el sitio portfolio (`playcomun.com`) hacia el nuevo hub `playcomun.online`.
7. **Redirecciones estratégicas** [Propuesto]:
   - Si corresponde, configurar la redirección completa del dominio `playcomun.store` hacia `playcomun.com` para unificar tráfico.
8. **Bing Webmaster Tools** (Opcional pero rápido):
   - Iniciar sesión en Bing Webmaster Tools e importar directamente el sitio desde Google Search Console. 

**Mantenimiento rutinario:**
- Cada vez que pases una herramienta de estado `soon` a `live`, asegurate de realizar un nuevo despliegue en Vercel. El sitemap se actualiza automáticamente. No hace falta reenviarlo a Google, el bot pasará periódicamente y lo notará.
