import { NextRequest, NextResponse } from "next/server"
import { pingMobileScanSession } from "@/lib/scan-session"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Falta el token de subida." }, { status: 400 })
    }

    const result = await pingMobileScanSession(token)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al conectar con la sesión de escaneo." },
      { status: 500 }
    )
  }
}
