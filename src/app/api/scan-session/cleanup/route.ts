import { NextRequest, NextResponse } from "next/server"
import { cleanupScanSession } from "@/lib/scan-session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionToken } = body

    if (sessionToken) {
      await cleanupScanSession(sessionToken)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al limpiar la sesión." },
      { status: 500 }
    )
  }
}
