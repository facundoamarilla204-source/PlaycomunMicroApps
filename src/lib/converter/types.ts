export type ConversionCategory = "to-pdf" | "from-pdf" | "to-images"

export type ConversionOperationId =
  // Convertir a PDF
  | "word-to-pdf"
  | "excel-to-pdf"
  | "ppt-to-pdf"
  | "opendocument-to-pdf"
  | "images-to-pdf"
  // Convertir desde PDF
  | "pdf-to-word"
  | "pdf-to-excel"
  | "pdf-to-ppt"
  | "pdf-to-pdfa"
  // Convertir a Imágenes
  | "pdf-to-images"

export type ExecutionEnvironment = "client" | "worker"

export interface ConversionOperation {
  id: ConversionOperationId
  category: ConversionCategory
  title: string
  shortTitle: string
  description: string
  environment: ExecutionEnvironment
  acceptedExtensions: string[]
  acceptedMimeTypes: string[]
  outputExtension: string
  outputMimeType: string
  allowMultipleFiles: boolean
  badgeText: string
  limitationsNotice?: string
}

export type FileConversionStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "processing"
  | "completed"
  | "error"

export interface ConvertedResultItem {
  id: string
  name: string
  size: number
  blob: Blob
  downloadUrl: string
  previewUrl?: string
  pageNumber?: number
  format: string
}

export interface FileItem {
  id: string
  file: File
  name: string
  size: number
  extension: string
  status: FileConversionStatus
  progress: number
  statusMessage?: string
  error?: string
  warning?: string
  pageCount?: number
  results: ConvertedResultItem[]
}

// Opciones específicas de conversión
export interface ImagesToPdfOptions {
  orientation: "auto" | "portrait" | "landscape"
  pageSize: "a4" | "letter" | "fit"
  margin: "none" | "small" | "normal"
  combineIntoSinglePdf: boolean
}

export interface ExcelToPdfOptions {
  orientation: "portrait" | "landscape"
  paperSize: "a4" | "letter"
  fitToPage: boolean
}

export interface PdfToImagesOptions {
  format: "jpg" | "png"
  dpi: 150 | 300 | 72
  pageRange: "all" | "custom"
  customPageRange: string // ej. "1-3, 5"
}

export interface PdfToPdfAOptions {
  conformance: "PDF/A-1b" | "PDF/A-2b"
}

export interface GlobalConversionConfig {
  operationId: ConversionOperationId
  imagesToPdf: ImagesToPdfOptions
  excelToPdf: ExcelToPdfOptions
  pdfToImages: PdfToImagesOptions
  pdfToPdfA: PdfToPdfAOptions
}

export interface WorkerHealthState {
  configured: boolean
  online: boolean
  sofficeAvailable?: boolean
  sofficeVersion?: string
  message?: string
  checkedAt: number
}

export interface ConversionQuotaState {
  is_pro: boolean
  limit: number
  used: number
  remaining: number
  quota_date: string
  resets_at: string
  max_file_size_mb: number
}

export interface ConversionTokenResponse {
  token: string
  timestamp: number
  reservationId: string
  workerUrl: string
  configured: boolean
  expiresIn: number
  quota: ConversionQuotaState
}

