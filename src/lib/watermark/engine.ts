import {
  ProcessedResult,
  WatermarkConfig,
  WatermarkImageItem,
} from "./types"
import {
  calculateFontSizePx,
  calculateLogoDimensions,
  buildCanvasFont,
  measureMultilineText,
  resolveWatermarkPosition,
  sanitizeWatermarkFileName,
} from "./layout"

/**
 * Loads an HTMLImageElement safely from a File or ObjectURL.
 */
export function loadImageElement(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let objectUrlToRevoke: string | null = null

    img.onload = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke)
      }
      resolve(img)
    }

    img.onerror = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke)
      }
      reject(new Error("No se pudo decodificar el archivo de imagen"))
    }

    if (typeof source === "string") {
      img.src = source
    } else {
      objectUrlToRevoke = URL.createObjectURL(source)
      img.src = objectUrlToRevoke
    }
  })
}

/**
 * Renders the watermark layer onto a 2D canvas context.
 */
export function renderWatermarkLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig,
  logoImg: HTMLImageElement | null
): void {
  const isText = config.type === "text"
  const isRepeated = config.mode === "repeated"

  if (isText) {
    const textConfig = config.textConfig
    const text = textConfig.text.trim()
    if (!text) return

    const fontSizePx = calculateFontSizePx(width, height, textConfig.fontSizeRel)
    const measured = measureMultilineText(ctx, text, fontSizePx, textConfig.fontFamily)

    if (!isRepeated) {
      // Single Watermark Mode
      const box = resolveWatermarkPosition(width, height, measured.width, measured.height, config)

      ctx.save()
      ctx.globalAlpha = textConfig.opacity
      ctx.translate(box.centerX, box.centerY)

      if (textConfig.rotation !== 0) {
        ctx.rotate((textConfig.rotation * Math.PI) / 180)
      }

      ctx.font = buildCanvasFont(fontSizePx, textConfig.fontFamily, "600")
      ctx.textBaseline = "middle"

      const startY = -((measured.lines.length - 1) * measured.lineHeight) / 2

      measured.lines.forEach((line, index) => {
        const lineY = startY + index * measured.lineHeight
        const metrics = ctx.measureText(line || " ")
        let lineX = -measured.width / 2

        if (textConfig.align === "center") {
          lineX = -metrics.width / 2
        } else if (textConfig.align === "right") {
          lineX = measured.width / 2 - metrics.width
        }

        // Optional shadow
        if (textConfig.enableShadow) {
          ctx.save()
          ctx.shadowColor = textConfig.shadowColor || "rgba(0,0,0,0.7)"
          ctx.shadowBlur = Math.round((textConfig.shadowBlur / 10) * fontSizePx * 0.4)
          ctx.shadowOffsetX = Math.round(fontSizePx * 0.05)
          ctx.shadowOffsetY = Math.round(fontSizePx * 0.05)
          ctx.fillStyle = textConfig.color
          ctx.fillText(line, lineX, lineY)
          ctx.restore()
        }

        // Optional stroke/outline
        if (textConfig.enableStroke) {
          ctx.save()
          ctx.strokeStyle = textConfig.strokeColor || "rgba(0,0,0,0.6)"
          ctx.lineWidth = Math.max(1, Math.round((textConfig.strokeWidth / 5) * fontSizePx * 0.08))
          ctx.lineJoin = "round"
          ctx.strokeText(line, lineX, lineY)
          ctx.restore()
        }

        // Fill main text
        ctx.fillStyle = textConfig.color
        ctx.fillText(line, lineX, lineY)
      })

      ctx.restore()
    } else {
      // Repeated Pattern Mode (Tiled)
      const repeatConfig = config.repeatConfig
      const stepX = Math.max(40, measured.width * (repeatConfig.gapXRel / 100))
      const stepY = Math.max(40, measured.height * (repeatConfig.gapYRel / 100))
      const diag = Math.hypot(width, height)

      ctx.save()
      ctx.globalAlpha = textConfig.opacity

      // Rotate canvas around center
      ctx.translate(width / 2, height / 2)
      ctx.rotate((repeatConfig.angle * Math.PI) / 180)

      ctx.font = buildCanvasFont(fontSizePx, textConfig.fontFamily, "600")
      ctx.textBaseline = "middle"

      const cols = Math.ceil(diag / stepX) + 2
      const rows = Math.ceil(diag / stepY) + 2

      for (let r = -rows; r <= rows; r++) {
        const rowY = r * stepY
        const stagger = (r % 2) * (stepX / 2) // Staggered diamond pattern

        for (let c = -cols; c <= cols; c++) {
          const colX = c * stepX + stagger

          measured.lines.forEach((line, index) => {
            const startY = -((measured.lines.length - 1) * measured.lineHeight) / 2
            const lineY = rowY + startY + index * measured.lineHeight
            const metrics = ctx.measureText(line || " ")
            const lineX = colX - metrics.width / 2

            if (textConfig.enableShadow) {
              ctx.save()
              ctx.shadowColor = textConfig.shadowColor || "rgba(0,0,0,0.6)"
              ctx.shadowBlur = Math.round((textConfig.shadowBlur / 10) * fontSizePx * 0.3)
              ctx.fillStyle = textConfig.color
              ctx.fillText(line, lineX, lineY)
              ctx.restore()
            }

            if (textConfig.enableStroke) {
              ctx.save()
              ctx.strokeStyle = textConfig.strokeColor || "rgba(0,0,0,0.5)"
              ctx.lineWidth = Math.max(1, Math.round((textConfig.strokeWidth / 5) * fontSizePx * 0.06))
              ctx.strokeText(line, lineX, lineY)
              ctx.restore()
            }

            ctx.fillStyle = textConfig.color
            ctx.fillText(line, lineX, lineY)
          })
        }
      }

      ctx.restore()
    }
  } else {
    // Logo / Image Watermark Mode
    if (!logoImg) return
    const imageConfig = config.imageConfig
    const logoDims = calculateLogoDimensions(
      width,
      height,
      logoImg.naturalWidth || logoImg.width,
      logoImg.naturalHeight || logoImg.height,
      imageConfig.scaleRel
    )

    if (!isRepeated) {
      // Single Logo
      const box = resolveWatermarkPosition(width, height, logoDims.width, logoDims.height, config)

      ctx.save()
      ctx.globalAlpha = imageConfig.opacity
      ctx.translate(box.centerX, box.centerY)

      if (imageConfig.rotation !== 0) {
        ctx.rotate((imageConfig.rotation * Math.PI) / 180)
      }

      ctx.drawImage(logoImg, -box.width / 2, -box.height / 2, box.width, box.height)
      ctx.restore()
    } else {
      // Repeated Logo Pattern
      const repeatConfig = config.repeatConfig
      const stepX = Math.max(40, logoDims.width * (repeatConfig.gapXRel / 100))
      const stepY = Math.max(40, logoDims.height * (repeatConfig.gapYRel / 100))
      const diag = Math.hypot(width, height)

      ctx.save()
      ctx.globalAlpha = imageConfig.opacity

      ctx.translate(width / 2, height / 2)
      ctx.rotate((repeatConfig.angle * Math.PI) / 180)

      const cols = Math.ceil(diag / stepX) + 2
      const rows = Math.ceil(diag / stepY) + 2

      for (let r = -rows; r <= rows; r++) {
        const rowY = r * stepY
        const stagger = (r % 2) * (stepX / 2)

        for (let c = -cols; c <= cols; c++) {
          const colX = c * stepX + stagger
          ctx.drawImage(
            logoImg,
            colX - logoDims.width / 2,
            rowY - logoDims.height / 2,
            logoDims.width,
            logoDims.height
          )
        }
      }

      ctx.restore()
    }
  }
}

/**
 * Draws the base image and the watermark onto the given canvas at target dimensions.
 */
export function drawFullComposition(
  canvas: HTMLCanvasElement,
  baseImg: HTMLImageElement,
  config: WatermarkConfig,
  logoImg: HTMLImageElement | null,
  options?: {
    targetWidth?: number
    targetHeight?: number
    fillBackground?: boolean
    backgroundColor?: string
  }
): void {
  const w = options?.targetWidth || baseImg.naturalWidth || baseImg.width
  const h = options?.targetHeight || baseImg.naturalHeight || baseImg.height

  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("No se pudo obtener el contexto 2D del Canvas")

  ctx.clearRect(0, 0, w, h)

  // Background fill if requested (e.g. converting transparent image to JPEG)
  if (options?.fillBackground && options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, w, h)
  }

  // Draw base image
  ctx.drawImage(baseImg, 0, 0, w, h)

  // Draw watermark
  renderWatermarkLayer(ctx, w, h, config, logoImg)
}

/**
 * Processes an individual image file, baking the watermark in full resolution and encoding to Blob.
 */
export async function processSingleWatermark(
  item: WatermarkImageItem,
  config: WatermarkConfig,
  logoImg: HTMLImageElement | null
): Promise<ProcessedResult> {
  const baseImg = await loadImageElement(item.file)
  const fullWidth = baseImg.naturalWidth || baseImg.width
  const fullHeight = baseImg.naturalHeight || baseImg.height

  const canvas = document.createElement("canvas")

  // Determine output MIME type
  let mimeType = "image/jpeg"
  if (config.outputFormat === "original") {
    if (item.originalFormat === "png") mimeType = "image/png"
    else if (item.originalFormat === "webp") mimeType = "image/webp"
    else mimeType = "image/jpeg"
  } else if (config.outputFormat === "png") {
    mimeType = "image/png"
  } else if (config.outputFormat === "webp") {
    mimeType = "image/webp"
  } else {
    mimeType = "image/jpeg"
  }

  const isJpeg = mimeType === "image/jpeg"
  const fillBackground = isJpeg && item.hasTransparency

  drawFullComposition(canvas, baseImg, config, logoImg, {
    targetWidth: fullWidth,
    targetHeight: fullHeight,
    fillBackground,
    backgroundColor: config.backgroundColor || "#ffffff",
  })

  // Encode to Blob
  const quality = isJpeg || mimeType === "image/webp" ? config.quality : undefined
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error("Error al codificar la imagen en el navegador"))
      },
      mimeType,
      quality
    )
  })

  const { fileName } = sanitizeWatermarkFileName(
    item.originalName,
    config.outputFormat,
    item.originalFormat
  )
  const downloadUrl = URL.createObjectURL(blob)

  return {
    blob,
    downloadUrl,
    fileName,
    size: blob.size,
    width: fullWidth,
    height: fullHeight,
    format: mimeType.replace("image/", ""),
  }
}
