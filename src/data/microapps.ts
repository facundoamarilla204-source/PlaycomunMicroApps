export type Microapp = {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  /** Resumen de una línea para superficies compactas (ej. inicio). Si falta, se usa `tagline`. */
  summary?: string
  badge: 'Pro' | 'Nuevo' | 'BETA'
  status: 'active' | 'in_development'
  url: string
  icon: 'AmasiaManga' | 'ChefHat' | 'Calculator' | 'Layers'
  accentColor: string
  category: 'gastronomia' | 'finanzas' | 'operaciones'
  audience: string
  modules: {
    title: string
    description: string
    status: 'disponible' | 'proximamente'
  }[]
  highlights: string[]
}

export const microapps: Microapp[] = [
  {
    id: 'cocina-pro',
    name: 'Amasia',
    slug: 'cocina-pro',
    tagline: 'Gestión gastronómica: recetas, ingredientes, costos y elaboraciones en un solo lugar',
    summary:
      'Organizá tus recetas, calculá costos y gestioná tus elaboraciones gastronómicas desde una aplicación profesional.',
    description:
      'Microapp integral diseñada para cocineros, reposteros y panaderos. Administrá tu biblioteca personal de insumos con historial inmutable de precios, organizá tus recetas con costeo en tiempo real y gestioná formulaciones técnicas.',
    badge: 'Pro',
    status: 'active',
    url: '/cocina-pro',
    icon: 'AmasiaManga',
    accentColor: '#7C3AED',
    category: 'gastronomia',
    audience: 'Cocineros, pasteleros, chocolateros, reposteros y panaderos profesionales',
    modules: [
      {
        title: 'Biblioteca de ingredientes',
        description: 'Catálogo de insumos con precios de compra, envases, densidades y clasificación técnica.',
        status: 'disponible',
      },
      {
        title: 'Historial de precios de insumos',
        description: 'Trazabilidad cronológica inmutable de variación de costos por ingrediente.',
        status: 'disponible',
      },
      {
        title: 'Recetario profesional',
        description: 'Lectura estructurada de recetas, costos de insumos, costos adicionales y márgenes.',
        status: 'disponible',
      },
      {
        title: 'Pasos de elaboración y cronometraje',
        description: 'Instrucciones paso a paso, tiempos de reposo, fermentación y temperaturas de cocción.',
        status: 'disponible',
      },
      {
        title: 'Escalado por molde y porcentaje panadero',
        description: 'Adaptación matemática automática de fórmulas para producción en volumen.',
        status: 'disponible',
      },
      {
        title: 'Control de inventario y stock',
        description: 'Seguimiento de existencias mínimas y alertas de reposición de materias primas.',
        status: 'proximamente',
      },
      {
        title: 'Planificador de producción y pedidos',
        description: 'Organización de lotes de elaboración y cálculo consolidado de insumos.',
        status: 'proximamente',
      },
    ],
    highlights: [
      'Costeo exacto con mermas y densidades',
      'Historial de precios inmutable y auditable',
      'Integrado con tu cuenta PlayComun Pro',
      'Diseñado para uso táctil en cocina u obrador',
    ],
  },
]

export function getMicroappBySlug(slug: string): Microapp | undefined {
  return microapps.find((app) => app.slug === slug)
}

/** Microapps publicadas y navegables. Fuente única para el inicio y el catálogo. */
export function getActiveMicroapps(): Microapp[] {
  return microapps.filter((app) => app.status === 'active')
}
