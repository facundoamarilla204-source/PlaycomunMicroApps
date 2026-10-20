import { NextRequest, NextResponse } from "next/server"
import { cancelSignatureSession } from "@/lib/signature-session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionToken } = body
    if (sessionToken) {
      await cancelSignatureSession(sessionToken)
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }
}
