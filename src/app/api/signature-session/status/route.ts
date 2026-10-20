import { NextRequest, NextResponse } from "next/server"
import { getSessionStatus } from "@/lib/signature-session"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Parámetro token requerido." }, { status: 400 })
  }

  const result = await getSessionStatus(token)
  return NextResponse.json(result)
}
