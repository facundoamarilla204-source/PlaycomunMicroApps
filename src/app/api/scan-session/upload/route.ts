import { NextRequest, NextResponse } from "next/server"
import { uploadScanPage } from "@/lib/scan-session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uploadToken, dataUrl } = body

    if (!uploadToken || !dataUrl) {
      return NextResponse.json(
        { error: "Se requiere el token de subida y la imagen en base64." },
        { status: 400 }
      )
    }

    const result = await uploadScanPage(uploadToken, dataUrl)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al procesar la captura enviada." },
      { status: 500 }
    )
  }
}
