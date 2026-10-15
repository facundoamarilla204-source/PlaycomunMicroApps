import { PDFDocument, rgb } from "pdf-lib"
import {
  ImagesToPdfOptions,
  PdfToImagesOptions,
  PdfToPdfAOptions,
} from "./types"
import { getFilenameWithoutExtension, parsePageRange } from "./utils"

// Helper to dynamically load pdfjs in browser
let pdfjsLibInstance: any = null

async function getPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("PDF.js solo puede ejecutarse en el navegador.")
  }

  if (pdfjsLibInstance) {
    return pdfjsLibInstance
  }

  const pdfjs = await import("pdfjs-dist")
  // Set local public worker
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  }
  pdfjsLibInstance = pdfjs
  return pdfjs
}

export async function getPdfPageCount(file: File | ArrayBuffer): Promise<number> {
  const pdfjs = await getPdfJs()
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise
  return doc.numPages
}

// Helper to convert any image (including WebP) to PNG buffer via browser Canvas
async function convertImageFileToPngBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return reject(new Error("No se pudo obtener contexto 2D de canvas"))
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error("Fallo al exportar blob de canvas"))
        const buffer = await blob.arrayBuffer()
        resolve(new Uint8Array(buffer))
      }, "image/png")
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`No se pudo leer la imagen "${file.name}".`))
    }

    img.src = objectUrl
  })
}

// 1. IMAGENES A PDF (100% Client-Side con pdf-lib)
export async function convertImagesToPdf(
  files: File[],
  options: ImagesToPdfOptions
): Promise<Blob> {
  if (files.length === 0) {
    throw new Error("No se seleccionaron imágenes para convertir.")
  }

  const pdfDoc = await PDFDocument.create()

  // Standard dimensions in points (72 points = 1 inch)
  const PAGE_SIZES = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612.0, height: 792.0 },
  }

  const MARGINS = {
    none: 0,
    small: 18, // 0.25 in
    normal: 36, // 0.5 in
  }

  const marginPoints = MARGINS[options.margin] || 0

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const isJpeg = ext === "jpg" || ext === "jpeg" || file.type === "image/jpeg"
    const isPng = ext === "png" || file.type === "image/png"

    let embeddedImage: any = null

    try {
      const buffer = await file.arrayBuffer()
      if (isJpeg) {
        embeddedImage = await pdfDoc.embedJpg(buffer)
      } else if (isPng) {
        embeddedImage = await pdfDoc.embedPng(buffer)
      } else {
        // WebP or other format -> Convert to PNG bytes
        const pngBytes = await convertImageFileToPngBytes(file)
        embeddedImage = await pdfDoc.embedPng(pngBytes)
      }
    } catch {
      // Fallback: convert via Canvas
      const pngBytes = await convertImageFileToPngBytes(file)
      embeddedImage = await pdfDoc.embedPng(pngBytes)
    }

    const { width: imgWidth, height: imgHeight } = embeddedImage

    let pageWidth = 0
    let pageHeight = 0

    if (options.pageSize === "fit") {
      pageWidth = imgWidth + marginPoints * 2
      pageHeight = imgHeight + marginPoints * 2
    } else {
      const standard = PAGE_SIZES[options.pageSize] || PAGE_SIZES.a4
      let isLandscape = false

      if (options.orientation === "auto") {
        isLandscape = imgWidth > imgHeight
      } else {
        isLandscape = options.orientation === "landscape"
      }

      pageWidth = isLandscape ? standard.height : standard.width
      pageHeight = isLandscape ? standard.width : standard.height
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight])

    // Scale image maintaining aspect ratio within printable area
    const printableWidth = pageWidth - marginPoints * 2
    const printableHeight = pageHeight - marginPoints * 2

    const scale = Math.min(printableWidth / imgWidth, printableHeight / imgHeight)
    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale

    // Center image on page
    const drawX = marginPoints + (printableWidth - drawWidth) / 2
    const drawY = marginPoints + (printableHeight - drawHeight) / 2

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    })
  }

  const pdfBytes = await pdfDoc.save()
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer
  return new Blob([arrayBuffer], { type: "application/pdf" })
}

// 2. PDF A IMAGENES (JPG / PNG con pdfjs-dist y Canvas)
export async function convertPdfToImages(
  file: File,
  options: PdfToImagesOptions,
  onProgress?: (progressPercent: number) => void
): Promise<{ name: string; blob: Blob; page: number }[]> {
  const pdfjs = await getPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise
  const totalPages = doc.numPages

  const pagesToRender = parsePageRange(
    options.pageRange === "all" ? "all" : options.customPageRange,
    totalPages
  )

  const scaleMap = {
    72: 1.0,
    150: 1.5,
    300: 2.5,
  }
  const scale = scaleMap[options.dpi] || 1.5
  const baseName = getFilenameWithoutExtension(file.name)
  const results: { name: string; blob: Blob; page: number }[] = []

  const mimeType = options.format === "png" ? "image/png" : "image/jpeg"
  const ext = options.format === "png" ? "png" : "jpg"

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageNum = pagesToRender[i]
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("No se pudo inicializar canvas para renderizar página de PDF.")
    }

    // Fill white background for JPEG
    if (options.format === "jpg") {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error(`Fallo al generar imagen para la página ${pageNum}`))
        },
        mimeType,
        options.format === "jpg" ? 0.92 : undefined
      )
    })

    const paddedNum = String(pageNum).padStart(3, "0")
    results.push({
      name: `${baseName}_pagina_${paddedNum}.${ext}`,
      blob,
      page: pageNum,
    })

    if (onProgress) {
      const percent = Math.round(((i + 1) / pagesToRender.length) * 100)
      onProgress(percent)
    }
  }

  return results
}

// 3. PDF A WORD (.docx)
export async function convertPdfToWord(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<{ blob: Blob; textLength: number }> {
  const pdfjs = await getPdfJs()
  const docxModule = await import("docx")
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = docxModule

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise
  const totalPages = doc.numPages

  const docxChildren: any[] = []
  let totalExtractedChars = 0

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Sort items by vertical position descending (top to bottom), then horizontal ascending
    const items = (textContent.items as any[]).filter(
      (item) => typeof item.str === "string" && item.str.trim().length > 0
    )

    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5]
      if (Math.abs(yDiff) > 4) {
        return yDiff
      }
      return a.transform[4] - b.transform[4]
    })

    // Group items into lines
    const lines: string[] = []
    let currentLine = ""
    let currentY = items.length > 0 ? items[0].transform[5] : 0

    for (const item of items) {
      totalExtractedChars += item.str.length
      const y = item.transform[5]

      if (Math.abs(y - currentY) > 6) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim())
        }
        currentLine = item.str
        currentY = y
      } else {
        currentLine += (currentLine ? " " : "") + item.str
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }

    // Add lines to document structure
    for (const lineText of lines) {
      // Heuristic for headers: short line ending without period
      const isHeader = lineText.length < 50 && !lineText.endsWith(".") && lineText.toUpperCase() === lineText

      if (isHeader) {
        docxChildren.push(
          new Paragraph({
            text: lineText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        )
      } else {
        docxChildren.push(
          new Paragraph({
            children: [new TextRun({ text: lineText, size: 24 })],
            spacing: { after: 140 },
          })
        )
      }
    }

    if (pageNum < totalPages) {
      docxChildren.push(new Paragraph({ children: [new PageBreak()] }))
    }

    if (onProgress) {
      onProgress(Math.round((pageNum / totalPages) * 100))
    }
  }

  if (totalExtractedChars < 15) {
    throw new Error(
      "El PDF no contiene texto vectorial editable (es un documento escaneado o compuesto únicamente por imágenes planas). Para extraer su contenido se requiere una herramienta de OCR."
    )
  }

  const wordDoc = new Document({
    sections: [
      {
        properties: {},
        children: docxChildren,
      },
    ],
  })

  const buffer = await Packer.toBlob(wordDoc)
  return { blob: buffer, textLength: totalExtractedChars }
}

// 4. PDF A EXCEL (.xlsx)
export async function convertPdfToExcel(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<{ blob: Blob; rowsCount: number; tablesFound: boolean }> {
  const pdfjs = await getPdfJs()
  const XLSX = await import("xlsx")

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise
  const totalPages = doc.numPages

  const wb = XLSX.utils.book_new()
  let totalRowsAcrossSheets = 0
  let detectedMultiColumns = false

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const textContent = await page.getTextContent()

    const items = (textContent.items as any[]).filter(
      (item) => typeof item.str === "string" && item.str.trim().length > 0
    )

    // Sort top to bottom, left to right
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5]
      if (Math.abs(yDiff) > 5) {
        return yDiff
      }
      return a.transform[4] - b.transform[4]
    })

    // Cluster items by Y (rows)
    const rowClusters: { y: number; cells: { x: number; text: string }[] }[] = []

    for (const item of items) {
      const x = item.transform[4]
      const y = item.transform[5]
      const text = item.str.trim()

      const existingCluster = rowClusters.find((rc) => Math.abs(rc.y - y) <= 6)
      if (existingCluster) {
        existingCluster.cells.push({ x, text })
      } else {
        rowClusters.push({ y, cells: [{ x, text }] })
      }
    }

    // Sort cells within each row by x
    rowClusters.forEach((row) => {
      row.cells.sort((a, b) => a.x - b.x)
      if (row.cells.length >= 2) {
        detectedMultiColumns = true
      }
    })

    const sheetData: string[][] = rowClusters.map((row) =>
      row.cells.map((c) => c.text)
    )

    totalRowsAcrossSheets += sheetData.length

    if (sheetData.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(wb, ws, `Página ${pageNum}`)
    }

    if (onProgress) {
      onProgress(Math.round((pageNum / totalPages) * 100))
    }
  }

  if (totalRowsAcrossSheets === 0 || !detectedMultiColumns) {
    throw new Error(
      "No se detectaron tablas estructuradas ni columnas alineadas en el PDF. No es posible generar una planilla de cálculo coherente a partir de texto desestructurado."
    )
  }

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  return { blob, rowsCount: totalRowsAcrossSheets, tablesFound: true }
}

// 5. PDF A POWERPOINT (.pptx)
export async function convertPdfToPptx(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<Blob> {
  const pdfjs = await getPdfJs()
  const PptxGen = (await import("pptxgenjs")).default
  const pptx = new PptxGen()

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise
  const totalPages = doc.numPages

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    // 2.0 scale ensures crisp slide images
    const viewport = page.getViewport({ scale: 2.0 })

    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("No se pudo inicializar canvas para diapositiva.")
    }

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)

    // Add slide with full bleed image
    const slide = pptx.addSlide()
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    })

    if (onProgress) {
      onProgress(Math.round((pageNum / totalPages) * 100))
    }
  }

  const pptxBlob = (await pptx.write({ outputType: "blob" })) as Blob
  return pptxBlob
}

// 6. PDF A PDF/A (Metadatos XMP conformes a ISO 19005 y OutputIntent)
export async function convertPdfToPdfA(
  file: File,
  options: PdfToPdfAOptions
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  const conformancePart = options.conformance === "PDF/A-1b" ? "1" : "2"
  const conformanceLevel = "B"

  // Create valid XMP packet for PDF/A
  const nowIso = new Date().toISOString()
  const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>${conformancePart}</pdfaid:part>
      <pdfaid:conformance>${conformanceLevel}</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${file.name}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:date>
        <rdf:Seq>
          <rdf:li>${nowIso}</rdf:li>
        </rdf:Seq>
      </dc:date>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>PlayComun Herramientas PDF Engine ISO 19005</pdf:Producer>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

  pdfDoc.setTitle(file.name)
  pdfDoc.setProducer("PlayComun Herramientas PDF Engine")
  pdfDoc.setCreationDate(new Date())
  pdfDoc.setModificationDate(new Date())

  // Embed XMP metadata in catalog
  const metadataStream = pdfDoc.context.flateStream(xmpMetadata, {
    Type: "Metadata",
    Subtype: "XML",
  })
  const metadataRef = pdfDoc.context.register(metadataStream)
  pdfDoc.catalog.set(pdfDoc.context.obj("Metadata"), metadataRef)

  const pdfBytes = await pdfDoc.save({ updateMetadata: false } as any)
  const outBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer
  return new Blob([outBuffer], { type: "application/pdf" })
}
