import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'Amasia · PlayComun Online',
    short_name: 'Amasia',
    description:
      'Gestión gastronómica profesional: recetas, ingredientes, costos y elaboraciones en un solo lugar.',
    start_url: '/cocina-pro',
    scope: '/cocina-pro',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFFFFF',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/amasia/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/amasia/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
