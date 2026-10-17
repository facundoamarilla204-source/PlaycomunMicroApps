# PlaycomunMicroApps

Este proyecto es el hub de herramientas web pequeñas para **PlayComun**.

## Cómo correr el proyecto

Para iniciar el servidor de desarrollo, ejecutá:

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador para ver el resultado.

## Verificación y Calidad Obligatoria Antes de Publicar

Para garantizar la estabilidad del hub y prevenir errores de tipado o regresiones en producción, es **estrictamente obligatorio** ejecutar y superar sin errores los siguientes scripts antes de publicar o desplegar cambios:

```bash
# 1. Verificación estricta de tipos TypeScript
npm run typecheck

# 2. Análisis estático y reglas de código
npm run lint

# 3. Batería completa de pruebas unitarias e integrales
npm run vitest

# 4. Compilación del bundle de producción
npm run build
```

> **Nota:** Todos los comandos deben terminar con código de salida `0` (sin errores).


## Estructura de carpetas

```text
src/
├── app/                  # Rutas de la aplicación (App Router)
│   ├── [slug]/           # Rutas dinámicas para cada herramienta
│   ├── herramientas/     # Listado completo con filtros
│   ├── (otras rutas)/    # Placeholders como planes, contacto, etc.
│   ├── globals.css       # Estilos globales y tokens de Tailwind v4
│   ├── layout.tsx        # Layout principal (Header y Footer)
│   └── page.tsx          # Home page
├── components/           # Componentes de la interfaz
│   ├── home/             # Componentes específicos del Home (Hero, TrustStrip, etc.)
│   ├── layout/           # Componentes de layout (SiteHeader, SiteFooter, etc.)
│   └── tools/            # Componentes de las herramientas (ToolCard, FavoriteButton)
├── config/               # Configuración global
│   └── site.ts           # Información del sitio, URL, redes, etc.
└── data/                 # Datos estáticos y lógicas de acceso
    ├── categories.ts     # Cálculo dinámico de categorías
    └── tools.ts          # Fuente única de la verdad de las herramientas
```

## Cómo agregar una herramienta

1. Abrí el archivo `src/data/tools.ts`.
2. Agregá un nuevo objeto a la lista `tools` respetando el tipo `Tool`:

```typescript
{
  slug: "nombre-de-ruta",
  name: "Nombre visible",
  description: "Descripción breve en una o dos líneas.",
  category: "calculadoras", // o "generadores" o "utilidades"
  icon: "Calculator", // Nombre del ícono de Lucide
  tier: "free", // o "pro"
  status: "soon", // o "live"
  featured: true, // Si es true, aparecerá en el home por defecto
  keywords: ["palabra", "clave"],
}
```

¡Y listo! La herramienta aparecerá automáticamente en el home, en los filtros, sumará al contador de su respectiva categoría, y su ruta `/[slug]` empezará a mostrar la pantalla "En construcción".
