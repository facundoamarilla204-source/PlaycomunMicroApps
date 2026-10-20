import { ColorHarmony, HSL } from "./types"
import { hexToHsl, hslToHex, normalizeHex } from "./color-converter"

/**
 * Normaliza un ángulo de matiz en el rango [0, 360).
 */
function wrapHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

/**
 * Limita un valor numérico entre min y max.
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/**
 * Calcula matices y luminancias según la regla de armonía cromática.
 */
function calculateRawHarmonyHsl(baseHsl: HSL, harmony: ColorHarmony, count: number): HSL[] {
  const { h, s, l } = baseHsl
  const result: HSL[] = []

  switch (harmony) {
    case "complementario": {
      // Base + opuesto a 180°
      const compH = wrapHue(h + 180)
      if (count === 3) {
        result.push({ h, s, l: clamp(l + 15, 20, 85) })
        result.push({ h, s, l })
        result.push({ h: compH, s, l })
      } else if (count === 4) {
        result.push({ h, s, l: clamp(l + 18, 20, 85) })
        result.push({ h, s, l })
        result.push({ h: compH, s, l })
        result.push({ h: compH, s, l: clamp(l - 18, 15, 80) })
      } else if (count === 5) {
        result.push({ h, s, l: clamp(l + 22, 20, 90) })
        result.push({ h, s, l })
        result.push({ h, s: clamp(s - 20, 20, 100), l: clamp(l - 20, 15, 80) })
        result.push({ h: compH, s, l })
        result.push({ h: compH, s, l: clamp(l - 22, 15, 80) })
      } else {
        // 6 colores
        result.push({ h, s, l: clamp(l + 25, 20, 92) })
        result.push({ h, s, l })
        result.push({ h, s: clamp(s - 20, 20, 100), l: clamp(l - 22, 15, 80) })
        result.push({ h: compH, s, l: clamp(l + 20, 20, 90) })
        result.push({ h: compH, s, l })
        result.push({ h: compH, s: clamp(s - 15, 20, 100), l: clamp(l - 22, 15, 80) })
      }
      break
    }

    case "analogo": {
      // Tonos adyacentes a saltos de 25-30 grados
      const step = 28
      const half = Math.floor(count / 2)
      for (let i = -half; i <= half; i++) {
        if (result.length < count) {
          result.push({
            h: wrapHue(h + i * step),
            s: clamp(s + (i % 2 === 0 ? 0 : -8), 25, 95),
            l: clamp(l + (i % 2 === 0 ? 0 : 8), 20, 85),
          })
        }
      }
      break
    }

    case "triadico": {
      // 3 puntos equidistantes a 120°
      const h1 = h
      const h2 = wrapHue(h + 120)
      const h3 = wrapHue(h + 240)

      const baseTriad = [
        { h: h1, s, l },
        { h: h2, s, l },
        { h: h3, s, l },
      ]

      if (count === 3) {
        result.push(...baseTriad)
      } else if (count === 4) {
        result.push(
          baseTriad[0],
          { h: h1, s: clamp(s - 20, 20, 100), l: clamp(l + 20, 25, 88) },
          baseTriad[1],
          baseTriad[2]
        )
      } else if (count === 5) {
        result.push(
          baseTriad[0],
          { h: h1, s: clamp(s - 20, 20, 100), l: clamp(l + 20, 25, 88) },
          baseTriad[1],
          { h: h2, s: clamp(s - 15, 20, 100), l: clamp(l - 18, 15, 80) },
          baseTriad[2]
        )
      } else {
        // 6 colores
        result.push(
          { h: h1, s, l: clamp(l + 18, 25, 88) },
          baseTriad[0],
          { h: h2, s, l: clamp(l + 18, 25, 88) },
          baseTriad[1],
          { h: h3, s, l: clamp(l + 18, 25, 88) },
          baseTriad[2]
        )
      }
      break
    }

    case "monocromatico": {
      // Mismo tono H, variando luminosidad de forma armónica
      const minL = 18
      const maxL = 88
      const lStep = (maxL - minL) / (count - 1)

      for (let i = 0; i < count; i++) {
        const curL = Math.round(minL + i * lStep)
        // Saturation sutilmente modulada
        const curS = clamp(s - Math.abs(curL - 50) * 0.25, 20, 95)
        result.push({
          h,
          s: Math.round(curS),
          l: curL,
        })
      }
      break
    }

    case "complementario-dividido": {
      // Base + dos colores adyacentes a su complementario (150° y 210°)
      const split1 = wrapHue(h + 150)
      const split2 = wrapHue(h + 210)

      if (count === 3) {
        result.push({ h, s, l }, { h: split1, s, l }, { h: split2, s, l })
      } else if (count === 4) {
        result.push(
          { h, s, l: clamp(l + 18, 25, 88) },
          { h, s, l },
          { h: split1, s, l },
          { h: split2, s, l }
        )
      } else if (count === 5) {
        result.push(
          { h, s, l: clamp(l + 18, 25, 88) },
          { h, s, l },
          { h: split1, s, l },
          { h: split1, s: clamp(s - 15, 20, 100), l: clamp(l - 18, 15, 80) },
          { h: split2, s, l }
        )
      } else {
        // 6 colores
        result.push(
          { h, s, l: clamp(l + 20, 25, 90) },
          { h, s, l },
          { h: split1, s, l: clamp(l + 16, 25, 88) },
          { h: split1, s, l },
          { h: split2, s, l: clamp(l + 16, 25, 88) },
          { h: split2, s, l }
        )
      }
      break
    }

    case "tetradico": {
      // 4 colores en rectángulo cromático: base, base+60°, base+180°, base+240°
      const t1 = h
      const t2 = wrapHue(h + 60)
      const t3 = wrapHue(h + 180)
      const t4 = wrapHue(h + 240)

      if (count === 3) {
        result.push({ h: t1, s, l }, { h: t2, s, l }, { h: t3, s, l })
      } else if (count === 4) {
        result.push({ h: t1, s, l }, { h: t2, s, l }, { h: t3, s, l }, { h: t4, s, l })
      } else if (count === 5) {
        result.push(
          { h: t1, s, l },
          { h: t2, s, l },
          { h: t3, s, l },
          { h: t4, s, l },
          { h: t1, s: clamp(s - 20, 20, 100), l: clamp(l + 20, 25, 88) }
        )
      } else {
        // 6 colores
        result.push(
          { h: t1, s, l },
          { h: t2, s, l },
          { h: t3, s, l },
          { h: t4, s, l },
          { h: t1, s: clamp(s - 20, 20, 100), l: clamp(l + 20, 25, 88) },
          { h: t3, s: clamp(s - 20, 20, 100), l: clamp(l - 18, 15, 80) }
        )
      }
      break
    }

    case "aleatorio":
    default: {
      // Generación por razón áurea para dispersión armónica y estética
      const goldenRatio = 0.618033988749895
      let curH = Math.random() * 360
      for (let i = 0; i < count; i++) {
        curH = (curH + goldenRatio * 360) % 360
        result.push({
          h: Math.round(curH),
          s: Math.round(55 + Math.random() * 35), // 55% - 90%
          l: Math.round(30 + Math.random() * 45), // 30% - 75%
        })
      }
      break
    }
  }

  // Si por alguna razón faltan colores, completar con variantes
  while (result.length < count) {
    const last = result[result.length - 1] || baseHsl
    result.push({
      h: wrapHue(last.h + 35),
      s: clamp(last.s - 5, 20, 95),
      l: clamp(last.l + 10, 20, 85),
    })
  }

  return result.slice(0, count)
}

/**
 * Genera una paleta de colores armónica respetando los colores bloqueados.
 * count debe estar entre 3 y 6.
 */
export function generateHarmony(
  baseHex: string,
  harmony: ColorHarmony,
  count: number = 5,
  lockedColors?: (string | null)[]
): string[] {
  const safeCount = Math.max(3, Math.min(6, Math.round(count)))
  const normalizedBase = normalizeHex(baseHex) || "#7C3AED"
  const baseHsl = hexToHsl(normalizedBase) || { h: 262, s: 83, l: 58 }

  const calculatedHslList = calculateRawHarmonyHsl(baseHsl, harmony, safeCount)
  const newColors = calculatedHslList.map((hsl) => hslToHex(hsl.h, hsl.s, hsl.l))

  // Si hay colores bloqueados, conservarlos en su índice
  if (lockedColors && lockedColors.length > 0) {
    return Array.from({ length: safeCount }, (_, i) => {
      const locked = lockedColors[i]
      if (locked && normalizeHex(locked)) {
        return normalizeHex(locked)!
      }
      return newColors[i] || normalizeHex(baseHex)!
    })
  }

  return newColors
}

/**
 * Genera un color HEX aleatorio estético (evita grises turbios o extremos puros).
 */
export function getRandomHexColor(): string {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(65 + Math.random() * 30) // 65-95%
  const l = Math.floor(40 + Math.random() * 30) // 40-70%
  return hslToHex(h, s, l)
}
