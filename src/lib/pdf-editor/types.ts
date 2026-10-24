export interface DocumentPage {
  id: string
  sourceFileId: string
  sourceFileName: string
  sourceFileColorIndex: number
  originalPageIndex: number // 0-indexed in source file
  displayPageNumber: number // 1-indexed relative to source
  customRotation: number // 0, 90, 180, 270 (added to initial rotation)
  initialRotation: number
  width: number
  height: number
  thumbnailUrl?: string
  isScanned?: boolean
  scannedImageBlob?: Blob
}

export interface LoadedPdfFile {
  id: string
  name: string
  size: number
  pageCount: number
  arrayBuffer: ArrayBuffer
  colorIndex: number
}

export type SplitMode = "ranges" | "fixed_chunks" | "single_pages"

export interface SplitResultItem {
  id: string
  name: string
  pageCount: number
  description: string
  blob: Blob
  size: number
}

export interface ScannedFrame {
  id: string
  originalDataUrl: string
  processedDataUrl: string
  filter: "color" | "grayscale" | "contrast"
  rotation: number
  corners?: {
    tl: { x: number; y: number }
    tr: { x: number; y: number }
    br: { x: number; y: number }
    bl: { x: number; y: number }
  }
  width: number
  height: number
}

export interface ScannerExportOptions {
  pageSize: "a4" | "fit"
  orientation: "portrait" | "landscape" | "auto"
  quality: "high" | "medium" | "low"
  fileName?: string
}
