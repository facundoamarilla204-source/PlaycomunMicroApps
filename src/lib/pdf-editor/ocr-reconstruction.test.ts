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

  it("reconstructs documents preserving explicit bold tags on paragraphs and lists", async () => {
    const pagesWithBold: RecognizedPageContent[] = [
      {
        pageIndex: 0,
        fullText: "Documento con negritas",
        blocks: [
          {
            id: "b_title",
            type: "title",
            text: "RESOLUCIÓN MINISTERIAL N° 458/2026",
            isBold: true,
            confidence: 98,
          },
          {
            id: "b_sub",
            type: "subheading",
            text: "1.1 OBJETO DE LA NORMATIVA",
            isBold: true,
            confidence: 96,
          },
          {
            id: "b_bold_p",
            type: "paragraph",
            text: "Este párrafo ha sido marcado como negrita expresamente por el usuario o detectado por el OCR.",
            isBold: true,
            confidence: 95,
          },
          {
            id: "b_regular_p",
            type: "paragraph",
            text: "Este párrafo es de texto normal sin negrita.",
            isBold: false,
            confidence: 95,
          },
          {
            id: "b_bold_list",
            type: "list_item",
            text: "• Ítem con negrita destacada",
            isBold: true,
            confidence: 97,
          },
        ],
        confidence: 96,
        hasText: true,
      },
    ]

    const blob = await reconstructDigitalPdf(pagesWithBold)
    const arrayBuf = await blob.arrayBuffer()
    const doc = await PDFDocument.load(arrayBuf)

    expect(doc.getPageCount()).toBe(1)
    const { PDFName } = await import("pdf-lib")
    const fontNames: string[] = []
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if ((obj as any).dict) {
        const type = (obj as any).dict.get(PDFName.of("Type"))
        if (type === PDFName.of("Font")) {
          const baseFont = (obj as any).dict.get(PDFName.of("BaseFont"))
          if (baseFont) {
            fontNames.push(baseFont.toString())
          }
        }
      }
    }
    expect(fontNames.some((f) => f.includes("Bold"))).toBe(true)
  })

  it("supports incremental multi-page additions without corrupting previous page edits", async () => {
    // Initial Page 1 with manual user edits
    const initialPages: RecognizedPageContent[] = [
      {
        pageIndex: 0,
        fullText: "Texto editado manualmente por el usuario en página 1",
        blocks: [
          {
            id: "p1_b1",
            type: "title",
            text: "DOCUMENTO EDITADO MANUALMENTE",
            confidence: 100,
          },
          {
            id: "p1_b2",
            type: "paragraph",
            text: "Párrafo 1 corregido por el usuario sin errores tipográficos.",
            confidence: 100,
          },
        ],
        confidence: 100,
        hasText: true,
      },
    ]

    const initialPdf = await reconstructDigitalPdf(initialPages)
    const initialDoc = await PDFDocument.load(await initialPdf.arrayBuffer())
    expect(initialDoc.getPageCount()).toBe(1)

    // Newly added Page 2 (e.g. from continuous mobile QR or PC camera)
    const newPage2: RecognizedPageContent = {
      pageIndex: 1,
      fullText: "Contenido escaneado de la segunda página",
      blocks: [
        {
          id: "p2_b1",
          type: "heading",
          text: "SEGUNDA PARTE DEL DOCUMENTO",
          confidence: 94,
        },
        {
          id: "p2_b2",
          type: "paragraph",
          text: "Continuación del acuerdo contractual.",
          confidence: 94,
        },
      ],
      confidence: 94,
      hasText: true,
    }

    // Combine while preserving page 1 edits
    const combinedPages = [...initialPages, newPage2]
    const combinedPdf = await reconstructDigitalPdf(combinedPages)
    const combinedDoc = await PDFDocument.load(await combinedPdf.arrayBuffer())

    expect(combinedDoc.getPageCount()).toBe(2)
    expect(Math.round(combinedDoc.getPage(0).getWidth())).toBe(595)
    expect(Math.round(combinedDoc.getPage(1).getWidth())).toBe(595)

    // Check that neither page contains /Subtype /Image
    const { PDFName } = await import("pdf-lib")
    let hasImage = false
    for (const [, obj] of combinedDoc.context.enumerateIndirectObjects()) {
      if ((obj as any).dict) {
        const subtype = (obj as any).dict.get(PDFName.of("Subtype"))
        if (subtype === PDFName.of("Image")) {
          hasImage = true
        }
      }
    }
    expect(hasImage).toBe(false)
  })

  it("throws a clear error when attempting to reconstruct empty pages", async () => {
    await expect(reconstructDigitalPdf([])).rejects.toThrow(
      "No hay páginas de texto reconocidas para construir el PDF."
    )
  })
})
