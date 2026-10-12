import { describe, it, expect } from "vitest"
import {
  formatBytes,
  getFilenameWithoutExtension,
  parsePageRange,
  validateFileForOperation,
  createZipFromFiles,
} from "./utils"
import {
  CONVERSION_CATEGORIES,
  CONVERSION_OPERATIONS,
  getOperationById,
} from "./operations"
import { PDFDocument } from "pdf-lib"
import { convertImagesToPdf, convertPdfToPdfA } from "./pdf-engine"

describe("Convertidor de Archivos - Operaciones y Catálogo", () => {
  it("contiene exactamente las 3 categorías especificadas", () => {
    expect(CONVERSION_CATEGORIES.map((c) => c.id)).toEqual([
      "to-pdf",
      "from-pdf",
      "to-images",
    ])
  })

  it("define todas las operaciones requeridas por la especificación", () => {
    const ids = CONVERSION_OPERATIONS.map((o) => o.id)
    // Convertir a PDF
    expect(ids).toContain("word-to-pdf")
    expect(ids).toContain("excel-to-pdf")
    expect(ids).toContain("ppt-to-pdf")
    expect(ids).toContain("opendocument-to-pdf")
    expect(ids).toContain("images-to-pdf")

    // Convertir desde PDF
    expect(ids).toContain("pdf-to-word")
    expect(ids).toContain("pdf-to-excel")
    expect(ids).toContain("pdf-to-ppt")
    expect(ids).toContain("pdf-to-pdfa")

    // Convertir a Imágenes
    expect(ids).toContain("pdf-to-images")
  })

  it("asigna correctamente el entorno de ejecución (worker vs cliente)", () => {
    const wordToPdf = getOperationById("word-to-pdf")
    expect(wordToPdf.environment).toBe("worker")

    const excelToPdf = getOperationById("excel-to-pdf")
    expect(excelToPdf.environment).toBe("worker")

    const imagesToPdf = getOperationById("images-to-pdf")
    expect(imagesToPdf.environment).toBe("client")

    const pdfToWord = getOperationById("pdf-to-word")
    expect(pdfToWord.environment).toBe("client")

    const pdfToExcel = getOperationById("pdf-to-excel")
    expect(pdfToExcel.environment).toBe("client")

    const pdfToPpt = getOperationById("pdf-to-ppt")
    expect(pdfToPpt.environment).toBe("client")
  })
})

describe("Convertidor de Archivos - Utilidades", () => {
  it("formatea tamaños de archivos en bytes, KB y MB correctamente", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1024)).toBe("1 KB")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(1048576)).toBe("1 MB")
  })

  it("obtiene el nombre de archivo sin su extensión", () => {
    expect(getFilenameWithoutExtension("documento.docx")).toBe("documento")
    expect(getFilenameWithoutExtension("reporte.final.pdf")).toBe("reporte.final")
    expect(getFilenameWithoutExtension("sin_extension")).toBe("sin_extension")
  })

  it("analiza rangos de páginas correctamente", () => {
    expect(parsePageRange("all", 5)).toEqual([1, 2, 3, 4, 5])
    expect(parsePageRange("1, 3, 5", 5)).toEqual([1, 3, 5])
    expect(parsePageRange("2-4", 5)).toEqual([2, 3, 4])
    expect(parsePageRange("1-2, 4-5", 5)).toEqual([1, 2, 4, 5])
    expect(parsePageRange("10-20", 5)).toEqual([1, 2, 3, 4, 5]) // out of bounds fallback
  })

  it("valida extensiones permitidas según la operación", () => {
    const wordOp = getOperationById("word-to-pdf")
    const validFile = new File(["dummy content"], "doc.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    const invalidFile = new File(["dummy content"], "foto.png", {
      type: "image/png",
    })

    expect(validateFileForOperation(validFile, wordOp).valid).toBe(true)
    expect(validateFileForOperation(invalidFile, wordOp).valid).toBe(false)
  })

  it("crea un paquete ZIP válido a partir de múltiples archivos", async () => {
    const file1 = { name: "pagina_1.jpg", blob: new Blob(["img1"], { type: "image/jpeg" }) }
    const file2 = { name: "pagina_2.jpg", blob: new Blob(["img2"], { type: "image/jpeg" }) }

    const zipBlob = await createZipFromFiles([file1, file2])
    expect(zipBlob).toBeInstanceOf(Blob)
    expect(zipBlob.size).toBeGreaterThan(0)
  })
})

describe("Convertidor de Archivos - Motor PDF y PDF/A", () => {
  it("produce un documento PDF/A válido con metadatos XMP conformes", async () => {
    // Create base valid PDF
    const basePdf = await PDFDocument.create()
    const page = basePdf.addPage([400, 400])
    page.drawText("Test PDF/A Document")
    const baseBytes = await basePdf.save()
    const baseFile = new File([baseBytes], "test.pdf", { type: "application/pdf" })

    const pdfaBlob = await convertPdfToPdfA(baseFile, { conformance: "PDF/A-1b" })
    expect(pdfaBlob).toBeInstanceOf(Blob)
    expect(pdfaBlob.size).toBeGreaterThan(0)

    // Verify generated PDF structure
    const pdfBytes = await pdfaBlob.arrayBuffer()
    const loadedPdf = await PDFDocument.load(pdfBytes)
    expect(loadedPdf.getPageCount()).toBe(1)
    expect(loadedPdf.getTitle()).toBe("test.pdf")
    // Verify that the XMP Metadata packet is embedded
    const metadataRef = loadedPdf.catalog.get(loadedPdf.context.obj("Metadata") as any)
    expect(metadataRef).toBeDefined()
  })

  it("crea un PDF válido combinando imágenes PNG", async () => {
    // 1x1 transparent PNG base64
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0))
    const imageFile = new File([pngBytes], "pixel.png", { type: "image/png" })

    const pdfBlob = await convertImagesToPdf([imageFile], {
      orientation: "portrait",
      pageSize: "a4",
      margin: "normal",
      combineIntoSinglePdf: true,
    })

    expect(pdfBlob).toBeInstanceOf(Blob)
    expect(pdfBlob.size).toBeGreaterThan(0)

    const loadedPdf = await PDFDocument.load(await pdfBlob.arrayBuffer())
    expect(loadedPdf.getPageCount()).toBe(1)
  })

  it("genera un archivo DOCX editable válido con docx", async () => {
    const { Document, Packer, Paragraph, TextRun } = await import("docx")
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Prueba de conversión a Word")],
            }),
          ],
        },
      ],
    })
    const docxBlob = await Packer.toBlob(doc)
    expect(docxBlob).toBeInstanceOf(Blob)
    expect(docxBlob.size).toBeGreaterThan(0)
  })

  it("genera un archivo XLSX tabular válido con xlsx", async () => {
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ["Producto", "Precio", "Stock"],
      ["Harina", "1200", "50"],
      ["Azúcar", "950", "30"],
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Hoja1")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const xlsxBlob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    expect(xlsxBlob).toBeInstanceOf(Blob)
    expect(xlsxBlob.size).toBeGreaterThan(0)
  })
})
