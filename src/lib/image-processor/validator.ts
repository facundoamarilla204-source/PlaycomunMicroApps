import { SupportedFormat } from "./types"

export interface MagicNumberValidation {
  isValid: boolean
  detectedFormat?: SupportedFormat
  error?: string
}

/**
 * Checks magic bytes of an ArrayBuffer or Blob to verify true image format.
 */
export async function validateImageMagicBytes(
  blobOrBuffer: Blob | ArrayBuffer
): Promise<MagicNumberValidation> {
  const buffer =
    blobOrBuffer instanceof ArrayBuffer
      ? blobOrBuffer
      : await blobOrBuffer.slice(0, 16).arrayBuffer()

  const bytes = new Uint8Array(buffer)

  if (bytes.length < 4) {
    return { isValid: false, error: "Archivo demasiado pequeño o corrupto" }
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { isValid: true, detectedFormat: "jpeg" }
  }

  // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { isValid: true, detectedFormat: "png" }
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12
  ) {
    const isWebP =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    if (isWebP) {
      return { isValid: true, detectedFormat: "webp" }
    }
  }

  return {
    isValid: false,
    error: "El formato no corresponde a una imagen válida (JPG, PNG o WebP)",
  }
}

/**
 * Verifies that the encoded blob strictly matches the expected format signature.
 */
export async function verifyEncodedFormat(
  blob: Blob,
  expectedFormat: SupportedFormat
): Promise<{ matches: boolean; detected?: SupportedFormat; error?: string }> {
  const validation = await validateImageMagicBytes(blob)
  if (!validation.isValid || !validation.detectedFormat) {
    return {
      matches: false,
      error: validation.error || "No se pudo validar el archivo codificado",
    }
  }

  if (validation.detectedFormat !== expectedFormat) {
    return {
      matches: false,
      detected: validation.detectedFormat,
      error: `La codificación generó ${validation.detectedFormat.toUpperCase()} en lugar de ${expectedFormat.toUpperCase()}`,
    }
  }

  return { matches: true, detected: validation.detectedFormat }
}

/**
 * Safe bounds checking for browser canvas memory
 */
export const MAX_SAFE_PIXELS = 4096 * 4096 // ~16.7 megapixels is completely safe on mobile
export const ABSOLUTE_MAX_PIXELS = 8192 * 8192 // 67 MP
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
export const MAX_BATCH_FILES = 30

export function validateImageFileInitial(file: File): { ok: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: "El archivo supera el límite máximo de 50 MB por imagen",
    }
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(file.name)
  
  if (!validTypes.includes(file.type.toLowerCase()) && !hasValidExt) {
    return {
      ok: false,
      error: "Formato no compatible. Solo se admiten JPG, PNG y WebP",
    }
  }

  return { ok: true }
}
