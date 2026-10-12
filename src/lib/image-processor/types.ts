export type SupportedFormat = "jpeg" | "png" | "webp"
export type OutputFormatChoice = "original" | SupportedFormat

export type OperationType = "compress" | "convert" | "compress-and-convert"
export type QualityPreset = "max" | "balanced" | "min" | "custom"
export type ImageStatus = "pending" | "processing" | "completed" | "error"

export interface ImageDimensions {
  width: number
  height: number
}

export interface ProcessResult {
  blob: Blob
  downloadUrl: string
  fileName: string
  extension: string
  mimeType: string
  size: number
  width: number
  height: number
  percentDiff: number // negative is reduction (-42%), positive is increase (+10%)
  bytesSaved: number // original - final
  durationMs: number
}

export interface ImageItem {
  id: string
  file: File
  originalName: string
  originalSize: number
  originalType: string // e.g. 'image/png'
  originalFormat: SupportedFormat | "desconocido"
  originalWidth: number
  originalHeight: number
  previewUrl: string
  hasTransparency?: boolean
  status: ImageStatus
  errorMessage?: string
  result?: ProcessResult
}

export interface ProcessingConfig {
  operation: OperationType
  targetFormat: OutputFormatChoice
  qualityPreset: QualityPreset
  qualityValue: number // 0.01 to 1.0 (default 0.78 for balanced)
  enableResize: boolean
  maxWidth: number | null
  maxHeight: number | null
  keepAspectRatio: boolean
  backgroundColor: string // for transparency flattening into JPEG, e.g. '#ffffff'
}

export interface BatchSummaryData {
  totalCount: number
  completedCount: number
  errorCount: number
  pendingCount: number
  originalTotalBytes: number
  finalTotalBytes: number
  netSavingsBytes: number
  netPercentDiff: number
  isRealSaving: boolean
}
