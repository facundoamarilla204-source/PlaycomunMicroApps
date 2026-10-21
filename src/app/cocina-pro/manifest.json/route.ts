import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'Cocina Pro · PlayComun Online',
    short_name: 'Cocina Pro',
    description:
      'Gestión gastronómica profesional: biblioteca de ingredientes con historial de precios, costeo técnico y recetario.',
    start_url: '/cocina-pro',
    scope: '/cocina-pro',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFFFFF',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192 512x512',
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
