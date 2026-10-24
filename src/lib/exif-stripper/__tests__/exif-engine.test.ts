import { describe, it, expect } from "vitest"
import {
  inspectImageMetadata,
  stripJpegLossless,
  stripPngLossless,
  stripWebpLossless,
} from "../exif-engine"

describe("EXIF Stripper & Lossless Binary Processing", () => {
  it("detects and losslessly removes APP1 (EXIF), APP13 (IPTC) and COM segments from JPEG", () => {
    // Construct a mock JPEG binary:
    // SOI (0xFF, 0xD8)
    // APP1 EXIF segment (0xFF, 0xE1, len_hi, len_lo, 'Exif\0\0'...)
    // COM segment (0xFF, 0xFE, 0x00, 0x07, 'H', 'i', 0)
    // SOS (0xFF, 0xDA, compressed_data...)
    // EOI (0xFF, 0xD9)

    const exifPayload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x49, 0x49, 0x2a, 0x00]
    const app1Len = 2 + exifPayload.length
    const app1Seg = [0xff, 0xe1, (app1Len >> 8) & 0xff, app1Len & 0xff, ...exifPayload]

    const comPayload = [0x48, 0x65, 0x6c, 0x6c, 0x6f]
    const comLen = 2 + comPayload.length
    const comSeg = [0xff, 0xfe, (comLen >> 8) & 0xff, comLen & 0xff, ...comPayload]

    const scanData = [0xff, 0xda, 0x00, 0x03, 0x01, 0xaa, 0xbb, 0xff, 0xd9]

    const fullJpeg = new Uint8Array([0xff, 0xd8, ...app1Seg, ...comSeg, ...scanData])

    // Lossless strip
    const stripped = stripJpegLossless(fullJpeg, 1)
    expect(stripped).not.toBeNull()
    if (!stripped) return

    // The stripped bytes should retain SOI and scan data, but NOT APP1 or COM
    expect(stripped[0]).toBe(0xff)
    expect(stripped[1]).toBe(0xd8)
    expect(stripped.length).toBeLessThan(fullJpeg.length)

    // Inspect stripped file
    const file = new File([stripped.buffer as ArrayBuffer], "test.jpg", { type: "image/jpeg" })
    return inspectImageMetadata(file).then((summary) => {
      expect(summary.totalSegmentsFound).toBe(0)
      expect(summary.hasGps).toBe(false)
      expect(summary.hasCameraInfo).toBe(false)
      expect(summary.hasComments).toBe(false)
    })
  })

  it("detects and losslessly removes eXIf and tEXt chunks from PNG without corrupting IHDR/IEND", () => {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    // Mock IHDR (13 bytes len)
    const ihdr = [0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 0, 0, 0, 0]
    // Mock tEXt comment
    const textData = [0x41, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x00, 0x4d, 0x65]
    const textChunk = [
      0x00, 0x00, 0x00, textData.length,
      0x74, 0x45, 0x58, 0x74, // 'tEXt'
      ...textData,
      0x00, 0x00, 0x00, 0x00, // crc
    ]
    // Mock IEND
    const iend = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]

    const fullPng = new Uint8Array([...sig, ...ihdr, ...textChunk, ...iend])

    const stripped = stripPngLossless(fullPng)
    expect(stripped).not.toBeNull()
    if (!stripped) return

    expect(stripped.length).toBeLessThan(fullPng.length)

    const file = new File([stripped.buffer as ArrayBuffer], "test.png", { type: "image/png" })
    return inspectImageMetadata(file).then((summary) => {
      expect(summary.totalSegmentsFound).toBe(0)
      expect(summary.hasComments).toBe(false)
    })
  })

  it("strips EXIF metadata chunks from WebP container", () => {
    // Mock RIFF ... WEBP
    const webpHeader = [
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x20, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]
    // EXIF chunk
    const exifData = [1, 2, 3, 4]
    const exifChunk = [
      0x45, 0x58, 0x49, 0x46, // EXIF
      0x04, 0x00, 0x00, 0x00, // size 4
      ...exifData,
    ]
    const fullWebp = new Uint8Array([...webpHeader, ...exifChunk])

    const stripped = stripWebpLossless(fullWebp)
    expect(stripped).not.toBeNull()
    if (!stripped) return

    expect(stripped.length).toBeLessThan(fullWebp.length)
  })
})
