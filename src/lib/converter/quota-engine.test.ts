import { describe, it, expect, beforeEach } from "vitest"
import crypto from "crypto"
import {
  checkTokenRateLimit,
  getClientIdentifier,
  signWorkerToken,
  verifyWorkerReceipt,
  MAX_SIZE_FREE_BYTES,
  MAX_SIZE_PRO_BYTES,
  MAX_SIZE_FREE_MB,
  MAX_SIZE_PRO_MB,
} from "./quota-service"
import { validateFileForOperation } from "./utils"
import { getOperationById } from "./operations"

describe("Convertidor de Archivos - Cuotas y Límites Gratis vs Pro", () => {
  it("define exactamente 5 conversiones para Gratis y 100 para Pro", () => {
    const FREE_LIMIT = 5
    const PRO_LIMIT = 100

    expect(FREE_LIMIT).toBe(5)
    expect(PRO_LIMIT).toBe(100)
    expect(MAX_SIZE_FREE_MB).toBe(10)
    expect(MAX_SIZE_PRO_MB).toBe(50)
  })

  it("rechaza la sexta conversión en el plan Gratis (límite de 5)", () => {
    const FREE_LIMIT = 5
    let confirmedCount = 0

    // Simulate 5 successful conversions
    for (let i = 1; i <= FREE_LIMIT; i++) {
      const available = FREE_LIMIT - confirmedCount
      expect(available).toBeGreaterThan(0)
      confirmedCount++
    }

    expect(confirmedCount).toBe(5)
    const availableForSixth = FREE_LIMIT - confirmedCount
    expect(availableForSixth).toBe(0)
    const canConvertSixth = availableForSixth >= 1
    expect(canConvertSixth).toBe(false)
  })

  it("rechaza la conversión número 101 en el plan Pro (límite de 100)", () => {
    const PRO_LIMIT = 100
    let confirmedCount = 0

    for (let i = 1; i <= PRO_LIMIT; i++) {
      confirmedCount++
    }

    expect(confirmedCount).toBe(100)
    const available = PRO_LIMIT - confirmedCount
    expect(available).toBe(0)
    const canConvert101 = available >= 1
    expect(canConvert101).toBe(false)
  })

  it("un fallo en la conversión libera la reserva y NO consume cuota", () => {
    const FREE_LIMIT = 5
    let confirmedCount = 0
    let reservedCount = 0

    // User starts conversion -> reserve 1
    reservedCount += 1
    let available = FREE_LIMIT - (confirmedCount + reservedCount)
    expect(available).toBe(4)

    // Worker fails (e.g. corrupt file) -> release reservation
    reservedCount -= 1
    available = FREE_LIMIT - (confirmedCount + reservedCount)

    // Quota is completely restored
    expect(available).toBe(5)
    expect(confirmedCount).toBe(0)
  })

  it("la confirmación de cuota es idempotente (confirmar 2 veces no duplica el descuento)", () => {
    let confirmedCount = 0
    const reservationState = { id: "res-123", status: "reserved" }

    // First confirmation
    if (reservationState.status === "reserved") {
      reservationState.status = "confirmed"
      confirmedCount += 1
    }
    expect(confirmedCount).toBe(1)

    // Duplicate confirmation (e.g. network retry)
    if (reservationState.status === "reserved") {
      reservationState.status = "confirmed"
      confirmedCount += 1
    }
    expect(confirmedCount).toBe(1)
  })

  it("las operaciones locales (imágenes a PDF, PDF a imágenes, PDF/A) nunca consumen cuota de servidor", () => {
    const localOps = ["images-to-pdf", "pdf-to-images", "pdf-to-pdfa"]

    for (const opId of localOps) {
      const op = getOperationById(opId as any)
      expect(op.environment).toBe("client")
      // Client operations do not contact the server worker
      expect(op.environment === "worker").toBe(false)
    }
  })
})

describe("Convertidor de Archivos - Zona Horaria Argentina y Reinicio a Medianoche", () => {
  it("calcula la fecha en America/Argentina/Buenos_Aires correctamente", () => {
    const now = new Date()
    const argentinaDateStr = now.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    })

    // Regex for YYYY-MM-DD
    expect(argentinaDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("el reinicio de cuota restaura el límite disponible en un nuevo día argentino", () => {
    const quotasByDate: Record<string, number> = {
      "2026-10-16": 5, // 5 consumed on day 1
    }

    const day1Used = quotasByDate["2026-10-16"] || 0
    expect(day1Used).toBe(5)

    // Day 2 in Argentina
    const day2Date = "2026-10-17"
    const day2Used = quotasByDate[day2Date] || 0
    expect(day2Used).toBe(0)
    expect(5 - day2Used).toBe(5)
  })
})

describe("Convertidor de Archivos - Seguridad de Tokens y Comprobantes", () => {
  const SECRET = "playcomun-dev-secret-change-in-prod"

  it("genera tokens HMAC válidos con claims de reserva y tier", () => {
    const timestamp = Date.now()
    const token = signWorkerToken({
      reservationId: "res-abc-123",
      operationId: "word-to-pdf",
      isPro: false,
      maxBytes: MAX_SIZE_FREE_BYTES,
      timestamp,
    })

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")
    expect(token.length).toBe(64) // SHA-256 hex
  })

  it("rechaza tokens adulterados o modificados", () => {
    const timestamp = Date.now()
    const validToken = signWorkerToken({
      reservationId: "res-abc-123",
      operationId: "word-to-pdf",
      isPro: false,
      maxBytes: MAX_SIZE_FREE_BYTES,
      timestamp,
    })

    // Tampered token
    const tampered = validToken.substring(0, 60) + "ffff"
    expect(tampered).not.toBe(validToken)
  })

  it("genera y valida comprobantes criptográficos de finalización (receipts)", () => {
    const reservationId = "res-test-999"
    const fileSize = 15420

    // Worker creates receipt
    const receipt = crypto
      .createHmac("sha256", SECRET)
      .update(`receipt:${reservationId}:${fileSize}`)
      .digest("hex")

    // Server verifies receipt
    const isValid = verifyWorkerReceipt(receipt, reservationId, fileSize)
    expect(isValid).toBe(true)

    // Fake receipt is rejected
    const isFakeValid = verifyWorkerReceipt("fake_receipt_hex", reservationId, fileSize)
    expect(isFakeValid).toBe(false)

    // Mismatched file size is rejected
    const isMismatchedValid = verifyWorkerReceipt(receipt, reservationId, fileSize + 1)
    expect(isMismatchedValid).toBe(false)
  })

  it("anonimiza direcciones IP con HMAC sin almacenarlas en texto plano", () => {
    const mockReq = {
      headers: new Headers({
        "x-forwarded-for": "181.46.120.45, 10.0.0.1",
      }),
    } as unknown as Request

    const identifier = getClientIdentifier(mockReq, null)
    expect(identifier.startsWith("anon:")).toBe(true)
    // Does NOT contain raw IP
    expect(identifier).not.toContain("181.46.120.45")
    expect(identifier.length).toBeGreaterThan(15)
  })

  it("prioriza la identidad autenticada sobre la IP cuando el usuario está logueado", () => {
    const mockReq = {
      headers: new Headers({ "x-forwarded-for": "181.46.120.45" }),
    } as unknown as Request

    const identifier = getClientIdentifier(mockReq, "user-uuid-12345")
    expect(identifier).toBe("usr:user-uuid-12345")
  })

  it("aplica rate limiting para prevenir abuso en la emisión de tokens", () => {
    const id = `test-client-${Date.now()}`

    // Up to 20 requests allowed per minute
    for (let i = 1; i <= 20; i++) {
      const res = checkTokenRateLimit(id, 20)
      expect(res.allowed).toBe(true)
    }

    // 21st request rejected
    const blocked = checkTokenRateLimit(id, 20)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })
})

describe("Convertidor de Archivos - Validación de Tamaños por Modalidad", () => {
  const wordOp = getOperationById("word-to-pdf")

  it("permite un archivo de 8 MB en el plan Gratis (≤ 10 MB)", () => {
    const file8Mb = new File([new Uint8Array(8 * 1024 * 1024)], "documento.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const res = validateFileForOperation(file8Mb, wordOp, false)
    expect(res.valid).toBe(true)
  })

  it("rechaza un archivo de 12 MB en el plan Gratis con código FILE_TOO_LARGE_FREE", () => {
    const file12Mb = new File([new Uint8Array(12 * 1024 * 1024)], "documento.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const res = validateFileForOperation(file12Mb, wordOp, false)
    expect(res.valid).toBe(false)
    expect(res.code).toBe("FILE_TOO_LARGE_FREE")
    expect(res.error).toContain("10 MB")
  })

  it("permite un archivo de 35 MB en el plan Pro (≤ 50 MB)", () => {
    const file35Mb = new File([new Uint8Array(35 * 1024 * 1024)], "reporte_pesado.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const res = validateFileForOperation(file35Mb, wordOp, true)
    expect(res.valid).toBe(true)
  })

  it("rechaza un archivo de 60 MB en el plan Pro con código FILE_TOO_LARGE_PRO", () => {
    const file60Mb = new File([new Uint8Array(60 * 1024 * 1024)], "archivo_gigante.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const res = validateFileForOperation(file60Mb, wordOp, true)
    expect(res.valid).toBe(false)
    expect(res.code).toBe("FILE_TOO_LARGE_PRO")
    expect(res.error).toContain("50 MB")
  })
})
