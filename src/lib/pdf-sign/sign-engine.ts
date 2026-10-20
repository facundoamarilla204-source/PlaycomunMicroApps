import { PDFDocument, degrees } from "pdf-lib"
import {
  SignatureElement,
  PdfSignDocument,
  PdfPageInfo,
} from "./types"

// Lazy loader for pdfjs-dist in browser
let pdfjsLibInstance: any = null

export async function getPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("PDF.js solo puede ejecutarse en el navegador.")
  }

  if (pdfjsLibInstance) {
    return pdfjsLibInstance
  }

  const pdfjs = await import("pdfjs-dist")
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  }
  pdfjsLibInstance = pdfjs
  return pdfjs
}

/**
 * Loads a PDF file and extracts page geometry, rotation and metadata.
 */
export async function loadPdfForSigning(
  file: File,
  password?: string
): Promise<PdfSignDocument> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfjs = await getPdfJs()

  let pdfDoc: any = null
  try {
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer.slice(0),
      password: password || undefined,
    })
    pdfDoc = await loadingTask.promise
  } catch (err: any) {
    if (err?.name === "PasswordException") {
      throw new Error(
        "El archivo está protegido con contraseña. Por favor ingresá la clave para desbloquearlo."
      )
    }
    throw new Error(
      `No se pudo leer el archivo "${file.name}". Puede estar dañado o tener un formato incompatible.`
    )
  }

  // Also load into pdf-lib to verify structure
  let pdfLibDoc: PDFDocument
  try {
    pdfLibDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  } catch {
    throw new Error(
      `El archivo "${file.name}" tiene una estructura no estándar o cifrado no compatible.`
    )
  }

  const numPages = pdfDoc.numPages
  if (numPages === 0) {
    throw new Error("El documento no contiene páginas para firmar.")
  }

  const pages: PdfPageInfo[] = []
  const pdfLibPages = pdfLibDoc.getPages()

  for (let i = 0; i < numPages; i++) {
    const libPage = pdfLibPages[i]
    const rawRotation = libPage ? libPage.getRotation().angle || 0 : 0
    const rotation = ((rawRotation % 360) + 360) % 360
    const { width, height } = libPage
      ? libPage.getSize()
      : { width: 595.28, height: 841.89 }

    const isRotated90or270 = rotation === 90 || rotation === 270
    const visualWidth = isRotated90or270 ? height : width
    const visualHeight = isRotated90or270 ? width : height

    pages.push({
      pageIndex: i,
      displayPageNumber: i + 1,
      width,
      height,
      rotation,
      visualWidth,
      visualHeight,
    })
  }

  return {
    file,
    fileName: file.name,
    fileSize: file.size,
    arrayBuffer,
    numPages,
    pages,
  }
}

/**
 * Renders a specific page onto an HTML Canvas element at the requested scale/zoom.
 */
export async function renderPdfPageToCanvas(
  arrayBuffer: ArrayBuffer,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  password?: string
): Promise<{ width: number; height: number }> {
  const pdfjs = await getPdfJs()
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer.slice(0),
    password: password || undefined,
  })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageIndex + 1)

  const viewport = page.getViewport({ scale })
  const ctx = canvas.getContext("2d", { willReadFrequently: false })
  if (!ctx) {
    throw new Error("No se pudo obtener el contexto 2D del lienzo.")
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * dpr)
  canvas.height = Math.floor(viewport.height * dpr)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  ctx.scale(dpr, dpr)

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  }

  await page.render(renderContext).promise

  return {
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  }
}

/**
 * Renders a single page thumbnail for the page navigator.
 */
export async function renderPageThumbnail(
  arrayBuffer: ArrayBuffer,
  pageIndex: number,
  targetWidth: number = 180,
  password?: string
): Promise<string> {
  const pdfjs = await getPdfJs()
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer.slice(0),
    password: password || undefined,
  })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageIndex + 1)

  const unscaled = page.getViewport({ scale: 1.0 })
  const scale = targetWidth / unscaled.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: false })
  if (!ctx) throw new Error("Canvas 2D context error")

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise

  const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
  canvas.width = 0
  canvas.height = 0
  return dataUrl
}

/**
 * Calculates exact native PDF coordinates for an element placed visually on a page,
 * taking into account native width/height and all 4 rotation states (0, 90, 180, 270).
 */
export function calculatePdfPlacement(
  pageWidth: number,
  pageHeight: number,
  pageRotation: number,
  el: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number; rotateDegrees: number } {
  const rot = ((pageRotation % 360) + 360) % 360

  const isRotated = rot === 90 || rot === 270
  const visualWidth = isRotated ? pageHeight : pageWidth
  const visualHeight = isRotated ? pageWidth : pageHeight

  const vx = el.x * visualWidth
  const vy = el.y * visualHeight
  const vw = el.width * visualWidth
  const vh = el.height * visualHeight

  switch (rot) {
    case 90:
      // Native Y is along visual X; Native X is along visual Y
      return {
        x: vy,
        y: vx + vw,
        width: vw,
        height: vh,
        rotateDegrees: 270,
      }
    case 180:
      // Page upside-down
      return {
        x: pageWidth - vx,
        y: vy + vh,
        width: vw,
        height: vh,
        rotateDegrees: 180,
      }
    case 270:
      return {
        x: pageWidth - vy,
        y: pageHeight - (vx + vw),
        width: vw,
        height: vh,
        rotateDegrees: 90,
      }
    case 0:
    default:
      // Standard unrotated page (0,0 is bottom-left in PDF)
      return {
        x: vx,
        y: pageHeight - vy - vh,
        width: vw,
        height: vh,
        rotateDegrees: 0,
      }
  }
}

/**
 * Converts a base64 Data URL to Uint8Array buffer.
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "")
  if (typeof atob === "function") {
    const binStr = atob(base64)
    const len = binStr.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i)
    }
    return bytes
  } else {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64, "base64"))
  }
}

/**
 * Embeds all signatures, initials and logos into the original PDF bytes using pdf-lib.
 * Returns a downloadable PDF Blob.
 */
export async function embedSignaturesIntoPdf(
  originalArrayBuffer: ArrayBuffer,
  elements: SignatureElement[]
): Promise<Blob> {
  if (elements.length === 0) {
    // Return original PDF if no elements placed
    return new Blob([originalArrayBuffer], { type: "application/pdf" })
  }

  const pdfDoc = await PDFDocument.load(originalArrayBuffer, {
    ignoreEncryption: true,
  })

  // Cache embedded images so identical signatures aren't duplicated in the PDF file
  const imageCache = new Map<string, any>()

  for (const el of elements) {
    const pageIndex = el.pageIndex
    if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue

    const page = pdfDoc.getPage(pageIndex)
    const nativeWidth = page.getWidth()
    const nativeHeight = page.getHeight()
    const rotation = ((page.getRotation().angle % 360) + 360) % 360

    let embeddedImage = imageCache.get(el.dataUrl)
    if (!embeddedImage) {
      const bytes = dataUrlToBytes(el.dataUrl)
      try {
        embeddedImage = await pdfDoc.embedPng(bytes)
      } catch {
        embeddedImage = await pdfDoc.embedJpg(bytes)
      }
      imageCache.set(el.dataUrl, embeddedImage)
    }

    const placement = calculatePdfPlacement(nativeWidth, nativeHeight, rotation, {
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    })

    page.drawImage(embeddedImage, {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      rotate: degrees(placement.rotateDegrees),
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as any], { type: "application/pdf" })
}

/**
 * Generates a transparent PNG image from handwritten text using Canvas.
 */
export async function generateTextSignature(
  text: string,
  fontFamily: string,
  color: string,
  options?: { isInitials?: boolean }
): Promise<string> {
  const isInitials = options?.isInitials ?? false
  const cleanText = text.trim() || (isInitials ? "FA" : "Firma")

  if (typeof document === "undefined") {
    throw new Error("generateTextSignature solo puede ejecutarse en el navegador.")
  }

  // Ensure document fonts are loaded before drawing on canvas
  try {
    if (document.fonts) {
      await document.fonts.ready
    }
  } catch {}

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Canvas context 2D error")

  const fontSize = isInitials ? 120 : 90
  const fontSpec = `600 ${fontSize}px ${fontFamily}`
  ctx.font = fontSpec

  const textMetrics = ctx.measureText(cleanText)
  const textWidth = Math.ceil(textMetrics.width)
  const textHeight = Math.ceil(fontSize * 1.4)

  const paddingX = Math.max(30, Math.ceil(fontSize * 0.3))
  const paddingY = Math.max(30, Math.ceil(fontSize * 0.3))

  const totalWidth = textWidth + paddingX * 2
  const totalHeight = textHeight + paddingY * 2

  const dpr = 2 // High resolution
  canvas.width = totalWidth * dpr
  canvas.height = totalHeight * dpr

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, totalWidth, totalHeight)

  ctx.font = fontSpec
  ctx.fillStyle = color
  ctx.textBaseline = "middle"
  ctx.textAlign = "center"

  ctx.fillText(cleanText, totalWidth / 2, totalHeight / 2)

  // Trim whitespace
  const trimmed = trimCanvasWhitespace(canvas)
  const dataUrl = trimmed.toDataURL("image/png")

  canvas.width = 0
  canvas.height = 0
  trimmed.width = 0
  trimmed.height = 0

  return dataUrl
}

/**
 * Trims blank/transparent margins around a canvas.
 */
export function trimCanvasWhitespace(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return sourceCanvas

  const w = sourceCanvas.width
  const h = sourceCanvas.height
  const imgData = ctx.getImageData(0, 0, w, h)
  const data = imgData.data

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    // Empty canvas fallback
    return sourceCanvas
  }

  const pad = 12
  const cropX = Math.max(0, minX - pad)
  const cropY = Math.max(0, minY - pad)
  const cropW = Math.min(w - cropX, maxX - minX + pad * 2)
  const cropH = Math.min(h - cropY, maxY - minY + pad * 2)

  const trimmedCanvas = document.createElement("canvas")
  trimmedCanvas.width = cropW
  trimmedCanvas.height = cropH

  const trimmedCtx = trimmedCanvas.getContext("2d")
  if (!trimmedCtx) return sourceCanvas

  trimmedCtx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  )

  return trimmedCanvas
}

/**
 * Processes an uploaded image (PNG/JPG/WebP), optionally removing white paper background,
 * and auto-trimming transparent borders.
 */
export async function processUploadedSignatureImage(
  file: File,
  removeWhiteBackground: boolean
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Error al leer la imagen seleccionada."))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("No se pudo decodificar el archivo de imagen."))
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight

          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (!ctx) throw new Error("Canvas context 2D no disponible.")

          ctx.drawImage(img, 0, 0)

          if (removeWhiteBackground) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imgData.data

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i]
              const g = data[i + 1]
              const b = data[i + 2]
              const alpha = data[i + 3]

              if (alpha === 0) continue

              // Luminance calculation
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b

              // Thresholds: if near white, make transparent with smooth falloff
              if (luminance >= 240) {
                data[i + 3] = 0
              } else if (luminance >= 190) {
                // Smooth transition
                const factor = (240 - luminance) / 50
                data[i + 3] = Math.floor(alpha * factor)
              }
            }

            ctx.putImageData(imgData, 0, 0)
          }

          const trimmed = trimCanvasWhitespace(canvas)
          const dataUrl = trimmed.toDataURL("image/png")
          const width = trimmed.width
          const height = trimmed.height
          const aspectRatio = width / Math.max(1, height)

          canvas.width = 0
          canvas.height = 0
          trimmed.width = 0
          trimmed.height = 0

          resolve({ dataUrl, width, height, aspectRatio })
        } catch (err) {
          reject(err)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
