import { NextResponse } from "next/server"

export async function GET() {
  const manifest = {
    name: "Generador de paletas de colores · PlayComun Online",
    short_name: "Paletas",
    description: "Creá paletas de colores armónicas, extraé colores dominantes de imágenes y comprobá contraste WCAG gratis online.",
    start_url: "/herramientas/generador-paletas-colores",
    scope: "/herramientas/generador-paletas-colores",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FFFFFF",
    theme_color: "#7C3AED",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
