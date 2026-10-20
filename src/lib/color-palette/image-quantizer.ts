import { ExtractedColor, RGB } from "./types"
import { rgbToHex, rgbToHsl } from "./color-converter"

interface ColorBox {
  pixels: RGB[]
}

/**
 * Encuentra el canal de color con mayor rango (varianza) dentro de una caja de píxeles.
 */
function findWidestChannel(pixels: RGB[]): "r" | "g" | "b" {
  let minR = 255, maxR = 0
  let minG = 255, maxG = 0
  let minB = 255, maxB = 0

  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i]
    if (p.r < minR) minR = p.r
    if (p.r > maxR) maxR = p.r
    if (p.g < minG) minG = p.g
    if (p.g > maxG) maxG = p.g
    if (p.b < minB) minB = p.b
    if (p.b > maxB) maxB = p.b
  }

  const rangeR = maxR - minR
  const rangeG = maxG - minG
  const rangeB = maxB - minB

  if (rangeR >= rangeG && rangeR >= rangeB) return "r"
  if (rangeG >= rangeR && rangeG >= rangeB) return "g"
  return "b"
}

/**
 * Calcula el color promedio representativo de un grupo de píxeles.
 */
function getAverageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) return { r: 128, g: 128, b: 128 }

  let sumR = 0, sumG = 0, sumB = 0
  for (let i = 0; i < pixels.length; i++) {
    sumR += pixels[i].r
    sumG += pixels[i].g
    sumB += pixels[i].b
  }

  return {
    r: Math.round(sumR / pixels.length),
    g: Math.round(sumG / pixels.length),
    b: Math.round(sumB / pixels.length),
  }
}

/**
 * Algoritmo Median Cut para cuantizar una lista de píxeles RGB en N grupos representativos.
 */
function medianCutQuantize(pixels: RGB[], targetCount: number): { color: RGB; count: number }[] {
  if (pixels.length === 0) return []

  const boxes: ColorBox[] = [{ pixels }]

  // Dividir iterativamente la caja con mayor cantidad de píxeles o mayor rango
  while (boxes.length < targetCount) {
    // Buscar la caja candidata a dividir (la que tenga más píxeles y variedad)
    let bestIndex = -1
    let maxScore = -1

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      if (box.pixels.length > 1) {
        const score = box.pixels.length
        if (score > maxScore) {
          maxScore = score
          bestIndex = i
        }
      }
    }

    if (bestIndex === -1) break

    const boxToSplit = boxes.splice(bestIndex, 1)[0]
    const channel = findWidestChannel(boxToSplit.pixels)

    // Ordenar píxeles por el canal más amplio
    boxToSplit.pixels.sort((a, b) => a[channel] - b[channel])

    const median = Math.floor(boxToSplit.pixels.length / 2)
    const box1: ColorBox = { pixels: boxToSplit.pixels.slice(0, median) }
    const box2: ColorBox = { pixels: boxToSplit.pixels.slice(median) }

    boxes.push(box1, box2)
  }

  // Mapear cada caja a su color promedio y tamaño
  return boxes.map((box) => ({
    color: getAverageColor(box.pixels),
    count: box.pixels.length,
  }))
}

/**
 * Extrae los colores dominantes de un elemento HTMLImageElement ya decodificado en el navegador.
 * Desprecia píxeles transparentes (alpha < 125) para evitar falsos negros en PNGs.
 */
export function extractDominantColorsFromImage(
  img: HTMLImageElement,
  targetCount: number = 5
): ExtractedColor[] {
  const safeCount = Math.max(3, Math.min(8, Math.round(targetCount)))

  // Escalar la imagen a una resolución de análisis controlada (máximo 160px de lado)
  // para análisis en < 50ms sin degradar la representatividad cromática
  const maxDim = 160
  let width = img.naturalWidth || img.width
  let height = img.naturalHeight || img.height

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width)
      width = maxDim
    } else {
      width = Math.round((width * maxDim) / height)
      height = maxDim
    }
  }

  width = Math.max(1, width)
  height = Math.max(1, height)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d", { willReadFrequently: true })

  if (!ctx) {
    throw new Error("No se pudo inicializar el contexto gráfico del navegador.")
  }

  ctx.drawImage(img, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const validPixels: RGB[] = []

  // Recorrer píxeles descartando transparencia
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    // Píxeles transparentes se omiten (umbral alfa 125)
    if (a >= 125) {
      validPixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      })
    }
  }

  if (validPixels.length === 0) {
    // Si toda la imagen es transparente, fallback seguro
    return [
      {
        hex: "#7C3AED",
        rgb: { r: 124, g: 58, b: 237 },
        hsl: { h: 262, s: 83, l: 58 },
        count: 1,
        percentage: 100,
      },
    ]
  }

  const clusters = medianCutQuantize(validPixels, safeCount)
  const totalAnalyzed = validPixels.length

  // Calcular porcentajes reales con redondeo armónico
  const rawResults = clusters.map((cluster) => {
    const hex = rgbToHex(cluster.color.r, cluster.color.g, cluster.color.b)
    const hsl = rgbToHsl(cluster.color.r, cluster.color.g, cluster.color.b)
    const pct = Math.round((cluster.count / totalAnalyzed) * 100)
    return {
      hex,
      rgb: cluster.color,
      hsl,
      count: cluster.count,
      percentage: pct,
    }
  })

  // Ordenar por presencia descendente
  rawResults.sort((a, b) => b.count - a.count)

  // Asegurar que la suma de porcentajes no sea 0 y ajuste visualmente
  const sum = rawResults.reduce((acc, c) => acc + c.percentage, 0)
  if (sum !== 100 && rawResults.length > 0) {
    const diff = 100 - sum
    rawResults[0].percentage = Math.max(1, rawResults[0].percentage + diff)
  }

  return rawResults
}

/**
 * Valida un archivo antes de procesarlo.
 * Admite JPG/JPEG, PNG y WebP, con límite de tamaño de 15MB.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
  const validExtensions = /\.(jpe?g|png|webp)$/i

  if (!file) {
    return { valid: false, error: "No se seleccionó ningún archivo." }
  }

  const hasValidMime = file.type ? validMimes.includes(file.type.toLowerCase()) : false
  const hasValidExt = validExtensions.test(file.name)

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: "Formato no compatible. Por favor subí una imagen JPG, PNG o WebP.",
    }
  }

  const maxSizeMB = 15
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `La imagen supera el límite máximo permitido de ${maxSizeMB} MB.`,
    }
  }

  return { valid: true }
}
