import { WorkerHealthState } from "./types"

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

export async function convertOfficeDocumentWithWorker(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  // 1. Request signed token from Next.js server
  const tokenRes = await fetch("/api/conversion/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!tokenRes.ok) {
    throw new Error(
      "No se pudo obtener la autorización de seguridad para el servicio documental."
    )
  }

  const tokenData = await tokenRes.json()
  const { token, timestamp, workerUrl, configured } = tokenData

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

  // 3. Upload directly to worker with signed authorization headers
  const uploadUrl = `${workerUrl.replace(/\/$/, "")}/convert`

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "x-conversion-signature": token,
      "x-conversion-timestamp": String(timestamp),
    },
    body: formData,
  })

  if (onProgress) {
    onProgress(75)
  }

  if (!response.ok) {
    let errorMessage = `El servicio documental respondió con error (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.error) {
        errorMessage = errJson.error
      }
    } catch {
      // response is not json
    }
    throw new Error(errorMessage)
  }

  const resultBlob = await response.blob()

  if (onProgress) {
    onProgress(100)
  }

  return resultBlob
}
