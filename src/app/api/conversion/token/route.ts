import { NextResponse } from "next/server"
import {
  getClientIdentifier,
  resolveUserProStatus,
  checkTokenRateLimit,
  reserveQuota,
  signWorkerToken,
  MAX_SIZE_FREE_BYTES,
  MAX_SIZE_PRO_BYTES,
  MAX_SIZE_FREE_MB,
  MAX_SIZE_PRO_MB,
} from "@/lib/converter/quota-service"

export async function POST(req: Request) {
  try {
    const { userId, isPro } = await resolveUserProStatus()
    const identifier = getClientIdentifier(req, userId)

    // 1. Rate limiting check (independent of quota)
    const rateLimit = checkTokenRateLimit(identifier, 20)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Demasiadas solicitudes en poco tiempo. Por favor aguardá unos instantes.",
          code: "RATE_LIMITED",
        },
        { status: 429 }
      )
    }

    // 2. Parse request body
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body optional or empty
    }

    const operationId = body.operationId || "word-to-pdf"
    const fileCount = Math.max(1, parseInt(body.fileCount || "1", 10))
    const fileSizeBytes = parseInt(body.fileSizeBytes || "0", 10)

    // 3. Strict size limit verification based on tier
    const maxAllowedBytes = isPro ? MAX_SIZE_PRO_BYTES : MAX_SIZE_FREE_BYTES
    if (fileSizeBytes > maxAllowedBytes) {
      return NextResponse.json(
        {
          error: isPro
            ? `El archivo excede el límite técnico de ${MAX_SIZE_PRO_MB} MB admitido para documentos de oficina.`
            : `El plan Gratuito admite documentos de oficina de hasta ${MAX_SIZE_FREE_MB} MB. Pasate a Pro para convertir archivos de hasta ${MAX_SIZE_PRO_MB} MB.`,
          code: isPro ? "FILE_TOO_LARGE_PRO" : "FILE_TOO_LARGE_FREE",
        },
        { status: 400 }
      )
    }

    // 4. Atomic quota reservation in Supabase
    const reservation = await reserveQuota({
      identifier,
      isPro,
      operationId,
      fileCount,
      fileSizeBytes,
    })

    if (!reservation.success) {
      return NextResponse.json(
        {
          error: isPro
            ? "Has alcanzado el límite diario de 100 conversiones Pro para documentos de oficina. Tu cuota se reinicia a las 00:00 (hora argentina)."
            : "Has alcanzado el límite gratuito de 5 conversiones de oficina de hoy. Se reinicia a las 00:00 (hora argentina) o podés pasarte a Pro para obtener 100 conversiones diarias.",
          code: "QUOTA_EXCEEDED",
          quota: reservation.quota,
        },
        { status: 429 }
      )
    }

    // 5. Generate signed authorization token for worker
    const timestamp = Date.now()
    const workerUrl = process.env.NEXT_PUBLIC_CONVERSION_WORKER_URL || ""
    const reservationId = reservation.reservationId!

    const token = signWorkerToken({
      reservationId,
      operationId,
      isPro,
      maxBytes: maxAllowedBytes,
      timestamp,
    })

    return NextResponse.json({
      token,
      reservationId,
      timestamp,
      workerUrl,
      configured: Boolean(process.env.NEXT_PUBLIC_CONVERSION_WORKER_URL),
      expiresIn: 300, // 5 minutes
      isPro,
      maxBytes: maxAllowedBytes,
      quota: reservation.quota,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno del servidor"
    console.error("Error in /api/conversion/token:", err)
    return NextResponse.json(
      { error: `Error al autorizar conversión: ${message}` },
      { status: 500 }
    )
  }
}
