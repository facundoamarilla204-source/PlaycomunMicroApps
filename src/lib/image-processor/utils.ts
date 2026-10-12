import { ImageItem, SupportedFormat } from "./types"

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  if (bytes < 0) return `-${formatBytes(Math.abs(bytes), decimals)}`
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const safeI = Math.min(i, sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`
}

export function formatPercentDiff(percentDiff: number): { text: string; isPositive: boolean; isZero: boolean } {
  const rounded = Math.round(percentDiff * 10) / 10
  if (Math.abs(rounded) < 0.1) {
    return { text: "0%", isPositive: false, isZero: true }
  }
  if (rounded < 0) {
    return { text: `${rounded}%`, isPositive: false, isZero: false } // e.g. -45.2% (saving)
  }
  return { text: `+${rounded}%`, isPositive: true, isZero: false } // e.g. +12% (increase)
}

export function getMimeTypeForFormat(format: SupportedFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
    default:
      return "image/jpeg"
  }
}

export function getFormatFromMime(mime: string): SupportedFormat | "desconocido" {
  const normalized = mime.toLowerCase()
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpeg"
  if (normalized.includes("png")) return "png"
  if (normalized.includes("webp")) return "webp"
  return "desconocido"
}

export function getExtensionForFormat(format: SupportedFormat): string {
  switch (format) {
    case "jpeg":
      return "jpg"
    case "png":
      return "png"
    case "webp":
      return "webp"
  }
}

export function getFormatBadgeLabel(format: string): string {
  switch (format.toLowerCase()) {
    case "jpeg":
    case "jpg":
    case "image/jpeg":
      return "JPG"
    case "png":
    case "image/png":
      return "PNG"
    case "webp":
    case "image/webp":
      return "WebP"
    default:
      return format.toUpperCase()
  }
}

export function sanitizeOutputFileName(
  originalName: string,
  targetFormat: SupportedFormat
): { fileName: string; extension: string } {
  // Strip extension
  const lastDot = originalName.lastIndexOf(".")
  const baseName = (lastDot > 0 ? originalName.substring(0, lastDot) : originalName).trim()
  
  // Clean special characters but keep recognizable name
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_\-\u00C0-\u017F\s]/g, "").trim() || "imagen"
  const ext = getExtensionForFormat(targetFormat)
  return {
    fileName: `${cleanBase}.${ext}`,
    extension: ext,
  }
}

export function revokeObjectUrl(url?: string): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // Ignore cleanup error
    }
  }
}

export function revokeItemUrls(item: ImageItem): void {
  revokeObjectUrl(item.previewUrl)
  if (item.result?.downloadUrl) {
    revokeObjectUrl(item.result.downloadUrl)
  }
}
