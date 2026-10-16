import { NextResponse } from "next/server"
import {
  confirmQuota,
  verifyWorkerReceipt,
} from "@/lib/converter/quota-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { reservationId, receipt, fileSize } = body

    if (!reservationId || !receipt) {
      return NextResponse.json(
        { error: "Faltan parámetros de confirmación requeridos (reservationId, receipt)." },
        { status: 400 }
      )
    }

    const sizeNum = parseInt(fileSize || "0", 10)

    // 1. Verify cryptographic worker completion receipt
    const isValid = verifyWorkerReceipt(receipt, reservationId, sizeNum)
    if (!isValid) {
      return NextResponse.json(
        { error: "Comprobante criptográfico de conversión inválido o adulterado." },
        { status: 403 }
      )
    }

    // 2. Confirm reservation in Supabase idempotently
    const result = await confirmQuota(reservationId, sizeNum)
    if (!result.success) {
      return NextResponse.json(
        { error: "No se pudo confirmar la cuota para esta operación." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quota: result.quota,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json(
      { error: `Error al confirmar conversión: ${msg}` },
      { status: 500 }
    )
  }
}
