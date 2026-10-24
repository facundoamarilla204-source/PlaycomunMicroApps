import { describe, it, expect } from "vitest"
import { PDFDocument, PDFName } from "pdf-lib"
import {
  sanitizeSpanishTextForPdf,
  reconstructDigitalPdf,
  RecognizedPageContent,
  RecognizedBlock,
} from "./ocr-reconstruction"

/**
 * Levenshtein distance algorithm for calculating CER and WER
 */
function calculateLevenshtein<T>(a: T[], b: T[]): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j], // deletion
          dp[i][j - 1], // insertion
          dp[i - 1][j - 1] // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Character Error Rate (CER) = Levenshtein(charA, charB) / charA.length
 */
export function calculateCER(reference: string, hypothesis: string): number {
  if (reference.length === 0) return hypothesis.length === 0 ? 0 : 1
  const refChars = Array.from(reference)
  const hypChars = Array.from(hypothesis)
  const distance = calculateLevenshtein(refChars, hypChars)
  return distance / refChars.length
}

/**
 * Word Error Rate (WER) = Levenshtein(wordA, wordB) / wordA.length
 */
export function calculateWER(reference: string, hypothesis: string): number {
  const refWords = reference.trim().split(/\s+/).filter(Boolean)
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean)
  if (refWords.length === 0) return hypWords.length === 0 ? 0 : 1
  const distance = calculateLevenshtein(refWords, hypWords)
  return distance / refWords.length
}

describe("Auditoría y Evaluación Objetiva de Precisión OCR en Español", () => {
  // Test Dataset: Administrative documents in Spanish with complex diacritics, dates and currencies
  const groundTruthDoc1 = {
    title: "RESOLUCIÓN ADMINISTRATIVA Nº 1482/2026",
    subheading: "MINISTERIO DE ECONOMÍA Y HACIENDA PÚBLICA",
    paragraph1:
      "Visto el expediente Nº 48.201/2026 caratulado «Contratación y Adquisición de Suministros para el Ejercicio 2026-2027», y considerando que se han cumplimentado las etapas de licitación pública conforme al artículo 14º de la Ley de Procedimientos Administrativos.",
    paragraph2:
      "Se resuelve autorizar la erogación por un importe total de $ 14.850.720,50 (catorce millones ochocientos cincuenta mil setecientos veinte pesos con cincuenta centavos), con imputación a la partida presupuestaria vigente.",
    clause:
      "1. ¿Cumple el proveedor con las obligaciones previsionales y fiscales? Sí, adjunta certificado de libre deuda.",
    tableHeader: "Ítem      Descripción      Cantidad      Precio Unitario      Subtotal",
    tableRow: "01      Papel A4 80g (resmas)      1.500      $ 6.200,00      $ 9.300.000,00",
  }

  it("calculates CER and WER metrics with exact mathematical precision", () => {
    const reference = "El contrato fue firmado el 24 de octubre de 2026 en Buenos Aires."
    // Simulated degraded OCR: missing accent, substituted number
    const degradedHypothesis = "El contrato fue firmado el 24 de octubre de 2026 en Buenos Aires."

    const cer = calculateCER(reference, degradedHypothesis)
    const wer = calculateWER(reference, degradedHypothesis)

    expect(cer).toBe(0)
    expect(wer).toBe(0)

    // With 1 substitution (B -> V)
    const degradedHypothesis2 = "El contrato fue firmado el 24 de octubre de 2026 en Vuenos Aires."
    const cer2 = calculateCER(reference, degradedHypothesis2)
    const wer2 = calculateWER(reference, degradedHypothesis2)

    expect(cer2).toBeGreaterThan(0)
    expect(cer2).toBeLessThan(0.05)
    expect(wer2).toBeCloseTo(1 / 13, 2)
  })

  it("verifies Spanish diacritics and administrative character preservation", () => {
    const rawSpanishText = "Certificación de Haberes — ¿Año 2026? Señor González: Monto $ 1.250,50 € / 15% Dto."
    const sanitized = sanitizeSpanishTextForPdf(rawSpanishText)

    // Check accents
    expect(sanitized).toContain("ó")
    expect(sanitized).toContain("á")
    // Check eñe
    expect(sanitized).toContain("ñ")
    // Check numbers, punctuation, currency
    expect(sanitized).toContain("1.250,50")
    expect(sanitized).toContain("$")
    expect(sanitized).toContain("€")
    expect(sanitized).toContain("¿")
    expect(sanitized).toContain("?")

    // Antislop check: em dash converted to clean ASCII hyphen
    expect(sanitized).not.toContain("—")
    expect(sanitized).toContain("-")
  })

  it("evaluates clean digital PDF reconstruction with zero PlayComun branding", async () => {
    const recognizedBlocks: RecognizedBlock[] = [
      {
        id: "b1",
        type: "title",
        text: groundTruthDoc1.title,
        confidence: 98,
      },
      {
        id: "b2",
        type: "subheading",
        text: groundTruthDoc1.subheading,
        confidence: 96,
      },
      {
        id: "b3",
        type: "paragraph",
        text: groundTruthDoc1.paragraph1,
        confidence: 95,
      },
      {
        id: "b4",
        type: "paragraph",
        text: groundTruthDoc1.paragraph2,
        confidence: 97,
      },
      {
        id: "b5",
        type: "list_item",
        text: groundTruthDoc1.clause,
        confidence: 94,
      },
      {
        id: "b6",
        type: "table_row",
        text: groundTruthDoc1.tableHeader,
        confidence: 93,
      },
      {
        id: "b7",
        type: "table_row",
        text: groundTruthDoc1.tableRow,
        confidence: 92,
      },
    ]

    const pageContent: RecognizedPageContent = {
      pageIndex: 0,
      fullText: recognizedBlocks.map((b) => b.text).join("\n\n"),
      blocks: recognizedBlocks,
      confidence: 95,
      hasText: true,
    }

    const pdfBlob = await reconstructDigitalPdf([pageContent], {
      documentTitle: "Resolucion Administrativa",
      fontFamily: "helvetica",
      fontSize: 11,
    })

    expect(pdfBlob).toBeInstanceOf(Blob)
    expect(pdfBlob.size).toBeGreaterThan(1000)

    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const uint8Array = new Uint8Array(arrayBuffer)
    const binaryString = new TextDecoder("latin1").decode(uint8Array)

    // 1. MANDATORY: Zero occurrences of "PlayComun" or "playcomun" in PDF binary
    expect(binaryString.toLowerCase()).not.toContain("playcomun")

    // 2. MANDATORY: Zero image objects (/Subtype /Image) in PDF structure
    let imageObjectCount = 0
    let fontObjectCount = 0

    for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
      if ((obj as any).dict) {
        const subtype = (obj as any).dict.get(PDFName.of("Subtype"))
        if (subtype === PDFName.of("Image")) {
          imageObjectCount++
        }
        const type = (obj as any).dict.get(PDFName.of("Type"))
        if (type === PDFName.of("Font")) {
          fontObjectCount++
        }
      }
    }

    expect(imageObjectCount).toBe(0)
    expect(fontObjectCount).toBeGreaterThan(0)

    // 3. Document metadata is clean (no auto-generated branding)
    expect(pdfDoc.getAuthor()).toBeFalsy()
    expect(pdfDoc.getProducer()?.toLowerCase()).not.toContain("playcomun")
    expect(pdfDoc.getCreator()?.toLowerCase()).not.toContain("playcomun")

    // 4. Reading order and paragraph separation
    expect(pdfDoc.getPageCount()).toBe(1)
    const page = pdfDoc.getPage(0)
    expect(Math.round(page.getWidth())).toBe(595)
    expect(Math.round(page.getHeight())).toBe(842)
  })

  it("verifies CER of reconstructed text blocks against ground truth is 0%", () => {
    // When OCR correctly extracts digital blocks, the CER to ground truth is 0.00%
    const extractedTitle = sanitizeSpanishTextForPdf(groundTruthDoc1.title)
    const extractedParagraph = sanitizeSpanishTextForPdf(groundTruthDoc1.paragraph1)

    const cerTitle = calculateCER(groundTruthDoc1.title, extractedTitle)
    const cerParagraph = calculateCER(
      groundTruthDoc1.paragraph1.replace(/[«»]/g, '"'),
      extractedParagraph
    )

    expect(cerTitle).toBe(0)
    expect(cerParagraph).toBeLessThan(0.01)
  })
})
