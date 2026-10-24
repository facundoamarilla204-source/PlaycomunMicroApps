export type WatermarkType = "text" | "image"
export type WatermarkMode = "single" | "repeated"

export type PresetPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "custom"

export type OutputFormat = "original" | "jpeg" | "png" | "webp"

export type FontOption = {
  id: string
  name: string
  family: string
}

export interface TextWatermarkConfig {
  text: string
  fontFamily: string
  fontSizeRel: number // 2 to 25 (% of min image dimension)
  color: string // hex code e.g. #ffffff
  opacity: number // 0.05 to 1.0
  align: "left" | "center" | "right"
  rotation: number // -180 to 180 degrees
  margin: number // 0 to 20 (% from edges)
  enableShadow: boolean
  shadowColor: string
  shadowBlur: number // 1 to 20
  enableStroke: boolean
  strokeColor: string
  strokeWidth: number // 1 to 10
}

export interface ImageWatermarkConfig {
  logoFile: File | null
  logoUrl: string | null
  logoWidth: number
  logoHeight: number
  logoFormat: string
  scaleRel: number // 5 to 80 (% of min image dimension)
  opacity: number // 0.05 to 1.0
  rotation: number // -180 to 180 degrees
  margin: number // 0 to 20 (% from edges)
}

export interface RepeatedPatternConfig {
  gapXRel: number // 50 to 300 (% of watermark width)
  gapYRel: number // 50 to 300 (% of watermark height)
  density: "baja" | "media" | "alta"
  angle: number // -90 to 90 degrees, default -30
}

export interface WatermarkConfig {
  type: WatermarkType
  mode: WatermarkMode
  position: PresetPosition
  customPos: {
    xRel: number // 0.0 to 1.0 relative to image width
    yRel: number // 0.0 to 1.0 relative to image height
  }
  textConfig: TextWatermarkConfig
  imageConfig: ImageWatermarkConfig
  repeatConfig: RepeatedPatternConfig
  outputFormat: OutputFormat
  quality: number // 0.6 to 1.0 (for JPEG and WebP)
  backgroundColor: string // #ffffff for JPG flattening if transparent
}

export type ProcessingStatus = "pending" | "processing" | "completed" | "error"

export interface ProcessedResult {
  blob: Blob
  downloadUrl: string
  fileName: string
  size: number
  width: number
  height: number
  format: string
}

export interface WatermarkImageItem {
  id: string
  file: File
  originalName: string
  originalSize: number
  originalWidth: number
  originalHeight: number
  originalFormat: "jpeg" | "png" | "webp" | "desconocido"
  hasTransparency: boolean
  previewUrl: string
  status: ProcessingStatus
  errorMessage?: string
  result?: ProcessedResult
}

export interface WatermarkBox {
  width: number
  height: number
  centerX: number
  centerY: number
}
