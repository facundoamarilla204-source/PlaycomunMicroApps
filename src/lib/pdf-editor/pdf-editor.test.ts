import { describe, it, expect } from "vitest"
import { PDFDocument, rgb, degrees } from "pdf-lib"
import {
  exportCombinedPdf,
  splitPdfDocument,
  exportSplitZip,
  formatBytes,
} from "./pdf-engine"
import {
  detectDocumentCorners,
  applyImageFilters,
} from "./scanner-engine"
import { DocumentPage, LoadedPdfFile } from "./types"

// Helper to create a minimal real PDF in memory
async function createTestPdfBuffer(pageCount: number, label: string): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 600])
    page.drawText(`${label} - Página ${i + 1}`, {
      x: 50,
      y: 500,
      size: 20,
      color: rgb(0.2, 0.2, 0.8),
    })
  }
  const bytes = await doc.save()
  return bytes.buffer as ArrayBuffer
}

describe("PDF Editor Engine Tests", () => {
  it("formats bytes accurately", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1024)).toBe("1 KB")
    expect(formatBytes(1048576)).toBe("1 MB")
    expect(formatBytes(2621440, 2)).toBe("2.5 MB")
  })

  it("combines and reorders multiple PDF pages correctly", async () => {
    const bufferA = await createTestPdfBuffer(2, "DocA")
    const bufferB = await createTestPdfBuffer(1, "DocB")

    const fileA: LoadedPdfFile = {
      id: "file_a",
      name: "DocA.pdf",
      size: bufferA.byteLength,
      pageCount: 2,
      arrayBuffer: bufferA,
      colorIndex: 0,
    }

    const fileB: LoadedPdfFile = {
      id: "file_b",
      name: "DocB.pdf",
      size: bufferB.byteLength,
      pageCount: 1,
      arrayBuffer: bufferB,
      colorIndex: 1,
    }

    // Reorder pages: DocB (page 1) first, then DocA (page 2), then DocA (page 1)
    const pages: DocumentPage[] = [
      {
        id: "p_b_1",
        sourceFileId: "file_b",
        sourceFileName: "DocB.pdf",
        sourceFileColorIndex: 1,
        originalPageIndex: 0,
        displayPageNumber: 1,
        customRotation: 90, // rotate by 90 degrees
        initialRotation: 0,
        width: 400,
        height: 600,
      },
      {
        id: "p_a_2",
        sourceFileId: "file_a",
        sourceFileName: "DocA.pdf",
        sourceFileColorIndex: 0,
        originalPageIndex: 1,
        displayPageNumber: 2,
        customRotation: 0,
        initialRotation: 0,
        width: 400,
        height: 600,
      },
      {
        id: "p_a_1",
        sourceFileId: "file_a",
        sourceFileName: "DocA.pdf",
        sourceFileColorIndex: 0,
        originalPageIndex: 0,
        displayPageNumber: 1,
        customRotation: 180,
        initialRotation: 0,
        width: 400,
        height: 600,
      },
    ]

    const mergedBlob = await exportCombinedPdf(pages, [fileA, fileB])
    expect(mergedBlob).toBeInstanceOf(Blob)
    expect(mergedBlob.type).toBe("application/pdf")
    expect(mergedBlob.size).toBeGreaterThan(0)

    // Verify resulting PDF document in pdf-lib
    const arrayBuf = await mergedBlob.arrayBuffer()
    const resultDoc = await PDFDocument.load(arrayBuf)
    expect(resultDoc.getPageCount()).toBe(3)

    // Verify first page rotation was applied
    const firstPage = resultDoc.getPage(0)
    expect(firstPage.getRotation().angle).toBe(90)

    // Verify third page rotation was applied
    const thirdPage = resultDoc.getPage(2)
    expect(thirdPage.getRotation().angle).toBe(180)
  })

  it("splits document into fixed page chunks", async () => {
    const buffer = await createTestPdfBuffer(5, "DocMulti")
    const file: LoadedPdfFile = {
      id: "multi",
      name: "DocMulti.pdf",
      size: buffer.byteLength,
      pageCount: 5,
      arrayBuffer: buffer,
      colorIndex: 0,
    }

    const pages: DocumentPage[] = Array.from({ length: 5 }, (_, i) => ({
      id: `p_${i}`,
      sourceFileId: "multi",
      sourceFileName: "DocMulti.pdf",
      sourceFileColorIndex: 0,
      originalPageIndex: i,
      displayPageNumber: i + 1,
      customRotation: 0,
      initialRotation: 0,
      width: 400,
      height: 600,
    }))

    // Split in chunks of 2 pages -> should produce 3 chunks (2, 2, 1)
    const splitResults = await splitPdfDocument(pages, [file], "fixed_chunks", {
      chunkSize: 2,
      baseName: "DocMulti",
    })

    expect(splitResults).toHaveLength(3)
    expect(splitResults[0].pageCount).toBe(2)
    expect(splitResults[1].pageCount).toBe(2)
    expect(splitResults[2].pageCount).toBe(1)
    expect(splitResults[0].name).toContain("parte_1")
    expect(splitResults[0].blob.size).toBeGreaterThan(0)
  })

  it("splits document by custom page ranges", async () => {
    const buffer = await createTestPdfBuffer(6, "DocRanges")
    const file: LoadedPdfFile = {
      id: "f_ranges",
      name: "DocRanges.pdf",
      size: buffer.byteLength,
      pageCount: 6,
      arrayBuffer: buffer,
      colorIndex: 0,
    }

    const pages: DocumentPage[] = Array.from({ length: 6 }, (_, i) => ({
      id: `p_r_${i}`,
      sourceFileId: "f_ranges",
      sourceFileName: "DocRanges.pdf",
      sourceFileColorIndex: 0,
      originalPageIndex: i,
      displayPageNumber: i + 1,
      customRotation: 0,
      initialRotation: 0,
      width: 400,
      height: 600,
    }))

    const splitResults = await splitPdfDocument(pages, [file], "ranges", {
      ranges: "1-2, 3-5, 6",
      baseName: "DocRanges",
    })

    expect(splitResults).toHaveLength(3)
    expect(splitResults[0].pageCount).toBe(2)
    expect(splitResults[1].pageCount).toBe(3)
    expect(splitResults[2].pageCount).toBe(1)
  })

  it("exports split documents as a ZIP archive", async () => {
    const buffer = await createTestPdfBuffer(2, "DocZip")
    const file: LoadedPdfFile = {
      id: "f_zip",
      name: "DocZip.pdf",
      size: buffer.byteLength,
      pageCount: 2,
      arrayBuffer: buffer,
      colorIndex: 0,
    }

    const pages: DocumentPage[] = Array.from({ length: 2 }, (_, i) => ({
      id: `p_z_${i}`,
      sourceFileId: "f_zip",
      sourceFileName: "DocZip.pdf",
      sourceFileColorIndex: 0,
      originalPageIndex: i,
      displayPageNumber: i + 1,
      customRotation: 0,
      initialRotation: 0,
      width: 400,
      height: 600,
    }))

    const splitResults = await splitPdfDocument(pages, [file], "single_pages", {
      baseName: "DocZip",
    })

    expect(splitResults).toHaveLength(2)

    const zipBlob = await exportSplitZip(splitResults, "lote.zip")
    expect(zipBlob).toBeInstanceOf(Blob)
    expect(zipBlob.size).toBeGreaterThan(0)
  })
})
