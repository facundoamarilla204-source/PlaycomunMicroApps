import {
  FontOption,
  OutputFormat,
  PresetPosition,
  WatermarkBox,
  WatermarkConfig,
} from "./types"

export const AVAILABLE_FONTS: FontOption[] = [
  { id: "work-sans", name: "Work Sans (PlayComun)", family: "'Work Sans', system-ui, -apple-system, sans-serif" },
  { id: "system-sans", name: "Sans-Serif Clásico", family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { id: "georgia", name: "Elegante Serif (Georgia)", family: "Georgia, 'Times New Roman', serif" },
  { id: "mono", name: "Monospace / Técnico", family: "'Courier New', Courier, monospace" },
  { id: "fugaz", name: "Impacto Display (Fugaz)", family: "'Fugaz One', Impact, cursive, sans-serif" },
]

export const PRESET_POSITION_LABELS: Record<PresetPosition, string> = {
  "top-left": "Sup. Izquierda",
  "top-center": "Sup. Centro",
  "top-right": "Sup. Derecha",
  "middle-left": "Centro Izquierda",
  "center": "Centro",
  "middle-right": "Centro Derecha",
  "bottom-left": "Inf. Izquierda",
  "bottom-center": "Inf. Centro",
  "bottom-right": "Inf. Derecha",
  "custom": "Personalizada",
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  type: "text",
  mode: "single",
  position: "bottom-right",
  customPos: {
    xRel: 0.82,
    yRel: 0.88,
  },
  textConfig: {
    text: "© Mi Marca",
    fontFamily: "'Work Sans', system-ui, -apple-system, sans-serif",
    fontSizeRel: 6.5, // 6.5% of min dimension
    color: "#ffffff",
    opacity: 0.85,
    align: "center",
    rotation: 0,
    margin: 4.5, // 4.5% from edges
    enableShadow: true,
    shadowColor: "rgba(0, 0, 0, 0.75)",
    shadowBlur: 6,
    enableStroke: true,
    strokeColor: "rgba(0, 0, 0, 0.5)",
    strokeWidth: 2,
  },
  imageConfig: {
    logoFile: null,
    logoUrl: null,
    logoWidth: 0,
    logoHeight: 0,
    logoFormat: "",
    scaleRel: 24, // 24% of min dimension
    opacity: 0.85,
    rotation: 0,
    margin: 4.5,
  },
  repeatConfig: {
    gapXRel: 130, // 130% gap
    gapYRel: 130,
    density: "media",
    angle: -30, // -30deg diagonal watermark
  },
  outputFormat: "original",
  quality: 0.9,
  backgroundColor: "#ffffff",
}

/**
 * Resolves a clean, valid CSS font family string for HTML5 Canvas 2D context.
 * HTML5 Canvas specification rejects CSS variables like `var(...)`. If present,
 * we resolve them dynamically via getComputedStyle or strip them out cleanly.
 */
export function resolveCanvasFontFamily(fontFamily: string): string {
  if (!fontFamily) return 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

  let resolved = fontFamily

  // If running in browser and contains var(--...), attempt to resolve computed value
  if (typeof window !== "undefined" && resolved.includes("var(")) {
    try {
      resolved = resolved.replace(/var\((--[^)]+)\)/g, (_, varName) => {
        const val =
          getComputedStyle(document.body).getPropertyValue(varName) ||
          getComputedStyle(document.documentElement).getPropertyValue(varName)
        return val ? val.trim() : ""
      })
    } catch {
      // Fallback to stripping if getComputedStyle fails
    }
  }

  // Strip any unresolvable var(...) tokens and clean double commas/quotes
  resolved = resolved
    .replace(/var\([^)]+\)/g, "")
    .replace(/,\s*,+/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim()

  return resolved || 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
}

/**
 * Builds a 100% valid CSS font shorthand string guaranteed to be accepted by Canvas 2D ctx.font.
 */
export function buildCanvasFont(fontSizePx: number, fontFamily: string, weight = "600"): string {
  const cleanFamily = resolveCanvasFontFamily(fontFamily)
  return `${weight} ${fontSizePx}px ${cleanFamily}`
}

/**
 * Calculates absolute font size in pixels from relative percentage of minimum dimension.
 */
export function calculateFontSizePx(
  imgWidth: number,
  imgHeight: number,
  fontSizeRel: number
): number {
  const minDim = Math.min(imgWidth, imgHeight)
  const size = Math.round((fontSizeRel / 100) * minDim)
  return Math.max(12, Math.min(size, Math.round(minDim * 0.45)))
}

/**
 * Measures multiline text dimensions without requiring a full canvas DOM element.
 */
export function measureMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSizePx: number,
  fontFamily: string
): { width: number; height: number; lines: string[]; lineHeight: number } {
  ctx.save()
  ctx.font = buildCanvasFont(fontSizePx, fontFamily, "600")
  const rawLines = text.split("\n")
  const lines = rawLines.length === 0 ? [""] : rawLines
  const lineHeight = Math.round(fontSizePx * 1.28)

  let maxWidth = 0
  for (const line of lines) {
    const metrics = ctx.measureText(line || " ")
    if (metrics.width > maxWidth) {
      maxWidth = metrics.width
    }
  }
  ctx.restore()

  return {
    width: Math.max(20, Math.ceil(maxWidth)),
    height: Math.max(fontSizePx, lines.length * lineHeight),
    lines,
    lineHeight,
  }
}

/**
 * Calculates the bounding box of an image logo watermark given natural dimensions and relative scale.
 */
export function calculateLogoDimensions(
  imgWidth: number,
  imgHeight: number,
  logoNaturalWidth: number,
  logoNaturalHeight: number,
  scaleRel: number
): { width: number; height: number } {
  if (!logoNaturalWidth || !logoNaturalHeight) {
    const fallbackSize = Math.round(Math.min(imgWidth, imgHeight) * (scaleRel / 100))
    return { width: fallbackSize, height: fallbackSize }
  }

  const minDim = Math.min(imgWidth, imgHeight)
  const targetMajorDim = (scaleRel / 100) * minDim

  const logoAspect = logoNaturalWidth / logoNaturalHeight
  let w: number
  let h: number

  if (logoAspect >= 1) {
    // Wider than tall
    w = targetMajorDim
    h = targetMajorDim / logoAspect
  } else {
    // Taller than wide
    h = targetMajorDim
    w = targetMajorDim * logoAspect
  }

  return {
    width: Math.max(16, Math.round(w)),
    height: Math.max(16, Math.round(h)),
  }
}

/**
 * Calculates center (x, y) coordinates for a given preset position and margins.
 */
export function calculatePresetCoordinates(
  imgWidth: number,
  imgHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: PresetPosition,
  marginPercent: number
): { centerX: number; centerY: number } {
  const marginPx = Math.round((marginPercent / 100) * Math.min(imgWidth, imgHeight))
  const halfW = watermarkWidth / 2
  const halfH = watermarkHeight / 2

  let x = imgWidth / 2
  let y = imgHeight / 2

  switch (position) {
    case "top-left":
      x = marginPx + halfW
      y = marginPx + halfH
      break
    case "top-center":
      x = imgWidth / 2
      y = marginPx + halfH
      break
    case "top-right":
      x = imgWidth - marginPx - halfW
      y = marginPx + halfH
      break
    case "middle-left":
      x = marginPx + halfW
      y = imgHeight / 2
      break
    case "center":
      x = imgWidth / 2
      y = imgHeight / 2
      break
    case "middle-right":
      x = imgWidth - marginPx - halfW
      y = imgHeight / 2
      break
    case "bottom-left":
      x = marginPx + halfW
      y = imgHeight - marginPx - halfH
      break
    case "bottom-center":
      x = imgWidth / 2
      y = imgHeight - marginPx - halfH
      break
    case "bottom-right":
      x = imgWidth - marginPx - halfW
      y = imgHeight - marginPx - halfH
      break
    case "custom":
      break
  }

  return {
    centerX: Math.round(x),
    centerY: Math.round(y),
  }
}

/**
 * Resolves the center coordinate, either from preset or from normalized custom coordinates.
 */
export function resolveWatermarkPosition(
  imgWidth: number,
  imgHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  config: WatermarkConfig
): WatermarkBox {
  if (config.position === "custom") {
    const centerX = Math.round(config.customPos.xRel * imgWidth)
    const centerY = Math.round(config.customPos.yRel * imgHeight)
    return {
      width: watermarkWidth,
      height: watermarkHeight,
      centerX,
      centerY,
    }
  }

  const margin = config.type === "text" ? config.textConfig.margin : config.imageConfig.margin
  const { centerX, centerY } = calculatePresetCoordinates(
    imgWidth,
    imgHeight,
    watermarkWidth,
    watermarkHeight,
    config.position,
    margin
  )

  return {
    width: watermarkWidth,
    height: watermarkHeight,
    centerX,
    centerY,
  }
}

/**
 * Sanitizes output filename, adding `-watermark` suffix and matching extension.
 */
export function sanitizeWatermarkFileName(
  originalName: string,
  targetFormat: OutputFormat,
  originalFormat: "jpeg" | "png" | "webp" | "desconocido"
): { fileName: string; extension: string } {
  const lastDot = originalName.lastIndexOf(".")
  const baseName = (lastDot > 0 ? originalName.substring(0, lastDot) : originalName).trim()
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_\-\u00C0-\u017F\s]/g, "").trim() || "imagen"

  let ext = "jpg"
  if (targetFormat === "original") {
    if (originalFormat === "png") ext = "png"
    else if (originalFormat === "webp") ext = "webp"
    else ext = "jpg"
  } else if (targetFormat === "png") {
    ext = "png"
  } else if (targetFormat === "webp") {
    ext = "webp"
  } else {
    ext = "jpg"
  }

  return {
    fileName: `${cleanBase}-watermark.${ext}`,
    extension: ext,
  }
}

/**
 * Formats bytes to readable units (KB, MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const safeI = Math.min(i, sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(decimals))} ${sizes[safeI]}`
}

/**
 * Triggers safe client-side browser file download from Blob or URL with proper cleanup.
 */
export function triggerFileDownload(blobOrUrl: Blob | string, fileName: string): void {
  const isString = typeof blobOrUrl === "string"
  const url = isString ? blobOrUrl : URL.createObjectURL(blobOrUrl)
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a)
    }
    if (!isString) {
      URL.revokeObjectURL(url)
    }
  }, 1000)
}

