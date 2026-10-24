import { NextRequest, NextResponse } from "next/server"
import { getScanSessionStatus } from "@/lib/scan-session"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Falta el token de sesión." }, { status: 400 })
    }

    const result = await getScanSessionStatus(token)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al verificar el estado de la sesión." },
      { status: 500 }
    )
  }
}
