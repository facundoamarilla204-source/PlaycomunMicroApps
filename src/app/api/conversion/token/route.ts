import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST() {
  const secret = process.env.CONVERSION_WORKER_SECRET || "playcomun-dev-secret-change-in-prod"
  const workerUrl = process.env.NEXT_PUBLIC_CONVERSION_WORKER_URL || ""

  const timestamp = Date.now()
  const token = crypto
    .createHmac("sha256", secret)
    .update(`convert:${timestamp}`)
    .digest("hex")

  return NextResponse.json({
    token,
    timestamp,
    workerUrl,
    configured: Boolean(process.env.NEXT_PUBLIC_CONVERSION_WORKER_URL),
    expiresIn: 300, // 5 minutes in seconds
  })
}
