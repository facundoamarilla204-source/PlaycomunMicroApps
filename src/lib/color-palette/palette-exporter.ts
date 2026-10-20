import { hexToRgb, hexToHsl, getContrastingTextColor, normalizeHex } from "./color-converter"

/**
 * Copia un texto al portapapeles con fallback para entornos donde navigator.clipboard esté restringido.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Continuar al fallback
  }

  // Fallback con textarea temporal
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.left = "-9999px"
    textarea.style.top = "0"
    textarea.setAttribute("readonly", "")
    document.body.appendChild(textarea)
    textarea.select()
    const successful = document.execCommand("copy")
    document.body.removeChild(textarea)
    return successful
  } catch {
    return false
  }
}

/**
 * Genera bloque de variables CSS para la paleta.
 */
export function exportCss(colors: string[], paletteName: string = "paleta-playcomun"): string {
  const lines = colors.map((c, i) => `  --color-${i + 1}: ${normalizeHex(c)};`)
  return `/* Paleta de colores: ${paletteName} */\n/* Generado con PlayComun Online (https://www.playcomun.online) */\n:root {\n${lines.join("\n")}\n}`
}

/**
 * Genera exportación JSON válida y estructurada.
 */
export function exportJson(colors: string[], paletteName: string = "Paleta PlayComun"): string {
  const data = {
    name: paletteName,
    generator: "PlayComun Online",
    url: "https://www.playcomun.online/herramientas/generador-paletas-colores",
    exportedAt: new Date().toISOString(),
    totalColors: colors.length,
    colors: colors.map((c, i) => {
      const hex = normalizeHex(c) || c
      const rgb = hexToRgb(hex)
      const hsl = hexToHsl(hex)
      return {
        id: i + 1,
        hex,
        rgb: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : null,
        hsl: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : null,
      }
    }),
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Genera configuración compatible para Tailwind CSS (v4 y v3).
 */
export function exportTailwind(colors: string[], paletteName: string = "paleta"): string {
  const slug = paletteName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "paleta"

  // Formato Tailwind v4 (@theme en CSS)
  const v4Lines = colors.map((c, i) => `  --color-${slug}-${i + 1}: ${normalizeHex(c)};`)
  const v4Output = `/* Tailwind CSS v4 (@theme en globals.css) */\n@theme {\n${v4Lines.join("\n")}\n}`

  // Formato Tailwind v3 (tailwind.config.js)
  const v3Entries = colors.map((c, i) => `        '${i + 1}': '${normalizeHex(c)}',`)
  const v3Output = `// Tailwind CSS v3 (tailwind.config.js)\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${slug}': {\n${v3Entries.join("\n")}\n        }\n      }\n    }\n  }\n}`

  return `${v4Output}\n\n${v3Output}`
}

/**
 * Genera y descarga una imagen PNG en alta resolución (1200x630 px) con la paleta de colores.
 */
export async function downloadPalettePng(
  colors: string[],
  paletteName: string = "Paleta de colores"
): Promise<void> {
  const width = 1200
  const height = 630

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo crear el lienzo para exportar la imagen.")

  // Fondo blanco limpio
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, width, height)

  // Encabezado
  ctx.fillStyle = "#0F172A"
  ctx.font = "bold 32px sans-serif"
  ctx.fillText(paletteName, 50, 60)

  ctx.fillStyle = "#64748B"
  ctx.font = "16px sans-serif"
  ctx.fillText("Generado con PlayComun Online · Herramientas gratuitas", 50, 92)

  // Área de muestras
  const startY = 130
  const swatchHeight = 420
  const totalWidth = width - 100 // 50px de margen a cada lado
  const swatchWidth = totalWidth / colors.length

  colors.forEach((color, i) => {
    const hex = normalizeHex(color) || color
    const x = 50 + i * swatchWidth

    // Rectángulo de muestra de color
    ctx.fillStyle = hex
    ctx.fillRect(x, startY, swatchWidth, swatchHeight)

    // Información del color dentro de la muestra
    const contrastColor = getContrastingTextColor(hex)
    ctx.fillStyle = contrastColor

    // Código HEX centrado en la parte inferior de la muestra
    ctx.font = "bold 22px monospace"
    ctx.textAlign = "center"
    ctx.fillText(hex, x + swatchWidth / 2, startY + swatchHeight - 45)

    // Número de muestra
    ctx.font = "bold 16px sans-serif"
    ctx.fillText(`Color ${i + 1}`, x + swatchWidth / 2, startY + 45)
  })

  // Pie de imagen
  ctx.textAlign = "left"
  ctx.fillStyle = "#94A3B8"
  ctx.font = "14px sans-serif"
  ctx.fillText("playcomun.online/herramientas/generador-paletas-colores", 50, height - 30)

  // Descarga del Blob PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Error al convertir el lienzo a archivo PNG."))
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const safeFilename = paletteName
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
      a.download = `${safeFilename || "paleta-colores"}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      resolve()
    }, "image/png")
  })
}

/**
 * Dispara la descarga de un archivo de texto en el navegador.
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = "text/plain"): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
