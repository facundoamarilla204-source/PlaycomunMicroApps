export type SignatureElementType = 'signature' | 'initials' | 'logo'
export type SignatureSource = 'type' | 'draw' | 'upload' | 'mobile_qr'

export interface SignatureElement {
  id: string
  type: SignatureElementType
  source: SignatureSource
  pageIndex: number // 0-indexed page where this element is placed
  x: number // Relative visual X [0, 1] from left
  y: number // Relative visual Y [0, 1] from top
  width: number // Relative visual width [0, 1]
  height: number // Relative visual height [0, 1]
  dataUrl: string // PNG data URL (with transparent background)
  aspectRatio: number // width / height
  title?: string
}

export interface PdfPageInfo {
  pageIndex: number
  displayPageNumber: number
  width: number // Native points
  height: number // Native points
  rotation: number // Initial rotation angle (0, 90, 180, 270)
  visualWidth: number // Width as presented to user (swapped if rotated 90/270)
  visualHeight: number // Height as presented to user
  thumbnailUrl?: string
}

export interface PdfSignDocument {
  file: File
  fileName: string
  fileSize: number
  arrayBuffer: ArrayBuffer
  numPages: number
  pages: PdfPageInfo[]
}

export interface HandwrittenStyle {
  id: string
  name: string
  fontFamily: string
  category: 'elegante' | 'cursiva' | 'informal' | 'sobria'
}
