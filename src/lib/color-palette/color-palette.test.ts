import { describe, it, expect, beforeEach } from "vitest"
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  isValidHex,
  normalizeHex,
  getContrastingTextColor,
} from "./color-converter"
import { generateHarmony, getRandomHexColor } from "./harmony-algorithms"
import { calculateContrast, suggestContrastAdjustment } from "./contrast-checker"
import { exportCss, exportJson, exportTailwind } from "./palette-exporter"
import { validateImageFile } from "./image-quantizer"
import {
  getFavoritePalettes,
  saveFavoritePalette,
  removeFavoritePalette,
  isPaletteInFavorites,
} from "./favorites-storage"

describe("Color Converter & Validation", () => {
  it("valida códigos HEX correctamente", () => {
    expect(isValidHex("#7C3AED")).toBe(true)
    expect(isValidHex("7c3aed")).toBe(true)
    expect(isValidHex("#FFF")).toBe(true)
    expect(isValidHex("abc")).toBe(true)
    expect(isValidHex("#12345")).toBe(false)
    expect(isValidHex("ZZZ")).toBe(false)
    expect(isValidHex("")).toBe(false)
  })

  it("normaliza códigos HEX a formato #RRGGBB mayúsculas", () => {
    expect(normalizeHex("fff")).toBe("#FFFFFF")
    expect(normalizeHex("#7c3aed")).toBe("#7C3AED")
    expect(normalizeHex("000")).toBe("#000000")
    expect(normalizeHex("invalido")).toBeNull()
  })

  it("convierte HEX a RGB y viceversa", () => {
    const rgb = hexToRgb("#7C3AED")
    expect(rgb).toEqual({ r: 124, g: 58, b: 237 })
    expect(rgbToHex(124, 58, 237)).toBe("#7C3AED")

    // Blanco y negro puros
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 })
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF")
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 })
    expect(rgbToHex(0, 0, 0)).toBe("#000000")
  })

  it("convierte RGB a HSL y viceversa de forma consistente", () => {
    // Blanco puro
    const whiteHsl = rgbToHsl(255, 255, 255)
    expect(whiteHsl.l).toBe(100)
    expect(hslToRgb(whiteHsl.h, whiteHsl.s, whiteHsl.l)).toEqual({ r: 255, g: 255, b: 255 })

    // Negro puro
    const blackHsl = rgbToHsl(0, 0, 0)
    expect(blackHsl.l).toBe(0)
    expect(hslToRgb(blackHsl.h, blackHsl.s, blackHsl.l)).toEqual({ r: 0, g: 0, b: 0 })

    // Violeta PlayComun #7C3AED
    const violetHsl = hexToHsl("#7C3AED")!
    expect(violetHsl.h).toBeGreaterThanOrEqual(260)
    expect(violetHsl.h).toBeLessThanOrEqual(265)
    // Conversión con tolerancia de redondeo discreto (±1 en canal de 255)
    const roundTripRgb = hexToRgb(hslToHex(violetHsl.h, violetHsl.s, violetHsl.l))!
    expect(Math.abs(roundTripRgb.r - 124)).toBeLessThanOrEqual(1)
    expect(Math.abs(roundTripRgb.g - 58)).toBeLessThanOrEqual(1)
    expect(Math.abs(roundTripRgb.b - 237)).toBeLessThanOrEqual(1)

    // Colores puros donde el mapeo es exacto
    expect(hslToHex(0, 100, 50)).toBe("#FF0000")
    expect(hslToHex(120, 100, 50)).toBe("#00FF00")
    expect(hslToHex(240, 100, 50)).toBe("#0000FF")
  })

  it("determina el contraste de texto para la interfaz", () => {
    expect(getContrastingTextColor("#FFFFFF")).toBe("#0F172A")
    expect(getContrastingTextColor("#000000")).toBe("#FFFFFF")
    expect(getContrastingTextColor("#F8FAFC")).toBe("#0F172A")
    expect(getContrastingTextColor("#1E1B4B")).toBe("#FFFFFF")
  })
})

describe("Harmony Algorithms", () => {
  const base = "#7C3AED"

  it("genera la cantidad exacta de colores solicitada (de 3 a 6)", () => {
    for (let count = 3; count <= 6; count++) {
      const comp = generateHarmony(base, "complementario", count)
      expect(comp).toHaveLength(count)

      const analogo = generateHarmony(base, "analogo", count)
      expect(analogo).toHaveLength(count)

      const triad = generateHarmony(base, "triadico", count)
      expect(triad).toHaveLength(count)

      const mono = generateHarmony(base, "monocromatico", count)
      expect(mono).toHaveLength(count)

      const split = generateHarmony(base, "complementario-dividido", count)
      expect(split).toHaveLength(count)

      const tetradic = generateHarmony(base, "tetradico", count)
      expect(tetradic).toHaveLength(count)

      const random = generateHarmony(base, "aleatorio", count)
      expect(random).toHaveLength(count)
    }
  })

  it("retiene los colores bloqueados en sus índices exactos al regenerar", () => {
    const lockedColor0 = "#FF0000"
    const lockedColor3 = "#00FF00"
    const lockedArray: (string | null)[] = [lockedColor0, null, null, lockedColor3, null]

    const result = generateHarmony(base, "triadico", 5, lockedArray)

    expect(result).toHaveLength(5)
    expect(result[0]).toBe(lockedColor0)
    expect(result[3]).toBe(lockedColor3)
    // Los índices 1, 2 y 4 son regenerados
    expect(isValidHex(result[1])).toBe(true)
    expect(isValidHex(result[2])).toBe(true)
    expect(isValidHex(result[4])).toBe(true)
  })

  it("genera colores aleatorios válidos y estéticos", () => {
    const randomHex = getRandomHexColor()
    expect(isValidHex(randomHex)).toBe(true)
    expect(randomHex.startsWith("#")).toBe(true)
  })
})

describe("WCAG 2.2 Contrast Checker", () => {
  it("calcula contraste exacto para casos canónicos", () => {
    // Negro sobre blanco: 21:1
    const blackOnWhite = calculateContrast("#000000", "#FFFFFF")
    expect(blackOnWhite.ratio).toBe(21)
    expect(blackOnWhite.normalTextAA).toBe(true)
    expect(blackOnWhite.normalTextAAA).toBe(true)

    // Blanco sobre blanco: 1:1
    const whiteOnWhite = calculateContrast("#FFFFFF", "#FFFFFF")
    expect(whiteOnWhite.ratio).toBe(1)
    expect(whiteOnWhite.normalTextAA).toBe(false)
    expect(whiteOnWhite.largeTextAA).toBe(false)
  })

  it("identifica umbrales de texto normal vs grande", () => {
    // Un contraste cercano a 3.5:1 pasa para texto grande AA, pero falla normal AA
    const midContrast = calculateContrast("#64748B", "#FFFFFF")
    expect(midContrast.ratio).toBeGreaterThanOrEqual(3.0)
    expect(midContrast.largeTextAA).toBe(true)
  })

  it("sugiere ajuste de contraste válido cuando una combinación falla AA", () => {
    const badForeground = "#A78BFA" // Violeta claro sobre blanco (ratio bajo)
    const background = "#FFFFFF"

    const current = calculateContrast(badForeground, background)
    expect(current.normalTextAA).toBe(false)

    const suggested = suggestContrastAdjustment(badForeground, background, 4.5)
    expect(suggested).not.toBeNull()

    const adjustedResult = calculateContrast(suggested!, background)
    expect(adjustedResult.ratio).toBeGreaterThanOrEqual(4.5)
    expect(adjustedResult.normalTextAA).toBe(true)
  })
})

describe("Image Quantizer & Validation", () => {
  it("valida formatos y tamaños de imagen", () => {
    const validFile = new File(["dummy content"], "foto.png", { type: "image/png" })
    expect(validateImageFile(validFile).valid).toBe(true)

    const invalidFile = new File(["dummy content"], "archivo.txt", { type: "text/plain" })
    expect(validateImageFile(invalidFile).valid).toBe(false)

    const hugeFile = new File([new ArrayBuffer(20 * 1024 * 1024)], "gigante.jpg", {
      type: "image/jpeg",
    })
    expect(validateImageFile(hugeFile).valid).toBe(false)
  })
})

describe("Palette Exporter", () => {
  const testColors = ["#7C3AED", "#A78BFA", "#C4B5FD", "#EDE9FE"]

  it("exporta variables CSS válidas con nombres ordenados", () => {
    const css = exportCss(testColors, "marca-demo")
    expect(css).toContain(":root {")
    expect(css).toContain("--color-1: #7C3AED;")
    expect(css).toContain("--color-2: #A78BFA;")
    expect(css).toContain("--color-4: #EDE9FE;")
  })

  it("exporta JSON estructurado y analizable", () => {
    const jsonStr = exportJson(testColors, "Paleta Test")
    const parsed = JSON.parse(jsonStr)

    expect(parsed.name).toBe("Paleta Test")
    expect(parsed.totalColors).toBe(4)
    expect(parsed.colors).toHaveLength(4)
    expect(parsed.colors[0].hex).toBe("#7C3AED")
    expect(parsed.colors[0].rgb).toContain("rgb")
  })

  it("exporta configuración compatible para Tailwind CSS v4 y v3", () => {
    const tw = exportTailwind(testColors, "marca")
    expect(tw).toContain("@theme")
    expect(tw).toContain("--color-marca-1: #7C3AED;")
    expect(tw).toContain("module.exports")
    expect(tw).toContain("'1': '#7C3AED'")
  })
})

describe("Favorites Storage (localStorage)", () => {
  const mockStorage: Record<string, string> = {}

  beforeEach(() => {
    for (const k in mockStorage) delete mockStorage[k]
    ;(global as any).window = global
    ;(global as any).localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val
      },
      removeItem: (key: string) => {
        delete mockStorage[key]
      },
      clear: () => {
        for (const k in mockStorage) delete mockStorage[k]
      },
      length: 0,
      key: () => null,
    }
  })

  it("guarda, recupera y previene duplicados en favoritos", () => {
    expect(getFavoritePalettes()).toEqual([])

    const saved = saveFavoritePalette({
      name: "Mi Paleta Pro",
      colors: ["#7C3AED", "#10B981", "#3B82F6"],
    })

    expect(saved).not.toBeNull()
    expect(saved?.name).toBe("Mi Paleta Pro")

    const all = getFavoritePalettes()
    expect(all).toHaveLength(1)
    expect(all[0].colors).toEqual(["#7C3AED", "#10B981", "#3B82F6"])

    expect(isPaletteInFavorites(["#7c3aed", "#10b981", "#3b82f6"], all)).toBe(true)

    // Prevenir duplicado idéntico
    saveFavoritePalette({ colors: ["#7C3AED", "#10B981", "#3B82F6"] })
    expect(getFavoritePalettes()).toHaveLength(1)

    // Eliminar
    removeFavoritePalette(all[0].id)
    expect(getFavoritePalettes()).toHaveLength(0)
  })
})
