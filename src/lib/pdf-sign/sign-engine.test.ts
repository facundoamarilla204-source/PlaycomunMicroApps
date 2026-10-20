import { describe, it, expect } from "vitest"
import { PDFDocument, rgb } from "pdf-lib"
import {
  calculatePdfPlacement,
  embedSignaturesIntoPdf,
  dataUrlToBytes,
} from "./sign-engine"
import { SignatureElement } from "./types"

// Helper to create a minimal real test PDF
async function createTestPdf(pageCount: number = 2): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([500, 700])
    page.drawText(`Página de prueba ${i + 1}`, {
      x: 50,
      y: 650,
      size: 18,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  const bytes = await doc.save()
  return bytes.buffer as ArrayBuffer
}

// Minimal valid transparent 1x1 PNG data URL
const TEST_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

describe("PDF Signing Engine", () => {
  describe("Coordinate placement with page rotations", () => {
    const pageWidth = 500
    const pageHeight = 700
    // Element placed at 20% from left, 30% from top, 40% width, 10% height
    const element = {
      x: 0.2,
      y: 0.3,
      width: 0.4,
      height: 0.1,
    }

    it("calculates correct placement for 0 degree rotation", () => {
      const placement = calculatePdfPlacement(pageWidth, pageHeight, 0, element)

      // visual X = 0.2 * 500 = 100
      // visual Y = 0.3 * 700 = 210
      // visual W = 0.4 * 500 = 200
      // visual H = 0.1 * 700 = 70
      // In PDF, Y origin is bottom-left, so PDF Y = 700 - 210 - 70 = 420
      expect(placement.x).toBe(100)
      expect(placement.y).toBe(420)
      expect(placement.width).toBe(200)
      expect(placement.height).toBe(70)
      expect(placement.rotateDegrees).toBe(0)
    })

    it("calculates correct placement for 90 degree clockwise rotation", () => {
      const placement = calculatePdfPlacement(pageWidth, pageHeight, 90, element)

      // When rotated 90 CW, visualWidth = pageHeight (700), visualHeight = pageWidth (500)
      // visual X = 0.2 * 700 = 140
      // visual Y = 0.3 * 500 = 150
      // visual W = 0.4 * 700 = 280
      // visual H = 0.1 * 500 = 50
      // placement.x = vy = 150
      // placement.y = vx + vw = 140 + 280 = 420
      expect(placement.x).toBe(150)
      expect(placement.y).toBe(420)
      expect(placement.width).toBe(280)
      expect(placement.height).toBe(50)
      expect(placement.rotateDegrees).toBe(270)
    })

    it("calculates correct placement for 180 degree rotation", () => {
      const placement = calculatePdfPlacement(pageWidth, pageHeight, 180, element)

      // visualWidth = 500, visualHeight = 700
      // vx = 100, vy = 210, vw = 200, vh = 70
      // x = 500 - 100 = 400
      // y = 210 + 70 = 280
      expect(placement.x).toBe(400)
      expect(placement.y).toBe(280)
      expect(placement.rotateDegrees).toBe(180)
    })

    it("calculates correct placement for 270 degree rotation", () => {
      const placement = calculatePdfPlacement(pageWidth, pageHeight, 270, element)

      expect(placement.rotateDegrees).toBe(90)
      expect(placement.width).toBeGreaterThan(0)
      expect(placement.height).toBeGreaterThan(0)
    })
  })

  describe("Real PDF embedding with pdf-lib", () => {
    it("converts data url to bytes correctly", () => {
      const bytes = dataUrlToBytes(TEST_PNG_DATA_URL)
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBeGreaterThan(0)
      // Verify PNG magic bytes
      expect(bytes[0]).toBe(0x89)
      expect(bytes[1]).toBe(0x50)
      expect(bytes[2]).toBe(0x4e)
      expect(bytes[3]).toBe(0x47)
    })

    it("embeds a signature element onto a specific PDF page and returns a valid PDF Blob", async () => {
      const pdfBuffer = await createTestPdf(3)

      const element: SignatureElement = {
        id: "sig_1",
        type: "signature",
        source: "type",
        pageIndex: 1, // Second page
        x: 0.5,
        y: 0.7,
        width: 0.3,
        height: 0.1,
        dataUrl: TEST_PNG_DATA_URL,
        aspectRatio: 3,
      }

      const signedBlob = await embedSignaturesIntoPdf(pdfBuffer, [element])
      expect(signedBlob).toBeInstanceOf(Blob)
      expect(signedBlob.type).toBe("application/pdf")
      expect(signedBlob.size).toBeGreaterThan(pdfBuffer.byteLength * 0.8)

      // Verify resulting PDF can be reloaded by pdf-lib
      const signedArrayBuffer = await signedBlob.arrayBuffer()
      const reloadedDoc = await PDFDocument.load(signedArrayBuffer)
      expect(reloadedDoc.getPageCount()).toBe(3)
    })

    it("handles multiple elements across multiple pages simultaneously", async () => {
      const pdfBuffer = await createTestPdf(4)

      const elements: SignatureElement[] = [
        {
          id: "sig_page_0",
          type: "signature",
          source: "draw",
          pageIndex: 0,
          x: 0.1,
          y: 0.8,
          width: 0.25,
          height: 0.08,
          dataUrl: TEST_PNG_DATA_URL,
          aspectRatio: 2.5,
        },
        {
          id: "init_page_1",
          type: "initials",
          source: "type",
          pageIndex: 1,
          x: 0.85,
          y: 0.9,
          width: 0.1,
          height: 0.05,
          dataUrl: TEST_PNG_DATA_URL,
          aspectRatio: 1.5,
        },
        {
          id: "logo_page_2",
          type: "logo",
          source: "upload",
          pageIndex: 2,
          x: 0.05,
          y: 0.05,
          width: 0.2,
          height: 0.1,
          dataUrl: TEST_PNG_DATA_URL,
          aspectRatio: 2,
        },
      ]

      const signedBlob = await embedSignaturesIntoPdf(pdfBuffer, elements)
      expect(signedBlob.size).toBeGreaterThan(0)

      const signedArrayBuffer = await signedBlob.arrayBuffer()
      const reloadedDoc = await PDFDocument.load(signedArrayBuffer)
      expect(reloadedDoc.getPageCount()).toBe(4)
    })
  })
})
