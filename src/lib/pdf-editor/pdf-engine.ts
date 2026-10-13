import { PDFDocument, degrees } from "pdf-lib"
import JSZip from "jszip"
import {
  DocumentPage,
  LoadedPdfFile,
  SplitMode,
  SplitResultItem,
} from "./types"

// Lazy loader for pdfjs-dist in the browser
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

export interface LoadPdfResult {
  file: LoadedPdfFile
  pages: DocumentPage[]
}

/**
 * Loads a PDF file, extracts page metadata and validates its structure.
 * Gracefully handles passwords and corrupted files.
 */
export async function loadPdfFile(
  file: File,
  fileId: string,
  colorIndex: number,
  password?: string
): Promise<LoadPdfResult> {
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
        "El archivo está protegido con contraseña. Por favor ingresá la contraseña para desbloquearlo."
      )
    }
    throw new Error(
      `No se pudo leer el archivo "${file.name}". Puede estar dañado o tener un formato incompatible.`
    )
  }

  // Load in pdf-lib to get page rotation and verify compatibility
  let pdfLibDoc: PDFDocument
  try {
    pdfLibDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    })
  } catch {
    throw new Error(
      `El archivo "${file.name}" tiene una estructura PDF no estándar o encriptación no compatible.`
    )
  }

  const numPages = pdfDoc.numPages
  const pages: DocumentPage[] = []

  const pdfLibPages = pdfLibDoc.getPages()

  for (let i = 0; i < numPages; i++) {
    const libPage = pdfLibPages[i]
    const initialRotation = libPage ? libPage.getRotation().angle || 0 : 0
    const { width, height } = libPage ? libPage.getSize() : { width: 595, height: 842 }

    pages.push({
      id: `${fileId}_p${i + 1}_${Math.random().toString(36).substring(2, 7)}`,
      sourceFileId: fileId,
      sourceFileName: file.name,
      sourceFileColorIndex: colorIndex,
      originalPageIndex: i,
      displayPageNumber: i + 1,
      customRotation: 0,
      initialRotation,
      width,
      height,
    })
  }

  const loadedFile: LoadedPdfFile = {
    id: fileId,
    name: file.name,
    size: file.size,
    pageCount: numPages,
    arrayBuffer,
    colorIndex,
  }

  return { file: loadedFile, pages }
}

/**
 * Render a single page thumbnail as a Data URL with low memory footprint.
 */
export async function renderPdfThumbnail(
  arrayBuffer: ArrayBuffer,
  pageIndex: number,
  targetWidth: number = 240,
  password?: string
): Promise<string> {
  const pdfjs = await getPdfJs()
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer.slice(0),
    password: password || undefined,
  })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageIndex + 1) // 1-indexed in pdfjs

  const unscaledViewport = page.getViewport({ scale: 1.0 })
  const scale = targetWidth / unscaledViewport.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: false })
  if (!ctx) throw new Error("No se pudo obtener el contexto 2D del lienzo.")

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  }

  await page.render(renderContext).promise

  const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
  // Release canvas dimensions to free memory immediately
  canvas.width = 0
  canvas.height = 0

  return dataUrl
}

/**
 * Exports a new PDF by combining, reordering and rotating the selected pages.
 */
export async function exportCombinedPdf(
  pages: DocumentPage[],
  sourceFiles: LoadedPdfFile[]
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error("No hay páginas para generar el documento PDF.")
  }

  const mergedDoc = await PDFDocument.create()

  // Pre-load pdf-lib documents for each source file to reuse cached parsed ASTs
  const pdfDocMap = new Map<string, PDFDocument>()
  for (const sf of sourceFiles) {
    try {
      const doc = await PDFDocument.load(sf.arrayBuffer, { ignoreEncryption: true })
      pdfDocMap.set(sf.id, doc)
    } catch {
      // Ignore if not loadable
    }
  }

  for (const pageItem of pages) {
    if (pageItem.isScanned && pageItem.scannedImageBlob) {
      // Scanned page: embed image directly
      const buffer = await pageItem.scannedImageBlob.arrayBuffer()
      let embeddedImg: any = null
      try {
        embeddedImg = await mergedDoc.embedJpg(buffer)
      } catch {
        embeddedImg = await mergedDoc.embedPng(buffer)
      }

      const imgWidth = embeddedImg.width
      const imgHeight = embeddedImg.height

      // Default to A4 dimensions (595.28 x 841.89 points) or fit
      const a4Width = 595.28
      const a4Height = 841.89

      // Scale image to fit within A4 margins
      const margin = 20
      const availableW = a4Width - margin * 2
      const availableH = a4Height - margin * 2

      const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1)
      const renderW = imgWidth * scale
      const renderH = imgHeight * scale

      const posX = (a4Width - renderW) / 2
      const posY = (a4Height - renderH) / 2

      const newPage = mergedDoc.addPage([a4Width, a4Height])
      newPage.drawImage(embeddedImg, {
        x: posX,
        y: posY,
        width: renderW,
        height: renderH,
      })

      if (pageItem.customRotation !== 0) {
        const totalRot = (pageItem.customRotation % 360 + 360) % 360
        newPage.setRotation(degrees(totalRot))
      }
    } else {
      // Existing PDF page
      const sourceDoc = pdfDocMap.get(pageItem.sourceFileId)
      if (!sourceDoc) {
        throw new Error(`Archivo de origen no encontrado para la página ${pageItem.displayPageNumber}.`)
      }

      const [copiedPage] = await mergedDoc.copyPages(sourceDoc, [pageItem.originalPageIndex])
      const totalRotation =
        ((copiedPage.getRotation().angle || 0) + pageItem.customRotation) % 360
      copiedPage.setRotation(degrees((totalRotation % 360 + 360) % 360))
      mergedDoc.addPage(copiedPage)
    }
  }

  const pdfBytes = await mergedDoc.save()
  return new Blob([pdfBytes as any], { type: "application/pdf" })
}

/**
 * Splits a document according to chosen mode and returns individual split items.
 */
export async function splitPdfDocument(
  pages: DocumentPage[],
  sourceFiles: LoadedPdfFile[],
  mode: SplitMode,
  options: {
    chunkSize?: number
    ranges?: string
    baseName?: string
  }
): Promise<SplitResultItem[]> {
  if (pages.length === 0) {
    throw new Error("No hay páginas disponibles para dividir.")
  }

  const baseName = (options.baseName || "documento").replace(/\.pdf$/i, "")
  const results: SplitResultItem[] = []

  if (mode === "single_pages") {
    // Each page in its own PDF
    for (let i = 0; i < pages.length; i++) {
      const singlePage = [pages[i]]
      const blob = await exportCombinedPdf(singlePage, sourceFiles)
      results.push({
        id: `split_page_${i + 1}`,
        name: `${baseName}_pagina_${i + 1}.pdf`,
        pageCount: 1,
        description: `Página ${i + 1} de ${pages.length}`,
        blob,
        size: blob.size,
      })
    }
    return results
  }

  if (mode === "fixed_chunks") {
    const chunkSize = Math.max(1, options.chunkSize || 5)
    let partIndex = 1
    for (let i = 0; i < pages.length; i += chunkSize) {
      const chunkPages = pages.slice(i, i + chunkSize)
      const blob = await exportCombinedPdf(chunkPages, sourceFiles)
      const startPage = i + 1
      const endPage = Math.min(i + chunkSize, pages.length)
      results.push({
        id: `split_chunk_${partIndex}`,
        name: `${baseName}_parte_${partIndex}_(pag_${startPage}-${endPage}).pdf`,
        pageCount: chunkPages.length,
        description: `Páginas ${startPage} a ${endPage}`,
        blob,
        size: blob.size,
      })
      partIndex++
    }
    return results
  }

  if (mode === "ranges") {
    // Parse ranges like "1-3, 4-7, 8"
    const rawRanges = (options.ranges || "").split(",").map((r) => r.trim()).filter(Boolean)
    if (rawRanges.length === 0) {
      throw new Error("Por favor ingresá al menos un rango de páginas válido (ej. 1-3, 4-6).")
    }

    let rangeIndex = 1
    for (const r of rawRanges) {
      const rangeParts = r.split("-").map((p) => parseInt(p.trim(), 10))
      let start = rangeParts[0]
      let end = rangeParts.length > 1 ? rangeParts[1] : start

      if (isNaN(start) || start < 1 || start > pages.length) {
        throw new Error(`El número de inicio "${r}" no es válido. Debe estar entre 1 y ${pages.length}.`)
      }
      if (isNaN(end) || end < start || end > pages.length) {
        throw new Error(`El número final en el rango "${r}" debe ser mayor o igual a ${start} y no superar ${pages.length}.`)
      }

      const selectedPages = pages.slice(start - 1, end)
      const blob = await exportCombinedPdf(selectedPages, sourceFiles)
      results.push({
        id: `split_range_${rangeIndex}`,
        name: `${baseName}_rango_${start}-${end}.pdf`,
        pageCount: selectedPages.length,
        description: `Páginas ${start} a ${end}`,
        blob,
        size: blob.size,
      })
      rangeIndex++
    }
    return results
  }

  return results
}

/**
 * Packages all split PDF files into a single ZIP archive.
 */
export async function exportSplitZip(
  results: SplitResultItem[],
  zipFilename: string = "documentos_divididos.zip"
): Promise<Blob> {
  const zip = new JSZip()
  for (const item of results) {
    zip.file(item.name, item.blob)
  }
  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })
}

/**
 * Helper to format file sizes nicely (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
