import { NextRequest, NextResponse } from "next/server"
import { createSignatureSession } from "@/lib/signature-session"
import { siteConfig } from "@/config/site"

export async function POST(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin || siteConfig.url
    const session = await createSignatureSession(origin)
    return NextResponse.json(session)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al crear la sesión de firma." },
      { status: 500 }
    )
  }
}
