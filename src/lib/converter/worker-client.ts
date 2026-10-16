import {
  WorkerHealthState,
  ConversionQuotaState,
  ExcelToPdfOptions,
  ConversionOperationId,
} from "./types"

export async function checkWorkerHealth(): Promise<WorkerHealthState> {
  try {
    const res = await fetch("/api/conversion/health", { cache: "no-store" })
    if (!res.ok) {
      return {
        configured: false,
        online: false,
        checkedAt: Date.now(),
        message: "No se pudo consultar el estado del servicio documental.",
      }
    }
    const data = await res.json()
    return {
      configured: Boolean(data.configured),
      online: Boolean(data.online),
      sofficeAvailable: Boolean(data.sofficeAvailable),
      sofficeVersion: data.sofficeVersion,
      message: data.message,
      checkedAt: Date.now(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de red"
    return {
      configured: false,
      online: false,
      checkedAt: Date.now(),
      message: `Error al comprobar servicio documental: ${message}`,
    }
  }
}

export async function fetchCurrentQuota(): Promise<ConversionQuotaState | null> {
  try {
    const res = await fetch("/api/conversion/quota", { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as ConversionQuotaState
  } catch {
    return null
  }
}

export interface WorkerConversionOptions {
  operationId?: ConversionOperationId
  excelToPdf?: ExcelToPdfOptions
}

export interface WorkerConversionResult {
  blob: Blob
  quota?: ConversionQuotaState
}

export class QuotaExceededError extends Error {
  code = "QUOTA_EXCEEDED"
  quota?: ConversionQuotaState
  constructor(message: string, quota?: ConversionQuotaState) {
    super(message)
    this.name = "QuotaExceededError"
    this.quota = quota
  }
}

export class FileTooLargeError extends Error {
  code: "FILE_TOO_LARGE_FREE" | "FILE_TOO_LARGE_PRO"
  constructor(message: string, code: "FILE_TOO_LARGE_FREE" | "FILE_TOO_LARGE_PRO") {
    super(message)
    this.name = "FileTooLargeError"
    this.code = code
  }
}

export async function convertOfficeDocumentWithWorker(
  file: File,
  onProgress?: (percent: number) => void,
  options?: WorkerConversionOptions
): Promise<WorkerConversionResult> {
  // 1. Request signed authorization token and atomic quota reservation
  const tokenRes = await fetch("/api/conversion/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationId: options?.operationId || "word-to-pdf",
      fileCount: 1,
      fileSizeBytes: file.size,
    }),
  })

  if (!tokenRes.ok) {
    let errJson: any = {}
    try {
      errJson = await tokenRes.json()
    } catch {
      // not json
    }

    if (errJson.code === "QUOTA_EXCEEDED") {
      throw new QuotaExceededError(
        errJson.error || "Has alcanzado el límite de conversiones de documentos Office.",
        errJson.quota
      )
    }

    if (errJson.code === "FILE_TOO_LARGE_FREE" || errJson.code === "FILE_TOO_LARGE_PRO") {
      throw new FileTooLargeError(errJson.error, errJson.code)
    }

    throw new Error(
      errJson.error || "No se pudo obtener la autorización para el servicio documental."
    )
  }

  const tokenData = await tokenRes.json()
  const {
    token,
    timestamp,
    reservationId,
    workerUrl,
    configured,
    isPro,
    maxBytes,
  } = tokenData

  if (!configured || !workerUrl) {
    throw new Error(
      "El servicio documental de conversión (LibreOffice Worker) aún no está desplegado o configurado en este entorno. Las conversiones locales de PDF e imágenes se encuentran 100% operativas."
    )
  }

  // 2. Prepare FormData with the file
  const formData = new FormData()
  formData.append("file", file, file.name)

  if (onProgress) {
    onProgress(15)
  }

  // 3. Upload directly to worker with signed authorization and reservation headers
  const uploadUrl = `${workerUrl.replace(/\/$/, "")}/convert`
  let response: Response

  try {
    response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-conversion-signature": token,
        "x-conversion-timestamp": String(timestamp),
        "x-conversion-reservation-id": reservationId,
        "x-conversion-operation": options?.operationId || "word-to-pdf",
        "x-conversion-pro": String(Boolean(isPro)),
        "x-conversion-max-bytes": String(maxBytes || 0),
        "x-conversion-options": JSON.stringify(options?.excelToPdf || {}),
      },
      body: formData,
    })
  } catch (netErr: unknown) {
    // If worker connection drops, release reservation immediately so quota is NOT consumed
    await fetch("/api/conversion/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    }).catch(() => {})

    throw new Error(
      netErr instanceof Error
        ? `Error de red al conectar con el servicio documental: ${netErr.message}`
        : "No se pudo conectar con el servicio documental de conversión."
    )
  }

  if (onProgress) {
    onProgress(75)
  }

  // 4. Handle worker response errors (release reservation so failed conversion is NOT charged)
  if (!response.ok) {
    await fetch("/api/conversion/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    }).catch(() => {})

    let errorMessage = `El servicio documental respondió con error (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.error) {
        errorMessage = errJson.error
      }
    } catch {
      // not json
    }
    throw new Error(errorMessage)
  }

  // 5. Read receipt from response headers
  const receipt = response.headers.get("x-conversion-receipt")
  const fileSizeHeader = response.headers.get("x-conversion-file-size")
  const resultBlob = await response.blob()

  let updatedQuota: ConversionQuotaState | undefined

  // 6. Confirm reservation with cryptographic receipt
  if (receipt && reservationId) {
    try {
      const confirmRes = await fetch("/api/conversion/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          receipt,
          fileSize: fileSizeHeader || String(resultBlob.size),
        }),
      })

      if (confirmRes.ok) {
        const confirmData = await confirmRes.json()
        updatedQuota = confirmData.quota
      }
    } catch (confErr) {
      console.warn("No se pudo enviar confirmación inmediata de cuota:", confErr)
    }
  }

  if (onProgress) {
    onProgress(100)
  }

  return { blob: resultBlob, quota: updatedQuota }
}
