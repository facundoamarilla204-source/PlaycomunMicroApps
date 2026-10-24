import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export type RecognizedBlockType =
  | "title"
  | "heading"
  | "subheading"
  | "paragraph"
  | "list_item"
  | "table_row"

export interface RecognizedBlock {
  id: string
  type: RecognizedBlockType
  text: string
  confidence: number
  isBold?: boolean
  bbox?: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

export interface RecognizedPageContent {
  pageIndex: number
  fullText: string
  blocks: RecognizedBlock[]
  confidence: number
  hasText: boolean
}

export interface ReconstructPdfOptions {
  documentTitle?: string
  fontSize?: number // base font size, default 11
  fontFamily?: "helvetica" | "times" | "courier"
  lineSpacing?: number // 1.2 to 1.5, default 1.35
  pageSize?: "a4" | "letter"
  addPageNumbers?: boolean
}

/**
 * Prepares and enhances a canvas frame for high-accuracy OCR.
 * Converts to high-contrast grayscale with background noise reduction.
 */
/**
 * Estimates 2D background illumination map for flat-field correction.
 */
function estimateOcrBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  cellSize: number = 28
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
        const p85Idx = Math.min(samples.length - 1, Math.floor(samples.length * 0.85))
        grid[gy * gridW + gx] = Math.max(50, samples[p85Idx])
      } else {
        grid[gy * gridW + gx] = 220
      }
    }
  }

  return { grid, gridW, gridH }
}

function sampleOcrBackground(
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
  return Math.max(45, (1 - fy) * top + fy * bot)
}

/**
 * Prepares and enhances a canvas frame for high-accuracy OCR inspired by CamScanner:
 * 1. Resolution normalization: Ensures text has adequate glyph height (>30px per letter).
 * 2. Flat-field background illumination normalization (shadow attenuation).
 * 3. Character boundary unsharp sharpening.
 * 4. Adaptive contrast mapping that protects accents (á, é, í, ó, ú), eñes (ñ, Ñ), and punctuation.
 */
export function preprocessCanvasForOcr(
  sourceCanvas: HTMLCanvasElement,
  maxDimension: number = 2400
): HTMLCanvasElement {
  let targetW = sourceCanvas.width
  let targetH = sourceCanvas.height

  // If capture is smaller than 1300px wide, upscale to guarantee font stroke clarity
  if (targetW < 1300 && targetH < 1800) {
    const scale = Math.min(1300 / targetW, 1800 / targetH)
    targetW = Math.round(targetW * scale)
    targetH = Math.round(targetH * scale)
  } else if (targetW > maxDimension || targetH > maxDimension) {
    const ratio = Math.min(maxDimension / targetW, maxDimension / targetH)
    targetW = Math.round(targetW * ratio)
    targetH = Math.round(targetH * ratio)
  }

  const outCanvas = document.createElement("canvas")
  outCanvas.width = targetW
  outCanvas.height = targetH
  const ctx = outCanvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return sourceCanvas

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH)

  const imgData = ctx.getImageData(0, 0, targetW, targetH)
  const data = imgData.data

  // 1. Illumination background estimation
  const { grid, gridW, gridH } = estimateOcrBackground(data, targetW, targetH, 30)

  // 2. Compute normalized luminance buffer
  const normBuffer = new Float32Array(targetW * targetH)
  for (let y = 0; y < targetH; y++) {
    const rowOffset = y * targetW
    for (let x = 0; x < targetW; x++) {
      const idx = (rowOffset + x) * 4
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      const bg = sampleOcrBackground(grid, gridW, gridH, targetW, targetH, x, y)
      // Flat-field normalized luminance scaled to standard 240 paper reference
      normBuffer[rowOffset + x] = (lum / Math.max(45, bg)) * 240
    }
  }

  // 3. High-definition unsharp masking and adaptive document contrast
  // Preserves diacritics (á, é, í, ó, ú), eñes (ñ, Ñ), punctuation (¿, ¡, :, ,, .) and numbers
  for (let y = 0; y < targetH; y++) {
    const rowOffset = y * targetW
    const prevRow = Math.max(0, y - 1) * targetW
    const nextRow = Math.min(targetH - 1, y + 1) * targetW

    for (let x = 0; x < targetW; x++) {
      const prevX = Math.max(0, x - 1)
      const nextX = Math.min(targetW - 1, x + 1)

      const center = normBuffer[rowOffset + x]
      const avgNeighbor =
        (normBuffer[prevRow + x] +
          normBuffer[nextRow + x] +
          normBuffer[rowOffset + prevX] +
          normBuffer[rowOffset + nextX]) * 0.25

      // Subtle unsharp contrast enhancement without wiping small diacritics
      const sharpened = center + 0.65 * (center - avgNeighbor)

      let enhanced: number
      if (sharpened > 220) {
        enhanced = 255 // Clean paper white
      } else if (sharpened < 130) {
        enhanced = Math.max(0, Math.round(sharpened * 0.78)) // Crisp dark ink
      } else {
        // Linear smooth transition that preserves middle-tone accents and handwriting
        enhanced = Math.round(((sharpened - 130) / (220 - 130)) * 255)
      }

      const pixelIdx = (rowOffset + x) * 4
      data[pixelIdx] = enhanced
      data[pixelIdx + 1] = enhanced
      data[pixelIdx + 2] = enhanced
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return outCanvas
}

/**
 * Loads Tesseract.js dynamically from CDN if not already in window.
 */
async function loadTesseractFromCdn(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("El motor OCR solo se puede ejecutar en el navegador del cliente.")
  }

  if ((window as any).Tesseract) {
    return (window as any).Tesseract
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="tesseract.min.js"]')
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Tesseract))
      existing.addEventListener("error", () =>
        reject(new Error("No se pudo cargar el script del motor OCR."))
      )
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"
    script.async = true
    script.onload = () => {
      if ((window as any).Tesseract) {
        resolve((window as any).Tesseract)
      } else {
        reject(new Error("Tesseract no inicializó en el objeto global."))
      }
    }
    script.onerror = () => {
      reject(
        new Error(
          "No se pudo descargar el motor OCR de lectura. Por favor verificá tu conexión a internet o cargá el texto manualmente."
        )
      )
    }
    document.head.appendChild(script)
  })
}

/**
 * Classifies a raw text line into a structured document block.
 */
/**
 * Sanitizes recognized Spanish text for WinAnsi PDF embedding without character corruption.
 * Replaces non-WinAnsi smart quotes and dashes while preserving all accented vowels, eñes and punctuation.
 * Conforms strictly to Antislop R-02 (no em dashes).
 */
export function sanitizeSpanishTextForPdf(text: string): string {
  if (!text) return ""
  return text
    .normalize("NFC")
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-") // No em dash in copy, standard hyphen
    .replace(/\u00A0/g, " ")
    .replace(/[\u2022\u25CF\u25CB]/g, "•")
}

export interface ClassifiedLineResult {
  type: RecognizedBlockType
  isBold: boolean
}

/**
 * Classifies a raw text line into a structured document block using
 * visual hierarchy cues (relative line height, bold signals, keywords, indentation).
 */
export function classifyLine(
  text: string,
  lineIndex: number,
  totalLines: number,
  lineHeight?: number,
  medianLineHeight?: number,
  hasBoldWord?: boolean
): ClassifiedLineResult {
  const trimmed = text.trim()
  if (!trimmed) return { type: "paragraph", isBold: false }

  // 1. Check for bullet or numbered list item
  if (/^([•*\-–—]|(\d+|[a-zA-Z])[.)])\s+/.test(trimmed)) {
    return { type: "list_item", isBold: Boolean(hasBoldWord) }
  }

  // 2. Check for table row (multiple columnar tokens separated by 2+ spaces or tabs)
  if (/\s{3,}|\t/.test(trimmed) && trimmed.split(/\s{2,}|\t/).length >= 2) {
    return { type: "table_row", isBold: Boolean(hasBoldWord) }
  }

  // 3. Significant font size / line height (CamScanner visual hierarchy)
  const isSignificantlyLarge =
    Boolean(lineHeight && medianLineHeight && lineHeight >= medianLineHeight * 1.32)
  const isModeratelyLarge =
    Boolean(lineHeight && medianLineHeight && lineHeight >= medianLineHeight * 1.15)

  // 4. Spanish Administrative & Document Section Keywords
  const isSectionKeyword =
    /^(ART[ÍI]CULO|CL[ÁA]USULA|CAP[ÍI]TULO|SECCI[ÓO]N|ANEXO|T[ÍI]TULO|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|RESOLUCI[ÓO]N|DECRETO|LEY|CONSIDERANDO:|RESUELVE:|CERTIFICO|CERTIFICADO|INFORME|ACTA)\b/i.test(
      trimmed
    )

  // 5. Uppercase evaluation
  const isAllUpper =
    trimmed.length > 3 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-ZÁÉÍÓÚÑ]/.test(trimmed)

  // Title: very large line height, or first 2 lines with prominent uppercase/no period
  if (
    isSignificantlyLarge ||
    (lineIndex <= 2 && trimmed.length < 70 && (isAllUpper || !trimmed.endsWith(".")))
  ) {
    return { type: "title", isBold: true }
  }

  // Heading: section keyword, moderately large font, or standalone uppercase line
  if (
    isSectionKeyword ||
    isModeratelyLarge ||
    (trimmed.length < 65 && (isAllUpper || /^[A-ZÁÉÍÓÚÑ0-9\s:_-]{3,65}$/.test(trimmed)))
  ) {
    return { type: "heading", isBold: true }
  }

  // Subheading: subsections like 1.1, 2.3, or bold short phrase
  if (/^\d+(\.\d+)+\s+/.test(trimmed) || (hasBoldWord && trimmed.length < 60)) {
    return { type: "subheading", isBold: true }
  }

  return {
    type: "paragraph",
    isBold: Boolean(hasBoldWord),
  }
}

/**
 * Converts input (canvas, blob, or dataUrl) into a preprocessed HTMLCanvasElement for OCR.
 */
async function prepareCanvasForOcr(
  input: HTMLCanvasElement | Blob | string
): Promise<HTMLCanvasElement | Blob | string> {
  if (typeof window === "undefined") return input

  try {
    let sourceCanvas: HTMLCanvasElement | null = null

    if (typeof input === "string") {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("No se pudo decodificar imagen para OCR."))
        img.src = input
      })
      const c = document.createElement("canvas")
      c.width = img.naturalWidth || img.width
      c.height = img.naturalHeight || img.height
      const ctx = c.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        sourceCanvas = c
      }
    } else if (input instanceof HTMLCanvasElement) {
      sourceCanvas = input
    }

    if (sourceCanvas) {
      return preprocessCanvasForOcr(sourceCanvas)
    }
  } catch {}

  return input
}

/**
 * Processes an image using in-browser OCR (Tesseract.js) in Spanish,
 * detecting structural document hierarchies (titles, lists, tables, paragraphs).
 */
export async function performOcrOnImage(
  imageCanvasOrBlob: HTMLCanvasElement | Blob | string,
  options?: {
    language?: string
    onProgress?: (progressPercent: number, statusMessage: string) => void
  }
): Promise<RecognizedPageContent> {
  const lang = options?.language || "spa"
  const onProgress = options?.onProgress

  if (onProgress) {
    onProgress(10, "Iniciando motor de reconocimiento OCR en español...")
  }

  let Tesseract: any
  try {
    Tesseract = await loadTesseractFromCdn()
  } catch (err: any) {
    throw new Error(err?.message || "Error al inicializar el motor OCR.")
  }

  if (onProgress) {
    onProgress(25, "Descargando modelo lingüístico en español...")
  }

  let worker: any = null
  try {
    worker = await Tesseract.createWorker(lang, 1, {
      logger: (m: any) => {
        if (m.status === "recognizing text" && onProgress) {
          const pct = Math.min(95, Math.round(30 + (m.progress || 0) * 65))
          onProgress(pct, `Reconociendo caracteres: ${Math.round((m.progress || 0) * 100)}%`)
        }
      },
    })

    // Configure segmentation and whitespace preservation
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: "3", // Fully automatic page segmentation without OSD (avoids external osd.traineddata timeout)
        preserve_interword_spaces: "1",
      })
    } catch {}

    if (onProgress) {
      onProgress(35, "Optimizando contraste e iluminación del documento...")
    }

    const processedInput = await prepareCanvasForOcr(imageCanvasOrBlob)

    if (onProgress) {
      onProgress(45, "Analizando texto y estructura de la página...")
    }

    const ret = await worker.recognize(processedInput)
    const { data } = ret

    const fullText = (data.text || "").trim()
    const blocks: RecognizedBlock[] = []

    // Calculate median line height for font size normalization
    let medianLineHeight = 24
    if (data.lines && data.lines.length > 0) {
      const validHeights = data.lines
        .map((l: any) => (l.bbox ? Math.abs(l.bbox.y1 - l.bbox.y0) : 0))
        .filter((h: number) => h > 5)
        .sort((a: number, b: number) => a - b)
      if (validHeights.length > 0) {
        medianLineHeight = validHeights[Math.floor(validHeights.length / 2)]
      }
    }

    if (data.lines && data.lines.length > 0) {
      data.lines.forEach((line: any, idx: number) => {
        const lineText = sanitizeSpanishTextForPdf((line.text || "").trim())
        if (!lineText) return

        const lineH = line.bbox ? Math.abs(line.bbox.y1 - line.bbox.y0) : undefined
        const hasBoldWord = Boolean(line.words && line.words.some((w: any) => w.is_bold))

        const { type, isBold } = classifyLine(
          lineText,
          idx,
          data.lines.length,
          lineH,
          medianLineHeight,
          hasBoldWord
        )

        blocks.push({
          id: `block_${idx}_${Date.now()}`,
          type,
          text: lineText,
          isBold,
          confidence: Math.round(line.confidence || 0),
          bbox: line.bbox
            ? {
                x0: line.bbox.x0,
                y0: line.bbox.y0,
                x1: line.bbox.x1,
                y1: line.bbox.y1,
              }
            : undefined,
        })
      })
    } else if (fullText) {
      // Fallback: split by newlines
      const lines = fullText.split(/\r?\n/).filter((l: string) => l.trim().length > 0)
      lines.forEach((rawText: string, idx: number) => {
        const lineText = sanitizeSpanishTextForPdf(rawText.trim())
        const { type, isBold } = classifyLine(lineText, idx, lines.length)
        blocks.push({
          id: `block_fallback_${idx}`,
          type,
          text: lineText,
          isBold,
          confidence: Math.round(data.confidence || 85),
        })
      })
    }

    if (onProgress) {
      onProgress(100, "Lectura de texto completada.")
    }

    return {
      pageIndex: 0,
      fullText,
      blocks,
      confidence: Math.round(data.confidence || 0),
      hasText: fullText.length > 5,
    }
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {})
    }
  }
}

/**
 * Reconstructs digital vector PDF pages from recognized content.
 * CRITICAL: NO PHOTOGRAPHS OR IMAGES ARE EMBEDDED.
 * NO PLAYCOMUN BRANDING, LOGOS, WATERMARKS OR FOOTERS.
 * The generated PDF consists 100% of real digital selectable vector text and fonts.
 */
export async function reconstructDigitalPdf(
  pages: RecognizedPageContent[],
  options: ReconstructPdfOptions = {}
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error("No hay páginas de texto reconocidas para construir el PDF.")
  }

  const pdfDoc = await PDFDocument.create()

  // Clear all branding or generator metadata
  pdfDoc.setTitle(options.documentTitle || "Documento Digital")
  pdfDoc.setAuthor("")
  pdfDoc.setSubject("")
  pdfDoc.setProducer("PDF")
  pdfDoc.setCreator("PDF")

  // Standard A4: 595.28 x 841.89 points
  const pageWidth = 595.28
  const pageHeight = 841.89

  // Embed clean digital fonts
  let fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  let fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  if (options.fontFamily === "times") {
    fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  } else if (options.fontFamily === "courier") {
    fontRegular = await pdfDoc.embedFont(StandardFonts.Courier)
    fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold)
  }

  const baseFontSize = options.fontSize || 10.5
  const lineSpacing = options.lineSpacing || 1.35
  const marginH = 48
  const marginV = 52
  const maxContentW = pageWidth - marginH * 2
  const minContentY = marginV + 15

  const totalPages = pages.length

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const pageData = pages[pIdx]
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
    let cursorY = pageHeight - marginV

    // Color definitions
    const textDark = rgb(0.12, 0.12, 0.16)

    // Helper: Wrap text line by line within maxContentW
    const wrapAndDrawText = (
      text: string,
      font: any,
      size: number,
      color: any,
      indent: number = 0
    ) => {
      const sanitized = sanitizeSpanishTextForPdf(text)
      const words = sanitized.split(" ")
      let currentLine = ""
      const usableW = maxContentW - indent

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        let testW = 0
        try {
          testW = font.widthOfTextAtSize(testLine, size)
        } catch {
          testW = testLine.length * (size * 0.55)
        }

        if (testW <= usableW) {
          currentLine = testLine
        } else {
          // Draw line
          if (cursorY < minContentY) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight])
            cursorY = pageHeight - marginV
          }
          if (currentLine) {
            try {
              currentPage.drawText(currentLine, {
                x: marginH + indent,
                y: cursorY,
                size,
                font,
                color,
              })
            } catch {}
            cursorY -= size * lineSpacing
          }
          currentLine = word
        }
      }

      if (currentLine) {
        if (cursorY < minContentY) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight])
          cursorY = pageHeight - marginV
        }
        try {
          currentPage.drawText(currentLine, {
            x: marginH + indent,
            y: cursorY,
            size,
            font,
            color,
          })
        } catch {}
        cursorY -= size * lineSpacing
      }
    }

    // Process blocks in order
    for (const block of pageData.blocks) {
      const trimmed = sanitizeSpanishTextForPdf(block.text.trim())
      if (!trimmed) continue

      switch (block.type) {
        case "title": {
          cursorY -= 8
          wrapAndDrawText(trimmed, fontBold, baseFontSize * 1.6, textDark)
          cursorY -= 8
          break
        }

        case "heading": {
          cursorY -= 6
          wrapAndDrawText(trimmed, fontBold, baseFontSize * 1.35, textDark)
          cursorY -= 5
          break
        }

        case "subheading": {
          cursorY -= 4
          wrapAndDrawText(trimmed, fontBold, baseFontSize * 1.15, rgb(0.2, 0.22, 0.28))
          cursorY -= 3
          break
        }

        case "list_item": {
          const bullet = "•"
          const cleanItem = trimmed.replace(/^([•*\-–—]|(\d+|[a-zA-Z])[.)])\s*/, "")
          try {
            currentPage.drawText(bullet, {
              x: marginH + 6,
              y: cursorY,
              size: baseFontSize,
              font: fontBold,
              color: textDark,
            })
          } catch {}
          wrapAndDrawText(
            cleanItem,
            block.isBold ? fontBold : fontRegular,
            baseFontSize,
            textDark,
            20
          )
          cursorY -= 3
          break
        }

        case "table_row": {
          const cols = trimmed.split(/\s{2,}|\t/).filter(Boolean)
          const targetFont = block.isBold ? fontBold : fontRegular
          if (cols.length >= 2) {
            const colWidth = maxContentW / cols.length
            cols.forEach((colText, cIdx) => {
              const xPos = marginH + cIdx * colWidth
              try {
                currentPage.drawText(colText.slice(0, 35), {
                  x: xPos,
                  y: cursorY,
                  size: baseFontSize * 0.95,
                  font: targetFont,
                  color: textDark,
                })
              } catch {}
            })
            cursorY -= baseFontSize * lineSpacing + 2
          } else {
            wrapAndDrawText(trimmed, targetFont, baseFontSize, textDark)
            cursorY -= 3
          }
          break
        }

        case "paragraph":
        default: {
          const targetFont = block.isBold ? fontBold : fontRegular
          wrapAndDrawText(trimmed, targetFont, baseFontSize, textDark)
          cursorY -= 4 // Paragraph gap
          break
        }
      }
    }

    // Optional page number only if explicitly configured
    if (options.addPageNumbers) {
      const footerText = `${pIdx + 1}`
      const footerW = fontRegular.widthOfTextAtSize(footerText, 9)
      currentPage.drawText(footerText, {
        x: (pageWidth - footerW) / 2,
        y: marginV - 20,
        size: 9,
        font: fontRegular,
        color: rgb(0.45, 0.45, 0.5),
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as any], { type: "application/pdf" })
}
