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
export function preprocessCanvasForOcr(
  sourceCanvas: HTMLCanvasElement,
  maxDimension: number = 2200
): HTMLCanvasElement {
  let targetW = sourceCanvas.width
  let targetH = sourceCanvas.height

  if (targetW > maxDimension || targetH > maxDimension) {
    const ratio = Math.min(maxDimension / targetW, maxDimension / targetH)
    targetW = Math.round(targetW * ratio)
    targetH = Math.round(targetH * ratio)
  }

  const outCanvas = document.createElement("canvas")
  outCanvas.width = targetW
  outCanvas.height = targetH
  const ctx = outCanvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return sourceCanvas

  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH)
  const imgData = ctx.getImageData(0, 0, targetW, targetH)
  const data = imgData.data
  const len = data.length

  // High-contrast document enhancement
  for (let i = 0; i < len; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b

    // Document threshold stretch: clarify dark ink, whiten paper background
    let enhanced: number
    if (lum > 165) {
      enhanced = 255
    } else if (lum < 100) {
      enhanced = Math.max(0, lum * 0.6)
    } else {
      // Linear transition in midtones
      enhanced = ((lum - 100) / (165 - 100)) * 255
    }

    data[i] = enhanced
    data[i + 1] = enhanced
    data[i + 2] = enhanced
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
function classifyLine(
  text: string,
  lineIndex: number,
  totalLines: number,
  avgCharHeight?: number
): RecognizedBlockType {
  const trimmed = text.trim()
  if (!trimmed) return "paragraph"

  // Check for bullet list item
  if (/^([•*\-–—]|(\d+|[a-zA-Z])[.)])\s+/.test(trimmed)) {
    return "list_item"
  }

  // Check for table row (multiple columnar tokens separated by 2+ spaces or tabs)
  if (/\s{3,}|\t/.test(trimmed) && trimmed.split(/\s{2,}|\t/).length >= 2) {
    return "table_row"
  }

  // Check for Title: first 3 lines, short, capitalized or uppercase
  const isAllUpper =
    trimmed.length > 3 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-ZÁÉÍÓÚÑ]/.test(trimmed)
  if (lineIndex <= 2 && (isAllUpper || (trimmed.length < 55 && !trimmed.endsWith(".")))) {
    return lineIndex === 0 ? "title" : "heading"
  }

  // Check for Subheading
  if (trimmed.length < 50 && (isAllUpper || /^[A-ZÁÉÍÓÚÑ0-9\s:_-]{3,50}$/.test(trimmed))) {
    return "subheading"
  }

  return "paragraph"
}

/**
 * Processes an image using in-browser OCR (Tesseract.js) in Spanish (or specified language),
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

    if (onProgress) {
      onProgress(40, "Analizando texto y estructura de la página...")
    }

    const ret = await worker.recognize(imageCanvasOrBlob)
    const { data } = ret

    const fullText = (data.text || "").trim()
    const blocks: RecognizedBlock[] = []

    if (data.lines && data.lines.length > 0) {
      data.lines.forEach((line: any, idx: number) => {
        const lineText = (line.text || "").trim()
        if (!lineText) return

        const type = classifyLine(lineText, idx, data.lines.length)
        blocks.push({
          id: `block_${idx}_${Date.now()}`,
          type,
          text: lineText,
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
      lines.forEach((lineText: string, idx: number) => {
        blocks.push({
          id: `block_fallback_${idx}`,
          type: classifyLine(lineText, idx, lines.length),
          text: lineText.trim(),
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
      hasText: fullText.length > 10,
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

  // Standard A4: 595.28 x 841.89 points
  const pageWidth = 595.28
  const pageHeight = 841.89

  // Embed clean digital fonts
  let fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  let fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  let fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  if (options.fontFamily === "times") {
    fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  } else if (options.fontFamily === "courier") {
    fontRegular = await pdfDoc.embedFont(StandardFonts.Courier)
    fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold)
    fontItalic = await pdfDoc.embedFont(StandardFonts.CourierOblique)
  }

  const baseFontSize = options.fontSize || 10.5
  const lineSpacing = options.lineSpacing || 1.35
  const marginH = 48
  const marginV = 52
  const maxContentW = pageWidth - marginH * 2
  const minContentY = marginV + 20

  const totalPages = pages.length

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const pageData = pages[pIdx]
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
    let cursorY = pageHeight - marginV

    // Color definitions
    const textDark = rgb(0.12, 0.12, 0.16)
    const textMuted = rgb(0.4, 0.42, 0.48)
    const ruleColor = rgb(0.85, 0.86, 0.9)

    // Helper: Wrap text line by line within maxContentW
    const wrapAndDrawText = (
      text: string,
      font: any,
      size: number,
      color: any,
      indent: number = 0
    ) => {
      const words = text.split(" ")
      let currentLine = ""
      const usableW = maxContentW - indent

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testW = font.widthOfTextAtSize(testLine, size)

        if (testW <= usableW) {
          currentLine = testLine
        } else {
          // Draw line
          if (cursorY < minContentY) {
            // New page overflow
            currentPage = pdfDoc.addPage([pageWidth, pageHeight])
            cursorY = pageHeight - marginV
          }
          if (currentLine) {
            currentPage.drawText(currentLine, {
              x: marginH + indent,
              y: cursorY,
              size,
              font,
              color,
            })
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
        currentPage.drawText(currentLine, {
          x: marginH + indent,
          y: cursorY,
          size,
          font,
          color,
        })
        cursorY -= size * lineSpacing
      }
    }

    // Process blocks in order
    for (const block of pageData.blocks) {
      const trimmed = block.text.trim()
      if (!trimmed) continue

      switch (block.type) {
        case "title": {
          cursorY -= 8
          wrapAndDrawText(trimmed, fontBold, baseFontSize * 1.7, textDark)
          cursorY -= 4
          // Subtle horizontal separator rule under document title
          currentPage.drawLine({
            start: { x: marginH, y: cursorY },
            end: { x: pageWidth - marginH, y: cursorY },
            thickness: 1,
            color: ruleColor,
          })
          cursorY -= 12
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
          // Clean list bullet
          const bullet = "•"
          const cleanItem = trimmed.replace(/^([•*\-–—]|(\d+|[a-zA-Z])[.)])\s*/, "")
          currentPage.drawText(bullet, {
            x: marginH + 6,
            y: cursorY,
            size: baseFontSize,
            font: fontBold,
            color: textDark,
          })
          wrapAndDrawText(cleanItem, fontRegular, baseFontSize, textDark, 20)
          cursorY -= 3
          break
        }

        case "table_row": {
          // Format columnar items
          const cols = trimmed.split(/\s{2,}|\t/).filter(Boolean)
          if (cols.length >= 2) {
            const colWidth = maxContentW / cols.length
            cols.forEach((colText, cIdx) => {
              const xPos = marginH + cIdx * colWidth
              currentPage.drawText(colText.slice(0, 35), {
                x: xPos,
                y: cursorY,
                size: baseFontSize * 0.95,
                font: fontRegular,
                color: textDark,
              })
            })
            cursorY -= baseFontSize * lineSpacing + 2
          } else {
            wrapAndDrawText(trimmed, fontRegular, baseFontSize, textDark)
            cursorY -= 3
          }
          break
        }

        case "paragraph":
        default: {
          wrapAndDrawText(trimmed, fontRegular, baseFontSize, textDark)
          cursorY -= 4 // Paragraph gap
          break
        }
      }
    }

    // Draw footer page number
    const footerText = `Página ${pIdx + 1} de ${totalPages}`
    const footerW = fontRegular.widthOfTextAtSize(footerText, 9)
    currentPage.drawText(footerText, {
      x: (pageWidth - footerW) / 2,
      y: marginV - 20,
      size: 9,
      font: fontRegular,
      color: textMuted,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as any], { type: "application/pdf" })
}
