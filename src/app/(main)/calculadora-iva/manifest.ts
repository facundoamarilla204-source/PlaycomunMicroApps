import { MetadataRoute } from 'next'
import { tools } from '@/data/tools'
import { siteConfig } from '@/config/site'

export default function manifest(): MetadataRoute.Manifest {
  const tool = tools.find((t) => t.slug === 'calculadora-iva')

  if (!tool) {
    throw new Error('Tool not found')
  }

  return {
    name: tool.name,
    short_name: 'Calc IVA',
    description: tool.seo?.description || tool.description,
    start_url: tool.customUrl || `/herramientas/${tool.slug}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
