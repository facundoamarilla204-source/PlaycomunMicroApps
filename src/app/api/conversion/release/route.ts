import { NextResponse } from "next/server"
import { releaseQuota } from "@/lib/converter/quota-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { reservationId } = body

    if (!reservationId) {
      return NextResponse.json(
        { error: "Falta el identificador de reserva (reservationId)." },
        { status: 400 }
      )
    }

    const result = await releaseQuota(reservationId)
    return NextResponse.json({
      success: result.success,
      quota: result.quota,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json(
      { error: `Error al liberar reserva: ${msg}` },
      { status: 500 }
    )
  }
}
