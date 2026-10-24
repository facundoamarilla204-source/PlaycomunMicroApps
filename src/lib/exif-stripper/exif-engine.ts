/**
 * PlayComun Online — Exif Metadata Stripper & Inspector Engine
 * 
 * In-browser binary metadata parser and lossless segment stripper.
 * Inspects and strips EXIF, GPS, XMP, IPTC, and comments across JPEG, PNG, and WebP
 * without uploading images to any remote server.
 */

export interface ExifMetadataSummary {
  hasGps: boolean
  hasCameraInfo: boolean
  hasDateTime: boolean
  hasSoftware: boolean
  hasThumbnail: boolean
  hasComments: boolean
  hasIptcXmp: boolean
  orientation?: number
  cameraModel?: string
  dateTime?: string
  software?: string
  totalSegmentsFound: number
  rawSegments: string[]
}

export interface StripExifResult {
  blob: Blob
  originalSizeBytes: number
  newSizeBytes: number
  removedSegments: string[]
  hadGps: boolean
  hadExif: boolean
  isLossless: boolean
  isVerifiedClean: boolean
}

/**
 * Parses and inspects binary chunks of an image file to detect metadata segments.
 */
export async function inspectImageMetadata(file: File): Promise<ExifMetadataSummary> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const summary: ExifMetadataSummary = {
    hasGps: false,
    hasCameraInfo: false,
    hasDateTime: false,
    hasSoftware: false,
    hasThumbnail: false,
    hasComments: false,
    hasIptcXmp: false,
    totalSegmentsFound: 0,
    rawSegments: [],
  }

  // 1. JPEG Detection (0xFF 0xD8)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    inspectJpegMetadata(bytes, summary)
    return summary
  }

  // 2. PNG Detection (89 50 4E 47 0D 0A 1A 0A)
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    inspectPngMetadata(bytes, summary)
    return summary
  }

  // 3. WebP Detection (RIFF .... WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    inspectWebpMetadata(bytes, summary)
    return summary
  }

  return summary
}

/**
 * Inspects JPEG markers for APP1 (EXIF / XMP), APP2, APP13 (Photoshop/IPTC), and COM.
 */
function inspectJpegMetadata(bytes: Uint8Array, summary: ExifMetadataSummary): void {
  let offset = 2 // Skip SOI 0xFFD8
  const length = bytes.length

  while (offset < length - 1) {
    if (bytes[offset] !== 0xff) {
      offset++
      continue
    }

    const marker = bytes[offset + 1]

    // Stop at Start of Scan (0xDA) or End of Image (0xD9)
    if (marker === 0xda || marker === 0xd9) break

    // Variable-length markers have a 2-byte length
    if (offset + 4 > length) break
    const segLength = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (segLength < 2) break

    // APP1: 0xE1 (EXIF, XMP)
    if (marker === 0xe1) {
      summary.totalSegmentsFound++
      // Check for Exif header: 'Exif\0\0' (0x45 0x78 0x69 0x66 0x00 0x00)
      if (
        bytes[offset + 4] === 0x45 &&
        bytes[offset + 5] === 0x78 &&
        bytes[offset + 6] === 0x69 &&
        bytes[offset + 7] === 0x66
      ) {
        summary.rawSegments.push("EXIF (APP1)")
        parseTiffHeader(bytes, offset + 10, segLength - 8, summary)
      } else {
        // Could be XMP http://ns.adobe.com/xap/1.0/
        summary.rawSegments.push("XMP (APP1)")
        summary.hasIptcXmp = true
      }
    }
    // APP13: 0xED (IPTC / Photoshop IRB)
    else if (marker === 0xed) {
      summary.totalSegmentsFound++
      summary.rawSegments.push("IPTC / Photoshop (APP13)")
      summary.hasIptcXmp = true
    }
    // COM: 0xFE (Comment)
    else if (marker === 0xfe) {
      summary.totalSegmentsFound++
      summary.rawSegments.push("Comentarios (COM)")
      summary.hasComments = true
    }
    // APP2: 0xE2 (FlashPix / MPF thumbnail) - note: ICC profiles are kept unless specifically stripped
    else if (marker === 0xe2) {
      // Check if MPF (Multi-Picture Format / thumbnail)
      if (
        bytes[offset + 4] === 0x4d &&
        bytes[offset + 5] === 0x50 &&
        bytes[offset + 6] === 0x46
      ) {
        summary.totalSegmentsFound++
        summary.hasThumbnail = true
        summary.rawSegments.push("Miniatura incrustada (MPF)")
      }
    }

    offset += 2 + segLength
  }
}

/**
 * Reads TIFF header and IFD tags inside EXIF segment to detect GPS, camera, datetime, software, and orientation.
 */
function parseTiffHeader(
  bytes: Uint8Array,
  tiffOffset: number,
  maxLen: number,
  summary: ExifMetadataSummary
): void {
  if (tiffOffset + 8 > bytes.length || maxLen < 8) return

  // Endianness
  const isLittleEndian = bytes[tiffOffset] === 0x49 && bytes[tiffOffset + 1] === 0x49 // "II"
  const isBigEndian = bytes[tiffOffset] === 0x4d && bytes[tiffOffset + 1] === 0x4d // "MM"

  if (!isLittleEndian && !isBigEndian) return

  const readU16 = (o: number) => {
    if (o + 2 > bytes.length) return 0
    return isLittleEndian
      ? bytes[o] | (bytes[o + 1] << 8)
      : (bytes[o] << 8) | bytes[o + 1]
  }

  const readU32 = (o: number) => {
    if (o + 4 > bytes.length) return 0
    return isLittleEndian
      ? (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0
      : ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0
  }

  const ifd0Offset = tiffOffset + readU32(tiffOffset + 4)
  if (ifd0Offset + 2 > bytes.length) return

  const numEntries = readU16(ifd0Offset)
  let cur = ifd0Offset + 2

  let subIfdOffset = 0
  let gpsOffset = 0

  for (let i = 0; i < numEntries; i++) {
    if (cur + 12 > bytes.length) break
    const tag = readU16(cur)

    // Tag 0x0112 = Orientation
    if (tag === 0x0112) {
      summary.orientation = readU16(cur + 8)
    }
    // Tag 0x0110 = Model, 0x010F = Make
    else if (tag === 0x0110 || tag === 0x010f) {
      summary.hasCameraInfo = true
    }
    // Tag 0x0132 = DateTime
    else if (tag === 0x0132) {
      summary.hasDateTime = true
    }
    // Tag 0x0131 = Software
    else if (tag === 0x0131) {
      summary.hasSoftware = true
    }
    // Tag 0x8769 = Exif SubIFD
    else if (tag === 0x8769) {
      subIfdOffset = tiffOffset + readU32(cur + 8)
    }
    // Tag 0x8825 = GPS IFD
    else if (tag === 0x8825) {
      gpsOffset = tiffOffset + readU32(cur + 8)
    }

    cur += 12
  }

  if (gpsOffset > 0 && gpsOffset < bytes.length) {
    summary.hasGps = true
  }

  if (subIfdOffset > 0 && subIfdOffset + 2 < bytes.length) {
    const numSub = readU16(subIfdOffset)
    let sCur = subIfdOffset + 2
    for (let j = 0; j < numSub; j++) {
      if (sCur + 12 > bytes.length) break
      const sTag = readU16(sCur)
      if (sTag === 0x9003 || sTag === 0x9004) {
        summary.hasDateTime = true
      }
      sCur += 12
    }
  }
}

/**
 * Inspects PNG chunks: eXIf, tEXt, zTXt, iTXt.
 */
function inspectPngMetadata(bytes: Uint8Array, summary: ExifMetadataSummary): void {
  let offset = 8 // Skip PNG signature
  const len = bytes.length

  while (offset + 8 <= len) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    )

    if (chunkType === "IEND") break

    if (chunkType === "eXIf") {
      summary.totalSegmentsFound++
      summary.rawSegments.push("PNG eXIf")
      summary.hasCameraInfo = true
      // Parse embedded TIFF in PNG eXIf
      parseTiffHeader(bytes, offset + 8, chunkLen, summary)
    } else if (chunkType === "tEXt" || chunkType === "zTXt" || chunkType === "iTXt") {
      summary.totalSegmentsFound++
      summary.rawSegments.push(`PNG ${chunkType}`)
      summary.hasComments = true
    }

    offset += 12 + chunkLen // 4 len + 4 type + data + 4 crc
  }
}

/**
 * Inspects WebP RIFF chunks for EXIF and XMP.
 */
function inspectWebpMetadata(bytes: Uint8Array, summary: ExifMetadataSummary): void {
  let offset = 12 // Skip "RIFF" + size + "WEBP"
  const len = bytes.length

  while (offset + 8 <= len) {
    const fourCC = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    )
    const chunkSize =
      bytes[offset + 4] |
      (bytes[offset + 5] << 8) |
      (bytes[offset + 6] << 16) |
      (bytes[offset + 7] << 24)

    if (fourCC === "EXIF") {
      summary.totalSegmentsFound++
      summary.rawSegments.push("WebP EXIF")
      parseTiffHeader(bytes, offset + 8, chunkSize, summary)
    } else if (fourCC === "XMP ") {
      summary.totalSegmentsFound++
      summary.rawSegments.push("WebP XMP")
      summary.hasIptcXmp = true
    }

    // Chunks are padded to even number of bytes
    const paddedSize = chunkSize + (chunkSize % 2)
    offset += 8 + paddedSize
  }
}

/**
 * Losslessly strips metadata segments directly from a JPEG file without recompressing pixels.
 * If image has an orientation tag other than 1, we return null to trigger orientation-normalizing canvas path.
 */
export function stripJpegLossless(
  bytes: Uint8Array,
  orientation?: number
): Uint8Array | null {
  // If orientation is rotated (2..8), lossless removal of EXIF would rotate the image in viewer.
  // In that case, canvas re-encoding is strictly necessary to bake orientation into pixels.
  if (orientation && orientation > 1) {
    return null
  }

  const length = bytes.length
  const outChunks: Uint8Array[] = []
  let offset = 0

  // Verify SOI
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null
  }

  // Include SOI
  outChunks.push(bytes.subarray(0, 2))
  offset = 2

  const removedSegments: string[] = []

  while (offset < length - 1) {
    if (bytes[offset] !== 0xff) {
      offset++
      continue
    }

    const marker = bytes[offset + 1]

    // Start of Scan (SOS 0xDA): From here to EOI is compressed image data. Keep all!
    if (marker === 0xda) {
      outChunks.push(bytes.subarray(offset))
      break
    }

    // End of Image (0xD9)
    if (marker === 0xd9) {
      outChunks.push(bytes.subarray(offset, offset + 2))
      break
    }

    // Standalone markers without length
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      outChunks.push(bytes.subarray(offset, offset + 2))
      offset += 2
      continue
    }

    if (offset + 4 > length) {
      outChunks.push(bytes.subarray(offset))
      break
    }

    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3]
    const nextOffset = offset + 2 + segLen

    // Check if this segment should be stripped:
    // APP1 (0xE1 - EXIF, XMP)
    // APP13 (0xED - IPTC / Photoshop)
    // COM (0xFE - Comment)
    // APP2 MPF thumbnail (only if MPF, preserving ICC)
    let shouldStrip = false

    if (marker === 0xe1) {
      shouldStrip = true
      removedSegments.push("APP1")
    } else if (marker === 0xed) {
      shouldStrip = true
      removedSegments.push("APP13")
    } else if (marker === 0xfe) {
      shouldStrip = true
      removedSegments.push("COM")
    } else if (marker === 0xe2) {
      // Check if MPF (thumbnail), keep if ICC
      if (
        bytes[offset + 4] === 0x4d &&
        bytes[offset + 5] === 0x50 &&
        bytes[offset + 6] === 0x46
      ) {
        shouldStrip = true
        removedSegments.push("APP2-MPF")
      }
    }

    if (!shouldStrip) {
      outChunks.push(bytes.subarray(offset, Math.min(nextOffset, length)))
    }

    offset = nextOffset
  }

  // Combine chunks
  let totalLen = 0
  for (const c of outChunks) totalLen += c.length
  const result = new Uint8Array(totalLen)
  let pos = 0
  for (const c of outChunks) {
    result.set(c, pos)
    pos += c.length
  }

  return result
}

/**
 * Losslessly strips metadata chunks from a PNG file without recompressing image data (IDAT).
 * Removes eXIf, tEXt, zTXt, iTXt while preserving IHDR, PLTE, tRNS, IDAT, IEND, and cHRM/gAMA.
 */
export function stripPngLossless(bytes: Uint8Array): Uint8Array | null {
  if (
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null
  }

  const outChunks: Uint8Array[] = []
  outChunks.push(bytes.subarray(0, 8)) // PNG Signature

  let offset = 8
  const len = bytes.length

  const chunksToStrip = new Set(["eXIf", "tEXt", "zTXt", "iTXt"])

  while (offset + 8 <= len) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    )

    const nextOffset = offset + 12 + chunkLen

    if (!chunksToStrip.has(chunkType)) {
      outChunks.push(bytes.subarray(offset, Math.min(nextOffset, len)))
    }

    if (chunkType === "IEND") break
    offset = nextOffset
  }

  let totalLen = 0
  for (const c of outChunks) totalLen += c.length
  const result = new Uint8Array(totalLen)
  let pos = 0
  for (const c of outChunks) {
    result.set(c, pos)
    pos += c.length
  }

  return result
}

/**
 * Losslessly strips EXIF and XMP chunks from a WebP container.
 */
export function stripWebpLossless(bytes: Uint8Array): Uint8Array | null {
  if (
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 ||
    bytes[9] !== 0x45 ||
    bytes[10] !== 0x42 ||
    bytes[11] !== 0x50
  ) {
    return null
  }

  const outChunks: Uint8Array[] = []
  let offset = 12
  const len = bytes.length

  const chunksToStrip = new Set(["EXIF", "XMP "])

  while (offset + 8 <= len) {
    const fourCC = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    )
    const chunkSize =
      bytes[offset + 4] |
      (bytes[offset + 5] << 8) |
      (bytes[offset + 6] << 16) |
      (bytes[offset + 7] << 24)

    const paddedSize = chunkSize + (chunkSize % 2)
    const nextOffset = offset + 8 + paddedSize

    if (!chunksToStrip.has(fourCC)) {
      outChunks.push(bytes.subarray(offset, Math.min(nextOffset, len)))
    }

    offset = nextOffset
  }

  // Calculate new RIFF size
  let payloadLen = 4 // "WEBP"
  for (const c of outChunks) payloadLen += c.length

  const header = new Uint8Array(12)
  header.set(bytes.subarray(0, 4), 0) // "RIFF"
  const view = new DataView(header.buffer)
  view.setUint32(4, payloadLen, true) // RIFF size
  header.set(bytes.subarray(8, 12), 8) // "WEBP"

  const result = new Uint8Array(12 + payloadLen - 4)
  result.set(header, 0)
  let pos = 12
  for (const c of outChunks) {
    result.set(c, pos)
    pos += c.length
  }

  return result
}

/**
 * Re-encodes an image using HTML5 Canvas to strictly bake in orientation and discard all metadata.
 * Used as high-reliability fallback when lossless binary stripping is inapplicable.
 */
export async function stripViaCanvas(
  file: File,
  targetFormat: "image/jpeg" | "image/png" | "image/webp"
): Promise<Blob> {
  const tempUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("No se pudo cargar la imagen en el lienzo"))
      el.src = tempUrl
    })

    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("No se pudo inicializar el contexto gráfico 2D")
    }

    // Browsers automatically apply EXIF orientation to <img> elements
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, targetFormat, 0.95)
    })

    if (!blob) {
      throw new Error("Error al exportar imagen sin metadatos desde el lienzo.")
    }

    return blob
  } finally {
    URL.revokeObjectURL(tempUrl)
  }
}

/**
 * Main entry point: Processes a file, detects metadata, executes lossless binary stripping if possible,
 * or canvas bake-in if rotated, and verifies that the output has had its metadata cleared.
 */
export async function stripImageMetadata(file: File): Promise<StripExifResult> {
  const metaBefore = await inspectImageMetadata(file)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  let strippedBlob: Blob | null = null
  let isLossless = false

  // 1. Try lossless JPEG strip
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const losslessBytes = stripJpegLossless(bytes, metaBefore.orientation)
    if (losslessBytes) {
      strippedBlob = new Blob([losslessBytes.buffer as ArrayBuffer], { type: "image/jpeg" })
      isLossless = true
    } else {
      strippedBlob = await stripViaCanvas(file, "image/jpeg")
      isLossless = false
    }
  }
  // 2. Try lossless PNG strip
  else if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const losslessBytes = stripPngLossless(bytes)
    if (losslessBytes) {
      strippedBlob = new Blob([losslessBytes.buffer as ArrayBuffer], { type: "image/png" })
      isLossless = true
    } else {
      strippedBlob = await stripViaCanvas(file, "image/png")
      isLossless = false
    }
  }
  // 3. Try lossless WebP strip
  else if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    const losslessBytes = stripWebpLossless(bytes)
    if (losslessBytes) {
      strippedBlob = new Blob([losslessBytes.buffer as ArrayBuffer], { type: "image/webp" })
      isLossless = true
    } else {
      strippedBlob = await stripViaCanvas(file, "image/webp")
      isLossless = false
    }
  }
  // 4. Fallback for other supported formats
  else {
    const mime = file.type || "image/jpeg"
    const target =
      mime.includes("png") ? "image/png" : mime.includes("webp") ? "image/webp" : "image/jpeg"
    strippedBlob = await stripViaCanvas(file, target)
    isLossless = false
  }

  // 5. Post-validation: Verify with independent inspection that output has no GPS or EXIF tags
  const verificationFile = new File([strippedBlob], file.name, { type: strippedBlob.type })
  const metaAfter = await inspectImageMetadata(verificationFile)

  return {
    blob: strippedBlob,
    originalSizeBytes: file.size,
    newSizeBytes: strippedBlob.size,
    removedSegments: metaBefore.rawSegments,
    hadGps: metaBefore.hasGps,
    hadExif: metaBefore.totalSegmentsFound > 0,
    isLossless,
    isVerifiedClean: metaAfter.totalSegmentsFound === 0,
  }
}
