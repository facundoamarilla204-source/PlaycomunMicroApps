import imageCompression from "browser-image-compression"
import {
  ImageItem,
  ProcessingConfig,
  ProcessResult,
  SupportedFormat,
} from "./types"
import {
  getFormatFromMime,
  getMimeTypeForFormat,
  sanitizeOutputFileName,
} from "./utils"
import {
  ABSOLUTE_MAX_PIXELS,
  verifyEncodedFormat,
} from "./validator"

/**
 * Loads an image file and extracts its natural dimensions and transparency flag.
 */
export async function inspectAndLoadImage(file: File): Promise<{
  width: number
  height: number
  hasTransparency: boolean
  format: SupportedFormat | "desconocido"
}> {
  const format = getFormatFromMime(file.type || file.name)
  const tempUrl = URL.createObjectURL(file)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("No se pudo decodificar la imagen"))
      el.src = tempUrl
    })

    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height

    if (!width || !height) {
      throw new Error("Dimensiones de imagen inválidas")
    }

    if (width * height > ABSOLUTE_MAX_PIXELS) {
      throw new Error(
        `La imagen supera el límite máximo seguro (${width}x${height} px). Podría agotar la memoria del navegador.`
      )
    }

    // Check transparency for PNG and WebP
    let hasTransparency = false
    if (format === "png" || format === "webp") {
      hasTransparency = await checkImageHasTransparency(img, width, height)
    }

    return { width, height, hasTransparency, format }
  } finally {
    URL.revokeObjectURL(tempUrl)
  }
}

/**
 * Quick sample test to check if an image contains transparent pixels.
 */
async function checkImageHasTransparency(
  img: HTMLImageElement,
  w: number,
  h: number
): Promise<boolean> {
  try {
    const sampleW = Math.min(w, 80)
    const sampleH = Math.min(h, 80)
    const canvas = document.createElement("canvas")
    canvas.width = sampleW
    canvas.height = sampleH
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return false

    ctx.drawImage(img, 0, 0, sampleW, sampleH)
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data

    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] < 250) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Determines target format based on operation and user choice
 */
export function resolveTargetFormat(
  item: ImageItem,
  config: ProcessingConfig
): SupportedFormat {
  if (config.operation === "compress") {
    if (item.originalFormat !== "desconocido") {
      return item.originalFormat
    }
    return "jpeg"
  }

  if (config.targetFormat === "original") {
    if (item.originalFormat !== "desconocido") {
      return item.originalFormat
    }
    return "jpeg"
  }

  return config.targetFormat
}

/**
 * Prepares file for JPEG conversion if original has transparency,
 * flattening transparent pixels onto the user-selected background color.
 */
async function prepareFileWithBackgroundIfJpg(
  file: File,
  targetFormat: SupportedFormat,
  backgroundColor: string,
  hasTransparency?: boolean
): Promise<File> {
  if (targetFormat !== "jpeg" || !hasTransparency) {
    return file
  }

  const tempUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Error al procesar fondo para JPG"))
      el.src = tempUrl
    })

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.fillStyle = backgroundColor || "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    )

    if (blob) {
      return new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
        type: "image/jpeg",
      })
    }
    return file
  } finally {
    URL.revokeObjectURL(tempUrl)
  }
}

/**
 * Main process function for a single ImageItem using industry-grade browser-image-compression
 */
export async function processSingleImage(
  item: ImageItem,
  config: ProcessingConfig
): Promise<ProcessResult> {
  const startTime = performance.now()
  const targetFormat = resolveTargetFormat(item, config)
  const mimeType = getMimeTypeForFormat(targetFormat)

  // 1. Handle transparency replacement if target is JPEG
  const inputFile = await prepareFileWithBackgroundIfJpg(
    item.file,
    targetFormat,
    config.backgroundColor,
    item.hasTransparency
  )

  // 2. Calculate target size in MB (maxSizeMB) to guarantee real reduction
  const origMB = item.originalSize / (1024 * 1024)
  let targetRatio: number

  if (config.operation === "convert") {
    // When only converting, cap at 85% of original size to avoid bloating
    targetRatio = 0.85
  } else if (config.qualityPreset === "min") {
    // "Menor peso": target 25% of original size (-75% reduction)
    targetRatio = 0.25
  } else if (config.qualityPreset === "max") {
    // "Máxima calidad": target 70% of original size (-30% reduction)
    targetRatio = 0.70
  } else if (config.qualityPreset === "custom") {
    // Manual custom slider: proportional target
    targetRatio = Math.max(0.08, config.qualityValue * 0.85)
  } else {
    // "Equilibrado" (Recommended): target 45% of original size (-55% reduction)
    targetRatio = 0.45
  }

  // Ensure minimum target of 0.04 MB (40 KB)
  let maxSizeMB = Math.max(0.04, origMB * targetRatio)

  // 3. Initial quality configuration
  let initialQuality = 0.65
  if (config.qualityPreset === "max") initialQuality = 0.80
  else if (config.qualityPreset === "min") initialQuality = 0.42
  else if (config.qualityPreset === "custom") initialQuality = config.qualityValue

  // 4. Dimension constraints
  let maxWidthOrHeight: number | undefined = undefined
  let alwaysKeepResolution = true

  if (config.enableResize) {
    const customMax = Math.max(config.maxWidth || 0, config.maxHeight || 0)
    if (customMax > 0) {
      maxWidthOrHeight = customMax
      alwaysKeepResolution = false
    }
  }

  // 5. Execute compression using browser-image-compression
  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: false, // Ensures consistent synchronous in-thread execution without worker URL issues
    fileType: mimeType,
    initialQuality,
    alwaysKeepResolution,
    maxIteration: 12,
  }

  let compressedFile = await imageCompression(inputFile, compressionOptions)

  // 6. Safety check: If the output is still larger than the original
  // (e.g. converting a PNG with high detail or WebP on high resolution),
  // enforce an aggressive second pass with stricter maxSizeMB and reduced initialQuality
  if (compressedFile.size >= item.originalSize && config.operation !== "convert") {
    const forcedOptions = {
      ...compressionOptions,
      maxSizeMB: Math.max(0.03, origMB * 0.40),
      initialQuality: 0.45,
      // If image is massive (> 2560px), cap max dimension to 2560px to prevent canvas bloat
      maxWidthOrHeight: maxWidthOrHeight || (item.originalWidth > 2560 || item.originalHeight > 2560 ? 2560 : undefined),
      alwaysKeepResolution: config.enableResize ? false : (item.originalWidth <= 2560 && item.originalHeight <= 2560),
    }
    try {
      const secondPass = await imageCompression(inputFile, forcedOptions)
      if (secondPass.size < compressedFile.size) {
        compressedFile = secondPass
      }
    } catch {
      // If second pass errors, keep first pass
    }
  }

  // 7. Verify magic bytes of the output blob
  const verification = await verifyEncodedFormat(compressedFile, targetFormat)
  if (!verification.matches) {
    throw new Error(
      verification.error ||
        `El formato codificado no es un ${targetFormat.toUpperCase()} válido.`
    )
  }

  // 8. Extract final image dimensions
  let finalWidth = item.originalWidth
  let finalHeight = item.originalHeight

  try {
    const tempResultUrl = URL.createObjectURL(compressedFile)
    const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject()
      el.src = tempResultUrl
    })
    finalWidth = imgEl.naturalWidth || imgEl.width
    finalHeight = imgEl.naturalHeight || imgEl.height
    URL.revokeObjectURL(tempResultUrl)
  } catch {
    // Fallback to original dimensions if measure fails
  }

  // 9. Real metric calculations
  const finalSize = compressedFile.size
  const originalSize = item.originalSize
  const bytesSaved = originalSize - finalSize
  const percentDiff = originalSize > 0 ? ((finalSize - originalSize) / originalSize) * 100 : 0
  const durationMs = Math.round(performance.now() - startTime)

  const { fileName, extension } = sanitizeOutputFileName(
    item.originalName,
    targetFormat
  )
  const downloadUrl = URL.createObjectURL(compressedFile)

  return {
    blob: compressedFile,
    downloadUrl,
    fileName,
    extension,
    mimeType,
    size: finalSize,
    width: finalWidth,
    height: finalHeight,
    percentDiff,
    bytesSaved,
    durationMs,
  }
}

/**
 * Concurrency runner for processing multiple items without locking the main thread
 */
export async function runBatchProcessing(
  items: ImageItem[],
  config: ProcessingConfig,
  onItemStart: (id: string) => void,
  onItemSuccess: (id: string, result: ProcessResult) => void,
  onItemError: (id: string, error: string) => void,
  maxConcurrency = 2
): Promise<void> {
  const pendingQueue = items.filter((it) => it.status === "pending")
  let index = 0

  async function worker() {
    while (index < pendingQueue.length) {
      const current = pendingQueue[index++]
      onItemStart(current.id)
      try {
        const result = await processSingleImage(current, config)
        onItemSuccess(current.id, result)
      } catch (err: any) {
        onItemError(
          current.id,
          err?.message || "Ocurrió un error inesperado al procesar la imagen"
        )
      }
    }
  }

  const workerCount = Math.min(maxConcurrency, pendingQueue.length)
  const workers = Array.from({ length: workerCount }, () => worker())
  await Promise.all(workers)
}
