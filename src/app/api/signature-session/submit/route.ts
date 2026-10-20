import { NextRequest, NextResponse } from "next/server"
import { submitMobileSignature } from "@/lib/signature-session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uploadToken, signatureData, initialsData } = body

    if (!uploadToken || !signatureData) {
      return NextResponse.json(
        { error: "uploadToken y signatureData son requeridos." },
        { status: 400 }
      )
    }

    const result = await submitMobileSignature(uploadToken, signatureData, initialsData)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error procesando el envío de la firma." },
      { status: 500 }
    )
  }
}
