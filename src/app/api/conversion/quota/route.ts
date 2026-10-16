import { NextResponse } from "next/server"
import {
  getClientIdentifier,
  resolveUserProStatus,
  fetchQuotaStatus,
} from "@/lib/converter/quota-service"

export async function GET(req: Request) {
  try {
    const { userId, isPro } = await resolveUserProStatus()
    const identifier = getClientIdentifier(req, userId)

    const quota = await fetchQuotaStatus(identifier, isPro)
    return NextResponse.json(quota)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json(
      { error: `Error al consultar cuota: ${msg}` },
      { status: 500 }
    )
  }
}
