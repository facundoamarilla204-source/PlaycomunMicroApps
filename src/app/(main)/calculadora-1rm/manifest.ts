import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Calculadora de 1RM | PlayComun',
    short_name: 'Calc 1RM',
    description: 'Calculá tu repetición máxima (1RM) y obtené tus porcentajes de entrenamiento.',
    start_url: '/calculadora-1rm',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
