import { RGB, HSL } from "./types"

/**
 * Valida si un string es un código HEX válido (3 o 6 caracteres, con o sin #).
 */
export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== "string") return false
  const clean = hex.trim().replace(/^#/, "")
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(clean)
}

/**
 * Normaliza un código HEX a formato estándar #RRGGBB en mayúsculas.
 * Si es inválido, devuelve null.
 */
export function normalizeHex(hex: string): string | null {
  if (!isValidHex(hex)) return null
  let clean = hex.trim().replace(/^#/, "").toUpperCase()
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("")
  }
  return `#${clean}`
}

/**
 * Convierte código HEX a RGB. Devuelve null si el código es inválido.
 */
export function hexToRgb(hex: string): RGB | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  const num = parseInt(normalized.slice(1), 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/**
 * Convierte componentes RGB a código HEX #RRGGBB.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)))
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0").toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convierte componentes RGB a HSL.
 * H: 0-360, S: 0-100, L: 0-100.
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rNorm = Math.max(0, Math.min(255, r)) / 255
  const gNorm = Math.max(0, Math.min(255, g)) / 255
  const bNorm = Math.max(0, Math.min(255, b)) / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60
        break
      case gNorm:
        h = ((bNorm - rNorm) / delta + 2) * 60
        break
      case bNorm:
        h = ((rNorm - gNorm) / delta + 4) * 60
        break
    }
  }

  return {
    h: Math.round(h % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Convierte HSL a RGB.
 * H: 0-360, S: 0-100, L: 0-100.
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const hNorm = ((h % 360) + 360) % 360
  const sNorm = Math.max(0, Math.min(100, s)) / 100
  const lNorm = Math.max(0, Math.min(100, l)) / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1))
  const m = lNorm - c / 2

  let rPrime = 0
  let gPrime = 0
  let bPrime = 0

  if (hNorm < 60) {
    rPrime = c
    gPrime = x
    bPrime = 0
  } else if (hNorm < 120) {
    rPrime = x
    gPrime = c
    bPrime = 0
  } else if (hNorm < 180) {
    rPrime = 0
    gPrime = c
    bPrime = x
  } else if (hNorm < 240) {
    rPrime = 0
    gPrime = x
    bPrime = c
  } else if (hNorm < 300) {
    rPrime = x
    gPrime = 0
    bPrime = c
  } else {
    rPrime = c
    gPrime = 0
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  }
}

/**
 * Convierte HEX a HSL.
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

/**
 * Convierte HSL a HEX.
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * Calcula la luminancia relativa según estándar WCAG 2.2.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Devuelve si sobre este fondo conviene texto claro (#FFFFFF) u oscuro (#0F172A)
 * para máxima legibilidad visual en la interfaz.
 */
export function getContrastingTextColor(hex: string): "#FFFFFF" | "#0F172A" {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#0F172A"
  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b)
  return lum > 0.45 ? "#0F172A" : "#FFFFFF"
}
