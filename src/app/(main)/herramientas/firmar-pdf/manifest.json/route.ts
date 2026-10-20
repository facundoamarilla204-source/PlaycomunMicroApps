import { NextResponse } from "next/server"

export async function GET() {
  const manifest = {
    name: "Firmar PDF online · PlayComun Online",
    short_name: "Firmar PDF",
    description:
      "Firmá documentos PDF online gratis: dibujá tu firma, escribí con estilos manuscritos, firmá desde el celular con QR o subí tu firma y logo.",
    start_url: "/herramientas/firmar-pdf",
    scope: "/herramientas/firmar-pdf",
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
