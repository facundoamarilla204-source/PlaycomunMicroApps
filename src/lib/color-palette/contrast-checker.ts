import { ContrastResult } from "./types"
import { hexToRgb, getRelativeLuminance, hexToHsl, hslToHex, normalizeHex } from "./color-converter"

/**
 * Calcula la relación de contraste WCAG 2.2 entre dos colores HEX.
 * Devuelve un objeto ContrastResult con el ratio exacto y los checks de nivel AA/AAA.
 */
export function calculateContrast(foregroundHex: string, backgroundHex: string): ContrastResult {
  const fgRgb = hexToRgb(foregroundHex) || { r: 15, g: 23, b: 42 }
  const bgRgb = hexToRgb(backgroundHex) || { r: 255, g: 255, b: 255 }

  const lumFg = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b)
  const lumBg = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b)

  const lighter = Math.max(lumFg, lumBg)
  const darker = Math.min(lumFg, lumBg)

  const ratio = (lighter + 0.05) / (darker + 0.05)
  const roundedRatio = Math.round(ratio * 100) / 100

  return {
    ratio: roundedRatio,
    ratioFormatted: `${roundedRatio.toFixed(2)}:1`,
    normalTextAA: roundedRatio >= 4.5,
    normalTextAAA: roundedRatio >= 7.0,
    largeTextAA: roundedRatio >= 3.0,
    largeTextAAA: roundedRatio >= 4.5,
    uiComponentsAA: roundedRatio >= 3.0,
  }
}

/**
 * Sugiere un ajuste real de luminosidad en el color de primer plano para alcanzar
 * el estándar WCAG AA (>= 4.5:1) contra el fondo seleccionado.
 * Devuelve el color HEX ajustado o null si ya cumplía o no fue posible.
 */
export function suggestContrastAdjustment(
  foregroundHex: string,
  backgroundHex: string,
  targetRatio: number = 4.5
): string | null {
  const initial = calculateContrast(foregroundHex, backgroundHex)
  if (initial.ratio >= targetRatio) return null

  const bgRgb = hexToRgb(backgroundHex)
  const fgHsl = hexToHsl(foregroundHex)
  if (!bgRgb || !fgHsl) return null

  const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
  // Si el fondo es claro, oscurecemos el texto (hacia l=0).
  // Si el fondo es oscuro, aclaramos el texto (hacia l=100).
  const shouldDarken = bgLum > 0.4

  let bestCandidate: string | null = null
  const { h, s } = fgHsl

  if (shouldDarken) {
    for (let l = fgHsl.l; l >= 0; l -= 2) {
      const candidateHex = hslToHex(h, s, l)
      const res = calculateContrast(candidateHex, backgroundHex)
      if (res.ratio >= targetRatio) {
        bestCandidate = candidateHex
        break
      }
    }
  } else {
    for (let l = fgHsl.l; l <= 100; l += 2) {
      const candidateHex = hslToHex(h, s, l)
      const res = calculateContrast(candidateHex, backgroundHex)
      if (res.ratio >= targetRatio) {
        bestCandidate = candidateHex
        break
      }
    }
  }

  // Si con el mismo tono no alcanza, fallback a blanco o negro puro
  if (!bestCandidate) {
    const blackRatio = calculateContrast("#000000", backgroundHex).ratio
    const whiteRatio = calculateContrast("#FFFFFF", backgroundHex).ratio
    bestCandidate = blackRatio > whiteRatio ? "#000000" : "#FFFFFF"
  }

  return normalizeHex(bestCandidate)
}
