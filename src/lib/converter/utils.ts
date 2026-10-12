import JSZip from "jszip"
import { ConversionOperation } from "./types"

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\u00C0-\u017F.-]/g, "_")
}

export function getFilenameWithoutExtension(name: string): string {
  const lastDotIndex = name.lastIndexOf(".")
  if (lastDotIndex === -1) return name
  return name.substring(0, lastDotIndex)
}

export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim() || rangeStr.toLowerCase() === "all" || rangeStr.toLowerCase() === "todas") {
    return Array.from({ length: maxPages }, (_, i) => i + 1)
  }

  const pagesSet = new Set<number>()
  const parts = rangeStr.split(",")

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-")
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        for (let p = start; p <= Math.min(end, maxPages); p++) {
          pagesSet.add(p)
        }
      }
    } else {
      const p = parseInt(trimmed, 10)
      if (!isNaN(p) && p > 0 && p <= maxPages) {
        pagesSet.add(p)
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b)
  return result.length > 0 ? result : Array.from({ length: maxPages }, (_, i) => i + 1)
}

export async function createZipFromFiles(
  files: { name: string; blob: Blob }[]
): Promise<Blob> {
  const zip = new JSZip()
  for (const item of files) {
    zip.file(item.name, item.blob)
  }
  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = sanitizeFilename(filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function validateFileForOperation(
  file: File,
  op: ConversionOperation
): { valid: boolean; error?: string } {
  const ext = `.${file.name.split(".").pop()?.toLowerCase()}`
  
  if (!op.acceptedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `El archivo "${file.name}" tiene una extensión no admitida (${ext}). Se requiere: ${op.acceptedExtensions.join(", ")}.`,
    }
  }

  // Max size limits: 25 MB for worker office docs, 50 MB for client local processing
  const maxBytes = op.environment === "worker" ? 25 * 1024 * 1024 : 50 * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de ${op.environment === "worker" ? "25 MB" : "50 MB"}.`,
    }
  }

  return { valid: true }
}
