import { PDFDocument } from "pdf-lib"
import { ScannerExportOptions } from "./types"

export interface Point {
  x: number
  y: number
}

export interface DocumentCorners {
  tl: Point
  tr: Point
  br: Point
  bl: Point
}

/**
 * Intelligent automatic document corners detection.
 * Analyzes luminance changes between background and white paper.
 * Safely defaults to a clean inset boundary if lighting or contrast is uniform.
 */
export function detectDocumentCorners(
  sourceCanvas: HTMLCanvasElement
): DocumentCorners {
  const w = sourceCanvas.width
  const h = sourceCanvas.height

  // Safe fallback default: 5% padding inset
  const defaultCorners: DocumentCorners = {
    tl: { x: Math.round(w * 0.06), y: Math.round(h * 0.06) },
    tr: { x: Math.round(w * 0.94), y: Math.round(h * 0.06) },
    br: { x: Math.round(w * 0.94), y: Math.round(h * 0.94) },
    bl: { x: Math.round(w * 0.06), y: Math.round(h * 0.94) },
  }

  try {
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return defaultCorners

    // Sample downscaled representation for fast edge detection
    const sampleW = 160
    const sampleH = Math.round((h / w) * sampleW)
    const smallCanvas = document.createElement("canvas")
    smallCanvas.width = sampleW
    smallCanvas.height = sampleH
    const sCtx = smallCanvas.getContext("2d")
    if (!sCtx) return defaultCorners

    sCtx.drawImage(sourceCanvas, 0, 0, sampleW, sampleH)
    const imgData = sCtx.getImageData(0, 0, sampleW, sampleH)
    const data = imgData.data

    // Find bounding box of high luminance paper
    let minX = sampleW
    let maxX = 0
    let minY = sampleH
    let maxY = 0
    let paperPixelsFound = 0

    for (let y = 5; y < sampleH - 5; y++) {
      for (let x = 5; x < sampleW - 5; x++) {
        const idx = (y * sampleW + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b

        // If significantly brighter than typical dark table
        if (lum > 140) {
          paperPixelsFound++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    // If substantial paper area is detected
    if (paperPixelsFound > sampleW * sampleH * 0.15 && maxX > minX + 20 && maxY > minY + 20) {
      const scaleX = w / sampleW
      const scaleY = h / sampleH
      return {
        tl: { x: Math.round(minX * scaleX), y: Math.round(minY * scaleY) },
        tr: { x: Math.round(maxX * scaleX), y: Math.round(minY * scaleY) },
        br: { x: Math.round(maxX * scaleX), y: Math.round(maxY * scaleY) },
        bl: { x: Math.round(minX * scaleX), y: Math.round(maxY * scaleY) },
      }
    }
  } catch {
    // Fall back to default corners on any error
  }

  return defaultCorners
}

/**
 * Applies perspective warp transformation from 4 quadrilateral corners
 * to a rectified rectangular destination canvas using bilinear interpolation.
 */
export function applyPerspectiveWarp(
  sourceCanvas: HTMLCanvasElement,
  corners: DocumentCorners
): HTMLCanvasElement {
  const { tl, tr, br, bl } = corners

  // Compute realistic target dimensions based on corner distances
  const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y)
  const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y)
  const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y)
  const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y)

  const destWidth = Math.max(100, Math.round(Math.max(widthTop, widthBottom)))
  const destHeight = Math.max(100, Math.round(Math.max(heightLeft, heightRight)))

  // Cap maximum dimensions to prevent memory exhaustion while retaining crisp text
  const maxDimension = 2500
  let finalW = destWidth
  let finalH = destHeight
  if (finalW > maxDimension || finalH > maxDimension) {
    const ratio = Math.min(maxDimension / finalW, maxDimension / finalH)
    finalW = Math.round(finalW * ratio)
    finalH = Math.round(finalH * ratio)
  }

  const sCtx = sourceCanvas.getContext("2d", { willReadFrequently: true })
  if (!sCtx) return sourceCanvas

  const sImgData = sCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  const sData = sImgData.data
  const sw = sourceCanvas.width
  const sh = sourceCanvas.height

  const destCanvas = document.createElement("canvas")
  destCanvas.width = finalW
  destCanvas.height = finalH
  const dCtx = destCanvas.getContext("2d")
  if (!dCtx) return sourceCanvas

  const dImgData = dCtx.createImageData(finalW, finalH)
  const dData = dImgData.data

  const invW = 1 / finalW
  const invH = 1 / finalH

  for (let dy = 0; dy < finalH; dy++) {
    const v = dy * invH
    const oneMinusV = 1 - v

    // Top and bottom point coordinates interpolated along horizontal boundaries
    const topX = tl.x
    const topY = tl.y
    const trDiffX = tr.x - tl.x
    const trDiffY = tr.y - tl.y

    const botX = bl.x
    const botY = bl.y
    const brDiffX = br.x - bl.x
    const brDiffY = br.y - bl.y

    const destRowOffset = dy * finalW * 4

    for (let dx = 0; dx < finalW; dx++) {
      const u = dx * invW
      const oneMinusU = 1 - u

      // Bilinear interpolation across quad
      const sx =
        oneMinusU * (oneMinusV * tl.x + v * bl.x) +
        u * (oneMinusV * tr.x + v * br.x)
      const sy =
        oneMinusU * (oneMinusV * tl.y + v * bl.y) +
        u * (oneMinusV * tr.y + v * br.y)

      const isx = Math.round(sx)
      const isy = Math.round(sy)

      const dIdx = destRowOffset + dx * 4

      if (isx >= 0 && isx < sw && isy >= 0 && isy < sh) {
        const sIdx = (isy * sw + isx) * 4
        dData[dIdx] = sData[sIdx]
        dData[dIdx + 1] = sData[sIdx + 1]
        dData[dIdx + 2] = sData[sIdx + 2]
        dData[dIdx + 3] = 255
      } else {
        dData[dIdx] = 255
        dData[dIdx + 1] = 255
        dData[dIdx + 2] = 255
        dData[dIdx + 3] = 255
      }
    }
  }

  dCtx.putImageData(dImgData, 0, 0)
  return destCanvas
}

/**
 * Estimates 2D background illumination map using an 88th percentile block grid.
 * Accurately models paper luminance even under strong diagonal shadows or uneven phone flash.
 */
function estimateBackgroundGrid(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  cellSize: number = 32
): { grid: Float32Array; gridW: number; gridH: number } {
  const gridW = Math.max(2, Math.ceil(w / cellSize))
  const gridH = Math.max(2, Math.ceil(h / cellSize))
  const grid = new Float32Array(gridW * gridH)

  for (let gy = 0; gy < gridH; gy++) {
    const startY = gy * cellSize
    const endY = Math.min(h, startY + cellSize)
    for (let gx = 0; gx < gridW; gx++) {
      const startX = gx * cellSize
      const endX = Math.min(w, startX + cellSize)

      const samples: number[] = []
      for (let y = startY; y < endY; y += 2) {
        const row = y * w
        for (let x = startX; x < endX; x += 2) {
          const idx = (row + x) * 4
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
          samples.push(lum)
        }
      }

      if (samples.length > 0) {
        samples.sort((a, b) => a - b)
        // 88th percentile samples the paper background while skipping dark ink
        const p88Idx = Math.min(samples.length - 1, Math.floor(samples.length * 0.88))
        grid[gy * gridW + gx] = Math.max(60, samples[p88Idx])
      } else {
        grid[gy * gridW + gx] = 220
      }
    }
  }

  return { grid, gridW, gridH }
}

/**
 * Bilinear interpolation lookup in background grid.
 */
function sampleBackgroundLum(
  grid: Float32Array,
  gridW: number,
  gridH: number,
  w: number,
  h: number,
  x: number,
  y: number
): number {
  const gx = (x / Math.max(1, w)) * (gridW - 1)
  const gy = (y / Math.max(1, h)) * (gridH - 1)
  const gxi = Math.floor(gx)
  const gyi = Math.floor(gy)
  const fx = gx - gxi
  const fy = gy - gyi

  const idx00 = gyi * gridW + gxi
  const idx10 = gyi * gridW + Math.min(gridW - 1, gxi + 1)
  const idx01 = Math.min(gridH - 1, gyi + 1) * gridW + gxi
  const idx11 = Math.min(gridH - 1, gyi + 1) * gridW + Math.min(gridW - 1, gxi + 1)

  const top = (1 - fx) * grid[idx00] + fx * grid[idx10]
  const bot = (1 - fx) * grid[idx01] + fx * grid[idx11]
  return Math.max(50, (1 - fy) * top + fy * bot)
}

/**
 * Applies CamScanner-inspired document visual enhancement filters:
 * - Color: Flat-field illumination normalization preserving stamps, signatures and hues
 * - Grayscale: Eliminates color cast while evening out lighting gradients
 * - Contrast / Clean B&W: Document enhancement with ink darkening & white background boosting
 */
export function applyImageFilters(
  canvas: HTMLCanvasElement,
  filter: "color" | "grayscale" | "contrast" | "clean_bw"
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const imgData = ctx.getImageData(0, 0, w, h)
  const data = imgData.data

  const { grid, gridW, gridH } = estimateBackgroundGrid(data, w, h, 36)

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w
    for (let x = 0; x < w; x++) {
      const i = (rowOffset + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      const bg = sampleBackgroundLum(grid, gridW, gridH, w, h, x, y)
      const normFactor = 240 / Math.max(50, bg)

      if (filter === "color") {
        // Normalize channels against estimated paper background
        data[i] = Math.min(255, Math.max(0, Math.round(r * normFactor)))
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g * normFactor)))
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b * normFactor)))
      } else if (filter === "grayscale") {
        const enhancedLum = Math.min(255, Math.max(0, Math.round(lum * normFactor)))
        data[i] = enhancedLum
        data[i + 1] = enhancedLum
        data[i + 2] = enhancedLum
      } else {
        // "contrast" / "clean_bw"
        const normLum = lum * normFactor
        let enhanced: number
        if (normLum > 180) {
          enhanced = 255
        } else if (normLum < 115) {
          enhanced = Math.max(0, normLum * 0.72)
        } else {
          enhanced = ((normLum - 115) / (180 - 115)) * 255
        }

        data[i] = enhanced
        data[i + 1] = enhanced
        data[i + 2] = enhanced
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
}

/**
 * Rotates a canvas by 90, 180, or 270 degrees.
 */
export function rotateCanvas(
  sourceCanvas: HTMLCanvasElement,
  angleDegrees: number
): HTMLCanvasElement {
  const normalized = ((angleDegrees % 360) + 360) % 360
  if (normalized === 0) return sourceCanvas

  const rad = (normalized * Math.PI) / 180
  const is90or270 = normalized === 90 || normalized === 270

  const targetCanvas = document.createElement("canvas")
  targetCanvas.width = is90or270 ? sourceCanvas.height : sourceCanvas.width
  targetCanvas.height = is90or270 ? sourceCanvas.width : sourceCanvas.height

  const ctx = targetCanvas.getContext("2d")
  if (!ctx) return sourceCanvas

  ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(
    sourceCanvas,
    -sourceCanvas.width / 2,
    -sourceCanvas.height / 2
  )

  return targetCanvas
}

/**
 * Creates a standalone PDF from an array of scanned canvas data URLs.
 */
export async function exportScannedPagesToPdf(
  scannedDataUrls: string[],
  options: ScannerExportOptions
): Promise<Blob> {
  if (scannedDataUrls.length === 0) {
    throw new Error("No hay páginas escaneadas para exportar.")
  }

  const pdfDoc = await PDFDocument.create()

  const A4_W = 595.28
  const A4_H = 841.89

  for (const dataUrl of scannedDataUrls) {
    // Convert data url to Uint8Array bytes
    const base64Data = dataUrl.split(",")[1]
    const binaryStr = atob(base64Data)
    const len = binaryStr.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    let embeddedImg: any = null
    if (dataUrl.startsWith("data:image/png")) {
      embeddedImg = await pdfDoc.embedPng(bytes)
    } else {
      embeddedImg = await pdfDoc.embedJpg(bytes)
    }

    const imgW = embeddedImg.width
    const imgH = embeddedImg.height

    if (options.pageSize === "fit") {
      const page = pdfDoc.addPage([imgW, imgH])
      page.drawImage(embeddedImg, { x: 0, y: 0, width: imgW, height: imgH })
    } else {
      // A4 page
      let isLandscape = false
      if (options.orientation === "auto") {
        isLandscape = imgW > imgH
      } else {
        isLandscape = options.orientation === "landscape"
      }

      const pageW = isLandscape ? A4_H : A4_W
      const pageH = isLandscape ? A4_W : A4_H

      const margin = 20
      const availW = pageW - margin * 2
      const availH = pageH - margin * 2

      const scale = Math.min(availW / imgW, availH / imgH, 1)
      const renderW = imgW * scale
      const renderH = imgH * scale

      const posX = (pageW - renderW) / 2
      const posY = (pageH - renderH) / 2

      const page = pdfDoc.addPage([pageW, pageH])
      page.drawImage(embeddedImg, {
        x: posX,
        y: posY,
        width: renderW,
        height: renderH,
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as any], { type: "application/pdf" })
}
