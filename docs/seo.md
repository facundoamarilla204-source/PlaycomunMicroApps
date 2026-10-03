# SEO y Metadatos en PlaycomunMicroApps

Este documento explica cómo está configurado el SEO técnico del proyecto y cuál es el procedimiento para que cada microapp nueva quede optimizada.

## 1. Configuración general
Toda la información base del sitio (nombre, descripción, URL, redes sociales) está en `src/config/site.ts`.
Si la URL cambia, basta con actualizar la variable de entorno `NEXT_PUBLIC_SITE_URL` en Vercel.

## 2. Archivos autogenerados
- **`sitemap.xml`**: Se genera automáticamente desde `src/app/sitemap.ts`. Solo incluye el home, la lista de herramientas, planes y las herramientas que tengan `status: 'live'`.
- **`robots.txt`**: Bloquea rutas privadas (`/cuenta`, `/ingresar`, etc.) y entornos que no son producción.

## 3. Procedimiento para una nueva herramienta

Agregar una herramienta nueva es un proceso iterativo. Cuando crees la herramienta por primera vez, mantenela con `status: 'soon'` para que no se indexe todavía.

### Paso 1: Configurar los datos (`src/data/tools.ts`)
```ts
{
  slug: "nombre-de-la-herramienta",
  name: "Nombre Visual",
  // ...otros campos básicos
  status: "soon", // IMPORTANTE: dejar en soon hasta terminar
  updatedAt: new Date().toISOString(), // Usar siempre ISO string
  seo: {
    title: "Título SEO corto y atractivo (hasta 60 chars)",
    description: "Descripción persuasiva para Google (hasta 155 chars).",
    h1: "Título principal de la página (H1)",
    intro: "Uno o dos párrafos cortos que van abajo del H1.",
    keywords: ["palabra1", "palabra2"] // Opcional, uso interno
  },
  faqs: [
    { question: "¿Pregunta 1?", answer: "Respuesta 1." },
    // ...
  ],
  related: ["slug-herramienta-1", "slug-herramienta-2"] // Opcional
}
```

**Reglas de oro para SEO:**
- `title`: Que incluya la palabra clave principal al inicio. Evitá pasarte de 60 caracteres.
- `description`: Que invite a hacer clic (hasta 155 caracteres).
- No uses `next/head` ni metas manuales en la página.

### Paso 2: Usar la plantilla en la página de la herramienta (`src/app/[slug]/page.tsx`)
La ruta `[slug]/page.tsx` ya se encarga automáticamente de:
1. Buscar los datos en `tools.ts`.
2. Generar todos los metadatos (OG, Twitter, Canonical) usando `buildMetadata`.
3. Renderizar el `ToolPageLayout` (migas de pan, H1, intro, FAQs, relacionadas).
4. Generar el `JsonLd` dinámico (schema.org).

Si la herramienta está `status: 'live'`, se renderizará el componente de la herramienta en el medio. Si es `soon`, se muestra la pantalla de "En construcción" (con `noindex`).

### Paso 3: Lanzamiento (Pasar a Live)
Cuando la herramienta esté terminada y probada:
1. Cambiá `status: 'live'` en `src/data/tools.ts`.
2. Actualizá `updatedAt` con la fecha de hoy.
3. Asegurate de que los campos `seo` están completos y optimizados.

Con este simple cambio, la herramienta:
- Entra automáticamente en el `sitemap.xml`.
- Pierde la etiqueta `noindex` para que Google la rastree.
- Genera su imagen Open Graph dinámica.
- Genera su marcado de datos estructurados (Application).

## 4. Rendimiento (Core Web Vitals)
- Mantener las imágenes optimizadas (usar siempre `next/image`).
- Minimizar el código del cliente (`"use client"` solo donde hay interactividad).
- Evitar cargar librerías pesadas en el layout global.
