import { NextResponse } from "next/server"

export async function GET() {
  const workerUrl = process.env.NEXT_PUBLIC_CONVERSION_WORKER_URL

  if (!workerUrl) {
    return NextResponse.json({
      configured: false,
      online: false,
      sofficeAvailable: false,
      message:
        "El servicio documental de LibreOffice no está configurado (NEXT_PUBLIC_CONVERSION_WORKER_URL no definida). Las conversiones en el navegador (imágenes, PDF a imágenes, PDF a Word/Excel/PowerPoint) funcionan de forma inmediata.",
    })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${workerUrl.replace(/\/$/, "")}/health`, {
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        configured: true,
        online: true,
        sofficeAvailable: Boolean(data.sofficeAvailable),
        sofficeVersion: data.sofficeVersion,
        activeConversions: data.activeConversions,
      })
    } else {
      return NextResponse.json({
        configured: true,
        online: false,
        sofficeAvailable: false,
        message: `El worker respondió con código de estado ${response.status}`,
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al conectar con el worker"
    return NextResponse.json({
      configured: true,
      online: false,
      sofficeAvailable: false,
      message: `No se pudo conectar con el servicio documental: ${message}`,
    })
  }
}
