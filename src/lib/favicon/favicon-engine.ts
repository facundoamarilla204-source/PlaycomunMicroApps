/**
 * PlayComun Online — Favicon Generation Engine
 * 
 * Local, secure, in-browser canvas renderer and ICO binary encoder.
 * Produces genuine multi-resolution ICO files, precision PNGs, web app manifest,
 * and standard portable HTML integration markup.
 */

import JSZip from "jszip"

export interface FaviconConfig {
  fitMode: "contain" | "cover"
  scale: number // 10 to 100 (%)
  padding: number // 0 to 40 (%)
  backgroundType: "transparent" | "solid"
  backgroundColor: string // hex #ffffff
}

export interface GeneratedAsset {
  name: string
  width?: number
  height?: number
  blob: Blob
  type: string
  description: string
  usage: string
  previewUrl: string
}

export interface FaviconPackageResult {
  assets: GeneratedAsset[]
  htmlCode: string
  manifestJson: string
  zipBlob: Blob
}

export const DEFAULT_FAVICON_CONFIG: FaviconConfig = {
  fitMode: "contain",
  scale: 100,
  padding: 5,
  backgroundType: "transparent",
  backgroundColor: "#ffffff",
}

export const FAVICON_TARGET_SIZES = [
  { name: "favicon-16x16.png", size: 16, usage: "Navegadores clásicos y pestañas de baja densidad" },
  { name: "favicon-32x32.png", size: 32, usage: "Pestañas de navegador estándar y marcadores" },
  { name: "favicon-48x48.png", size: 48, usage: "Accesos directos en escritorio y compatibilidad" },
  { name: "apple-touch-icon.png", size: 180, usage: "Pantalla de inicio en iOS y iPadOS" },
  { name: "android-chrome-192x192.png", size: 192, usage: "PWA y accesos directos en Android" },
  { name: "android-chrome-512x512.png", size: 512, usage: "Pantalla de bienvenida PWA y alta resolución" },
] as const

/**
 * Encodes multiple PNG ArrayBuffers into a single valid Windows ICO (.ico) binary.
 * 
 * ICO Specification:
 * - Header (6 bytes):
 *   - Reserved (2 bytes): 0
 *   - Type (2 bytes): 1 (1 = icon, 2 = cursor)
 *   - Count (2 bytes): Number of images (little endian)
 * - Directory Entries (16 bytes per image):
 *   - Width (1 byte): 0 if 256
 *   - Height (1 byte): 0 if 256
 *   - ColorCount (1 byte): 0
 *   - Reserved (1 byte): 0
 *   - Planes (2 bytes): 1 (LE)
 *   - BitCount (2 bytes): 32 (LE)
 *   - BytesInRes (4 bytes): Size of image data in bytes (LE)
 *   - ImageOffset (4 bytes): File offset to image data (LE)
 * - Raw PNG image data concatenated
 */
export function encodeIco(pngBuffers: { width: number; height: number; buffer: ArrayBuffer }[]): Blob {
  const count = pngBuffers.length
  if (count === 0) {
    throw new Error("No hay imágenes para codificar en el archivo ICO")
  }

  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = count * dirEntrySize

  let totalDataSize = 0
  for (const item of pngBuffers) {
    totalDataSize += item.buffer.byteLength
  }

  const totalFileSize = headerSize + dirSize + totalDataSize
  const icoBuffer = new ArrayBuffer(totalFileSize)
  const view = new DataView(icoBuffer)

  // 1. Header
  view.setUint16(0, 0, true) // Reserved (0)
  view.setUint16(2, 1, true) // Type: 1 = ICO
  view.setUint16(4, count, true) // Image count

  // 2. Directory entries & payload offset tracking
  let currentDataOffset = headerSize + dirSize
  let dirOffset = headerSize

  for (let i = 0; i < count; i++) {
    const { width, height, buffer } = pngBuffers[i]
    const byteLength = buffer.byteLength

    view.setUint8(dirOffset + 0, width >= 256 ? 0 : width) // Width
    view.setUint8(dirOffset + 1, height >= 256 ? 0 : height) // Height
    view.setUint8(dirOffset + 2, 0) // Color count (0 = >= 256 colors)
    view.setUint8(dirOffset + 3, 0) // Reserved
    view.setUint16(dirOffset + 4, 1, true) // Color planes (1)
    view.setUint16(dirOffset + 6, 32, true) // Bits per pixel (32-bit ARGB)
    view.setUint32(dirOffset + 8, byteLength, true) // Image size in bytes
    view.setUint32(dirOffset + 12, currentDataOffset, true) // Offset to image

    // Copy raw PNG data into payload section
    new Uint8Array(icoBuffer, currentDataOffset, byteLength).set(new Uint8Array(buffer))

    currentDataOffset += byteLength
    dirOffset += dirEntrySize
  }

  return new Blob([icoBuffer], { type: "image/x-icon" })
}

/**
 * Renders an Image or Canvas source onto an offscreen canvas of exact dimension [size x size]
 * applying user fitMode, scale, padding, and background settings.
 */
export function renderFaviconCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number,
  config: FaviconConfig
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("No se pudo obtener el contexto 2D para renderizar el icono")
  }

  // 1. Background
  if (config.backgroundType === "solid") {
    ctx.fillStyle = config.backgroundColor || "#ffffff"
    ctx.fillRect(0, 0, targetSize, targetSize)
  } else {
    ctx.clearRect(0, 0, targetSize, targetSize)
  }

  // 2. High-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // 3. Compute available drawing box accounting for padding & scale
  const effectivePaddingPct = Math.max(0, Math.min(40, config.padding))
  const paddingPx = (targetSize * (effectivePaddingPct / 100))
  const innerBoxSize = Math.max(1, targetSize - paddingPx * 2)

  const scaleFactor = Math.max(0.1, Math.min(1.0, config.scale / 100))
  const maxDrawSize = innerBoxSize * scaleFactor

  let destWidth: number
  let destHeight: number

  const sourceAspect = sourceWidth / sourceHeight

  if (config.fitMode === "cover") {
    // Fill the inner area, cropping edges if aspect differs
    if (sourceAspect > 1) {
      destHeight = maxDrawSize
      destWidth = maxDrawSize * sourceAspect
    } else {
      destWidth = maxDrawSize
      destHeight = maxDrawSize / sourceAspect
    }
  } else {
    // Contain: Entire image visible, preserving natural aspect ratio
    if (sourceAspect >= 1) {
      destWidth = maxDrawSize
      destHeight = maxDrawSize / sourceAspect
    } else {
      destHeight = maxDrawSize
      destWidth = maxDrawSize * sourceAspect
    }
  }

  const destX = (targetSize - destWidth) / 2
  const destY = (targetSize - destHeight) / 2

  // Clip to canvas bounds in case of cover mode
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, targetSize, targetSize)
  ctx.clip()
  ctx.drawImage(source, destX, destY, destWidth, destHeight)
  ctx.restore()

  return canvas
}

/**
 * Converts a canvas element to a PNG Blob asynchronously.
 */
export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Error al codificar imagen PNG desde el lienzo."))
      }
    }, "image/png")
  })
}

/**
 * Generates the portable standard HTML snippet for web integration.
 */
export function generateHtmlSnippet(appName = "Mi Sitio Web"): string {
  return `<!-- Favicon estándar para navegadores -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">

<!-- Icono para dispositivos Apple (iOS / iPadOS) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Manifiesto de aplicación web (PWA / Android) -->
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-title" content="${appName}">`
}

/**
 * Generates the site.webmanifest JSON string.
 */
export function generateWebManifest(appName = "Mi Sitio Web", shortName = "Mi Sitio"): string {
  const manifest = {
    name: appName,
    short_name: shortName,
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  }

  return JSON.stringify(manifest, null, 2)
}

/**
 * Generates the README.md content included in the ZIP package.
 */
export function generateReadmeContent(appName = "Mi Sitio Web"): string {
  return `# Paquete de Favicons — PlayComun Online

Generado para: ${appName}
Fecha: ${new Date().toLocaleDateString("es-AR")}

## Contenido del paquete
- \`favicon.ico\`: Archivo multi-resolución (16x16, 32x32 y 48x48 px) para navegadores tradicionales.
- \`favicon-16x16.png\`: Icono de 16x16 píxeles para pestañas compactas y marcadores antiguos.
- \`favicon-32x32.png\`: Icono de 32x32 píxeles para pestañas estándar de escritorio.
- \`favicon-48x48.png\`: Icono de 48x48 píxeles para accesos directos de escritorio.
- \`apple-touch-icon.png\`: Icono de 180x180 píxeles para pantalla de inicio en iPhone y iPad.
- \`android-chrome-192x192.png\`: Icono de 192x192 píxeles para dispositivos Android y PWA.
- \`android-chrome-512x512.png\`: Icono de 512x512 píxeles para pantalla de carga inicial PWA.
- \`site.webmanifest\`: Manifiesto estándar con la vinculación de iconos y metadatos.

## Instrucciones de instalación
1. Descomprimí y copiá todos los archivos en el directorio raíz público de tu sitio web (generalmente \`public/\`, \`html/\` o la raíz de tu servidor web).
2. Pegá el siguiente código dentro de la etiqueta \`<head>\` de tu archivo HTML principal (\`index.html\`, plantilla o encabezado de tu sitio):

\`\`\`html
${generateHtmlSnippet(appName)}
\`\`\`

---
Generado con PlayComun Online (herramientas locales y privadas sin subir archivos a servidores externos).
`
}

/**
 * Builds the complete favicon package: individual PNGs, multi-resolution ICO,
 * manifest, README, and zip file.
 */
export async function generateFaviconPackage(
  imageSource: HTMLImageElement,
  config: FaviconConfig,
  appName = "Mi Sitio Web"
): Promise<FaviconPackageResult> {
  const naturalWidth = imageSource.naturalWidth || imageSource.width
  const naturalHeight = imageSource.naturalHeight || imageSource.height

  if (!naturalWidth || !naturalHeight) {
    throw new Error("No se pudo obtener las dimensiones de la imagen de origen.")
  }

  const assets: GeneratedAsset[] = []
  const zip = new JSZip()

  // 1. Generate individual PNG assets
  const icoBuffers: { width: number; height: number; buffer: ArrayBuffer }[] = []

  for (const item of FAVICON_TARGET_SIZES) {
    const canvas = renderFaviconCanvas(imageSource, naturalWidth, naturalHeight, item.size, config)
    const blob = await canvasToPngBlob(canvas)
    const arrayBuffer = await blob.arrayBuffer()

    // Collect 16, 32, 48 for multi-resolution ICO
    if (item.size === 16 || item.size === 32 || item.size === 48) {
      icoBuffers.push({
        width: item.size,
        height: item.size,
        buffer: arrayBuffer,
      })
    }

    const previewUrl = URL.createObjectURL(blob)
    assets.push({
      name: item.name,
      width: item.size,
      height: item.size,
      blob,
      type: "image/png",
      description: `${item.size} × ${item.size} px`,
      usage: item.usage,
      previewUrl,
    })

    zip.file(item.name, blob)
  }

  // 2. Generate multi-resolution valid favicon.ico
  const icoBlob = encodeIco(icoBuffers)
  const icoPreviewUrl = URL.createObjectURL(icoBlob)
  assets.unshift({
    name: "favicon.ico",
    width: 48,
    height: 48,
    blob: icoBlob,
    type: "image/x-icon",
    description: "Multi-resolución (16, 32 y 48 px)",
    usage: "Favicon clásico para navegadores y compatibilidad universal",
    previewUrl: icoPreviewUrl,
  })
  zip.file("favicon.ico", icoBlob)

  // 3. Web Manifest
  const manifestJson = generateWebManifest(appName)
  const manifestBlob = new Blob([manifestJson], { type: "application/manifest+json" })
  zip.file("site.webmanifest", manifestBlob)

  // 4. README instructions
  const readmeContent = generateReadmeContent(appName)
  zip.file("README.md", readmeContent)

  // 5. Generate complete ZIP
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })

  const htmlCode = generateHtmlSnippet(appName)

  return {
    assets,
    htmlCode,
    manifestJson,
    zipBlob,
  }
}
