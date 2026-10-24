import { describe, it, expect } from "vitest"
import {
  encodeIco,
  generateWebManifest,
  generateHtmlSnippet,
  FAVICON_TARGET_SIZES,
  DEFAULT_FAVICON_CONFIG,
} from "../favicon-engine"

describe("Favicon Engine & ICO Encoding", () => {
  it("defines default configurations correctly", () => {
    expect(DEFAULT_FAVICON_CONFIG.fitMode).toBe("contain")
    expect(DEFAULT_FAVICON_CONFIG.scale).toBe(100)
    expect(DEFAULT_FAVICON_CONFIG.backgroundType).toBe("transparent")
  })

  it("includes all standard target sizes for modern and legacy platforms", () => {
    const sizes = FAVICON_TARGET_SIZES.map((s) => s.size)
    expect(sizes).toContain(16)
    expect(sizes).toContain(32)
    expect(sizes).toContain(48)
    expect(sizes).toContain(180)
    expect(sizes).toContain(192)
    expect(sizes).toContain(512)
  })

  it("encodes valid ICO binary format with header, directory entries, and PNG payloads", async () => {
    // Create mock PNG-like buffers
    const dummyPng16 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]).buffer
    const dummyPng32 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 5, 6, 7, 8, 9]).buffer

    const icoBlob = encodeIco([
      { width: 16, height: 16, buffer: dummyPng16 },
      { width: 32, height: 32, buffer: dummyPng32 },
    ])

    expect(icoBlob.type).toBe("image/x-icon")
    const arrayBuffer = await icoBlob.arrayBuffer()
    const view = new DataView(arrayBuffer)

    // Header check
    expect(view.getUint16(0, true)).toBe(0) // Reserved = 0
    expect(view.getUint16(2, true)).toBe(1) // Type = 1 (ICO)
    expect(view.getUint16(4, true)).toBe(2) // 2 images

    // Entry 1 (16x16)
    expect(view.getUint8(6)).toBe(16) // width
    expect(view.getUint8(7)).toBe(16) // height
    expect(view.getUint16(10, true)).toBe(1) // planes = 1
    expect(view.getUint16(12, true)).toBe(32) // bitCount = 32
    expect(view.getUint32(14, true)).toBe(dummyPng16.byteLength) // bytesInRes
    const offset1 = view.getUint32(18, true)
    expect(offset1).toBe(6 + 16 * 2) // Header (6) + 2 entries (32) = 38

    // Entry 2 (32x32)
    const dir2 = 6 + 16
    expect(view.getUint8(dir2 + 0)).toBe(32) // width
    expect(view.getUint8(dir2 + 1)).toBe(32) // height
    expect(view.getUint32(dir2 + 8, true)).toBe(dummyPng32.byteLength)
    const offset2 = view.getUint32(dir2 + 12, true)
    expect(offset2).toBe(offset1 + dummyPng16.byteLength)

    // Data verification
    const fileBytes = new Uint8Array(arrayBuffer)
    expect(fileBytes.slice(offset1, offset1 + 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))
    expect(fileBytes.slice(offset2, offset2 + 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))
  })

  it("generates a valid web manifest referencing 192 and 512 png icons", () => {
    const jsonStr = generateWebManifest("Mi Tienda", "Tienda")
    const manifest = JSON.parse(jsonStr)

    expect(manifest.name).toBe("Mi Tienda")
    expect(manifest.short_name).toBe("Tienda")
    expect(manifest.icons).toHaveLength(2)
    expect(manifest.icons[0].sizes).toBe("192x192")
    expect(manifest.icons[0].src).toBe("/android-chrome-192x192.png")
    expect(manifest.icons[1].sizes).toBe("512x512")
    expect(manifest.icons[1].src).toBe("/android-chrome-512x512.png")
  })

  it("generates portable standard HTML markup with all required link tags", () => {
    const html = generateHtmlSnippet("Acme Corp")
    expect(html).toContain('href="/favicon.ico"')
    expect(html).toContain('sizes="16x16" href="/favicon-16x16.png"')
    expect(html).toContain('sizes="32x32" href="/favicon-32x32.png"')
    expect(html).toContain('sizes="48x48" href="/favicon-48x48.png"')
    expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"')
    expect(html).toContain('rel="manifest" href="/site.webmanifest"')
    expect(html).toContain('content="Acme Corp"')
  })
})
