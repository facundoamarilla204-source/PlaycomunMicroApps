import { NextRequest, NextResponse } from "next/server"
import { pingMobileSession } from "@/lib/signature-session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uploadToken } = body
    if (!uploadToken) {
      return NextResponse.json({ error: "uploadToken requerido." }, { status: 400 })
    }

    const result = await pingMobileSession(uploadToken)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 })
  }
}
