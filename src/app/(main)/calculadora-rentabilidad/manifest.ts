import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Calculadora de Rentabilidad | PlayComun',
    short_name: 'Rentabilidad',
    description: 'Calculá margen bruto, neto, ROI y markup de tus productos o servicios.',
    start_url: '/calculadora-rentabilidad',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
