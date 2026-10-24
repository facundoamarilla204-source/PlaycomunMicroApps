import { describe, it, expect } from "vitest"
import { PDFDocument } from "pdf-lib"
import {
  reconstructDigitalPdf,
  RecognizedPageContent,
  RecognizedBlock,
} from "./ocr-reconstruction"

describe("OCR Document Reconstruction Engine", () => {
  it("reconstructs an A4 digital PDF from recognized OCR content with zero embedded photos", async () => {
    const page1Blocks: RecognizedBlock[] = [
      {
        id: "b1",
        type: "title",
        text: "CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL",
        confidence: 96,
      },
      {
        id: "b2",
        type: "subheading",
        text: "PRIMERO - COMPARECIENTES Y OBJETO",
        confidence: 94,
      },
      {
        id: "b3",
        type: "paragraph",
        text: "En la ciudad de Buenos Aires, a los 24 días del mes de octubre de 2026, entre las partes que suscriben el presente instrumento se conviene celebrar el siguiente acuerdo sujeto a las cláusulas que a continuación se detallan.",
        confidence: 95,
      },
      {
        id: "b4",
        type: "list_item",
        text: "• El destino del inmueble será exclusivamente comercial.",
        confidence: 98,
      },
      {
        id: "b5",
        type: "list_item",
        text: "• El plazo de vigencia pactado es de veinticuatro meses corridos.",
        confidence: 97,
      },
      {
        id: "b6",
        type: "table_row",
        text: "Concepto      Monto Mensual      Vencimiento",
        confidence: 92,
      },
      {
        id: "b7",
        type: "table_row",
        text: "Canon Locativo      $ 350.000      Día 10 de cada mes",
        confidence: 91,
      },
    ]

    const testPages: RecognizedPageContent[] = [
      {
        pageIndex: 0,
        fullText: page1Blocks.map((b) => b.text).join("\n"),
        blocks: page1Blocks,
        confidence: 95,
        hasText: true,
      },
    ]

    const pdfBlob = await reconstructDigitalPdf(testPages, {
      documentTitle: "Contrato Comercial",
      fontFamily: "helvetica",
      fontSize: 11,
    })

    expect(pdfBlob).toBeInstanceOf(Blob)
    expect(pdfBlob.type).toBe("application/pdf")
    expect(pdfBlob.size).toBeGreaterThan(0)

    // Load in pdf-lib to inspect internal structure
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    // Check page count and A4 dimensions (595.28 x 841.89 pt)
    expect(pdfDoc.getPageCount()).toBe(1)
    const page = pdfDoc.getPage(0)
    expect(Math.round(page.getWidth())).toBe(595)
    expect(Math.round(page.getHeight())).toBe(842)

    // TECHNICAL VERIFICATION: Ensure ZERO images are embedded in the PDF
    const { PDFName } = await import("pdf-lib")
    let hasImage = false
    let fontCount = 0

    const indirectObjects = pdfDoc.context.enumerateIndirectObjects()
    for (const [, obj] of indirectObjects) {
      if ((obj as any).dict) {
        const subtype = (obj as any).dict.get(PDFName.of("Subtype"))
        if (subtype === PDFName.of("Image")) {
          hasImage = true
        }
        const type = (obj as any).dict.get(PDFName.of("Type"))
        if (type === PDFName.of("Font")) {
          fontCount++
        }
      }
    }

    expect(hasImage).toBe(false)
    expect(fontCount).toBeGreaterThanOrEqual(1)
  })

  it("reconstructs multi-page documents in sequential order", async () => {
    const multiPages: RecognizedPageContent[] = [
      {
        pageIndex: 0,
        fullText: "Página 1",
        blocks: [
          { id: "p1_b1", type: "title", text: "INFORME TÉCNICO - HOJA 1", confidence: 95 },
          { id: "p1_b2", type: "paragraph", text: "Contenido de la primera hoja.", confidence: 95 },
        ],
        confidence: 95,
        hasText: true,
      },
      {
        pageIndex: 1,
        fullText: "Página 2",
        blocks: [
          { id: "p2_b1", type: "heading", text: "ANEXO B - HOJA 2", confidence: 94 },
          { id: "p2_b2", type: "paragraph", text: "Contenido de la segunda hoja.", confidence: 94 },
        ],
        confidence: 94,
        hasText: true,
      },
    ]

    const blob = await reconstructDigitalPdf(multiPages)
    const arrayBuf = await blob.arrayBuffer()
    const doc = await PDFDocument.load(arrayBuf)

    expect(doc.getPageCount()).toBe(2)
    expect(Math.round(doc.getPage(0).getWidth())).toBe(595)
    expect(Math.round(doc.getPage(1).getWidth())).toBe(595)

    // Verify no images in multi-page document either
    const rawPdf = Buffer.from(arrayBuf).toString("latin1")
    expect(rawPdf.includes("/Subtype /Image")).toBe(false)
  })

  it("throws a clear error when attempting to reconstruct empty pages", async () => {
    await expect(reconstructDigitalPdf([])).rejects.toThrow(
      "No hay páginas de texto reconocidas para construir el PDF."
    )
  })
})
