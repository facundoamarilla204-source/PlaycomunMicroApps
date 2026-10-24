import { NextRequest, NextResponse } from "next/server"
import { createScanSession } from "@/lib/scan-session"
import { siteConfig } from "@/config/site"

export async function POST(req: NextRequest) {
  try {
    let customOrigin: string | undefined

    try {
      const body = await req.json().catch(() => ({}))
      if (body && typeof body.customOrigin === "string" && body.customOrigin.trim()) {
        customOrigin = body.customOrigin.trim()
      }
    } catch {}

    const reqOrigin = req.nextUrl.origin || req.headers.get("origin") || siteConfig.url
    const targetOrigin = customOrigin || reqOrigin

    const session = await createScanSession(targetOrigin)
    return NextResponse.json(session)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al crear la sesión de escaneo." },
      { status: 500 }
    )
  }
}

