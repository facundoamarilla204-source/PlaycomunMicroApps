import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Link de Reseñas Google | PlayComun',
    short_name: 'Link Reseñas',
    description: 'Generá el enlace directo para que tus clientes dejen una reseña en Google Maps.',
    start_url: '/link-resenas-google',
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
