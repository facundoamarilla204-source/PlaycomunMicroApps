import { describe, it, expect } from "vitest"
import {
  calculateFontSizePx,
  calculateLogoDimensions,
  calculatePresetCoordinates,
  resolveWatermarkPosition,
  sanitizeWatermarkFileName,
  resolveCanvasFontFamily,
  buildCanvasFont,
  AVAILABLE_FONTS,
  DEFAULT_WATERMARK_CONFIG,
} from "../layout"
import { WatermarkConfig } from "../types"

describe("Watermark Layout & Geometry Engine", () => {
  it("calculates relative font size within reasonable bounds", () => {
    // 1000x800 image, min dimension is 800
    // 6% of 800 = 48px
    const size = calculateFontSizePx(1000, 800, 6)
    expect(size).toBe(48)

    // Very small minDim should be clamped at minimum 12px
    const smallSize = calculateFontSizePx(50, 50, 2)
    expect(smallSize).toBeGreaterThanOrEqual(12)
  })

  it("calculates logo dimensions while preserving aspect ratio", () => {
    // Landscape image 2000x1000 (minDim = 1000)
    // Logo 400x200 (2:1 aspect ratio)
    // Scale 20% -> major dimension 200px
    const dimsWide = calculateLogoDimensions(2000, 1000, 400, 200, 20)
    expect(dimsWide.width).toBe(200)
    expect(dimsWide.height).toBe(100)

    // Tall logo 150x300 (1:2 aspect ratio)
    const dimsTall = calculateLogoDimensions(2000, 1000, 150, 300, 20)
    expect(dimsTall.width).toBe(100)
    expect(dimsTall.height).toBe(200)
  })

  it("positions presets accurately with edge margin", () => {
    const W = 1000
    const H = 800
    const wW = 100
    const wH = 40
    const marginPercent = 5 // 5% of min(1000, 800) = 40px

    // Top-Left: x = 40 + 50 = 90, y = 40 + 20 = 60
    const topLeft = calculatePresetCoordinates(W, H, wW, wH, "top-left", marginPercent)
    expect(topLeft.centerX).toBe(90)
    expect(topLeft.centerY).toBe(60)

    // Center: x = 500, y = 400
    const center = calculatePresetCoordinates(W, H, wW, wH, "center", marginPercent)
    expect(center.centerX).toBe(500)
    expect(center.centerY).toBe(400)

    // Bottom-Right: x = 1000 - 40 - 50 = 910, y = 800 - 40 - 20 = 740
    const bottomRight = calculatePresetCoordinates(W, H, wW, wH, "bottom-right", marginPercent)
    expect(bottomRight.centerX).toBe(910)
    expect(bottomRight.centerY).toBe(740)
  })

  it("resolves custom drag coordinates correctly", () => {
    const customConfig: WatermarkConfig = {
      ...DEFAULT_WATERMARK_CONFIG,
      position: "custom",
      customPos: {
        xRel: 0.25,
        yRel: 0.75,
      },
    }

    const box = resolveWatermarkPosition(1000, 800, 120, 60, customConfig)
    expect(box.centerX).toBe(250)
    expect(box.centerY).toBe(600)
    expect(box.width).toBe(120)
    expect(box.height).toBe(60)
  })

  it("sanitizes output filenames and applies -watermark suffix correctly", () => {
    const r1 = sanitizeWatermarkFileName("Mi Foto Vacaciones.JPG", "original", "jpeg")
    expect(r1.fileName).toBe("Mi Foto Vacaciones-watermark.jpg")
    expect(r1.extension).toBe("jpg")

    const r2 = sanitizeWatermarkFileName("logo_vector.png", "webp", "png")
    expect(r2.fileName).toBe("logo_vector-watermark.webp")
    expect(r2.extension).toBe("webp")

    const r3 = sanitizeWatermarkFileName("test@#$.png", "png", "png")
    expect(r3.fileName).toBe("test-watermark.png")
    expect(r3.extension).toBe("png")
  })

  it("has valid default fonts loaded", () => {
    expect(AVAILABLE_FONTS.length).toBeGreaterThanOrEqual(4)
    expect(AVAILABLE_FONTS[0].id).toBe("work-sans")
  })

  it("handles portrait and square images consistently", () => {
    // Portrait image 1000x2000, minDim = 1000
    const portraitCenter = calculatePresetCoordinates(1000, 2000, 200, 100, "center", 5)
    expect(portraitCenter.centerX).toBe(500)
    expect(portraitCenter.centerY).toBe(1000)

    // Square image 1500x1500, minDim = 1500
    // Margin 10% = 150px
    // bottom-right: x = 1500 - 150 - 100 = 1250, y = 1500 - 150 - 50 = 1300
    const squareBR = calculatePresetCoordinates(1500, 1500, 200, 100, "bottom-right", 10)
    expect(squareBR.centerX).toBe(1250)
    expect(squareBR.centerY).toBe(1300)
  })

  it("preserves relative scale regardless of image orientation", () => {
    // Horizontal 4000x2000 vs Vertical 2000x4000
    // In both cases, min dimension is 2000px, so 10% scale results in 200px
    const fontH = calculateFontSizePx(4000, 2000, 10)
    const fontV = calculateFontSizePx(2000, 4000, 10)
    expect(fontH).toBe(fontV)
    expect(fontH).toBe(200)
  })

  it("correctly determines target formats and extensions", () => {
    // Original format preserved when requested
    expect(sanitizeWatermarkFileName("doc.png", "original", "png").extension).toBe("png")
    expect(sanitizeWatermarkFileName("doc.jpg", "original", "jpeg").extension).toBe("jpg")
    expect(sanitizeWatermarkFileName("doc.webp", "original", "webp").extension).toBe("webp")

    // Force convert to PNG
    expect(sanitizeWatermarkFileName("photo.jpg", "png", "jpeg").extension).toBe("png")

    // Force convert to WebP
    expect(sanitizeWatermarkFileName("photo.png", "webp", "png").extension).toBe("webp")
  })

  it("resolves canvas font family removing unsupported CSS variables", () => {
    // Canvas 2D silently rejects var(...) causing text to freeze at default 10px.
    // Our resolver strips var(...) cleanly when CSS variables cannot be resolved directly
    const cleaned = resolveCanvasFontFamily("var(--font-work-sans), 'Work Sans', sans-serif")
    expect(cleaned).not.toContain("var(")
    expect(cleaned).toContain("Work Sans")

    // Default AVAILABLE_FONTS must never contain raw var(...) expressions
    AVAILABLE_FONTS.forEach((font) => {
      expect(font.family).not.toContain("var(")
    })

    // buildCanvasFont must return a valid font shorthand string
    const fontStr = buildCanvasFont(48, "'Work Sans', sans-serif", "600")
    expect(fontStr).toBe("600 48px 'Work Sans', sans-serif")
    expect(fontStr).not.toContain("var(")
  })

  it("scales font size dynamically with larger relative percentages up to 35%", () => {
    // 1080x1920 mobile photo (minDim = 1080)
    const sizeSmall = calculateFontSizePx(1080, 1920, 4) // 4% -> 43px
    const sizeMedium = calculateFontSizePx(1080, 1920, 10) // 10% -> 108px
    const sizeLarge = calculateFontSizePx(1080, 1920, 24) // 24% -> 259px
    const sizeMax = calculateFontSizePx(1080, 1920, 35) // 35% -> 378px

    expect(sizeSmall).toBeLessThan(sizeMedium)
    expect(sizeMedium).toBeLessThan(sizeLarge)
    expect(sizeLarge).toBeLessThan(sizeMax)
    expect(sizeMax).toBe(378)
  })
})

