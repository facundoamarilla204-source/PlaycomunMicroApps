import crypto from "crypto"

export interface EphemeralScanPage {
  id: string
  dataUrl: string
  sizeBytes: number
  uploadedAt: string
}

export interface EphemeralScanSession {
  sessionToken: string
  uploadToken: string
  status: "pending" | "connected" | "receiving" | "completed" | "expired"
  pages: EphemeralScanPage[]
  createdAt: string
  expiresAt: string
}

export interface CreateScanSessionResult {
  sessionToken: string
  uploadToken: string
  qrUrl: string
  expiresAt: string
}

export interface ScanSessionStatusResult {
  status: "pending" | "connected" | "receiving" | "completed" | "expired" | "not_found"
  pagesCount: number
  pages?: EphemeralScanPage[]
  expiresAt?: string
}

// Global in-memory storage for scan sessions, surviving Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __ephemeralScanSessions: Map<string, EphemeralScanSession> | undefined
}

const sessions: Map<string, EphemeralScanSession> =
  globalThis.__ephemeralScanSessions || new Map<string, EphemeralScanSession>()

if (process.env.NODE_ENV !== "production") {
  globalThis.__ephemeralScanSessions = sessions
}

const SESSION_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL
const MAX_PAGES_PER_SESSION = 15
const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4 MB per page image

/**
 * Validates that an image data URL is a legitimate JPEG, PNG, or WebP.
 */
export function isValidImageDataUrl(dataUrl: string): boolean {
  if (typeof dataUrl !== "string") return false
  if (
    !dataUrl.startsWith("data:image/jpeg;base64,") &&
    !dataUrl.startsWith("data:image/png;base64,") &&
    !dataUrl.startsWith("data:image/webp;base64,")
  ) {
    return false
  }

  // Check approximate size
  if (dataUrl.length > MAX_IMAGE_BYTES * 1.4) return false

  try {
    const commaIdx = dataUrl.indexOf(",")
    if (commaIdx === -1) return false
    const base64Data = dataUrl.slice(commaIdx + 1)
    const buffer = Buffer.from(base64Data, "base64")
    if (buffer.length < 8) return false

    // JPEG: 0xFF 0xD8 0xFF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    // WebP: RIFF ... WEBP
    const isWebP =
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"

    return isJpeg || isPng || isWebP
  } catch {
    return false
  }
}

/**
 * Opportunistically purges expired sessions.
 */
function purgeExpiredSessions(): void {
  const now = Date.now()
  for (const [key, session] of sessions.entries()) {
    if (new Date(session.expiresAt).getTime() < now) {
      sessions.delete(key)
    }
  }
}

/**
 * Creates a new ephemeral scanning session with high-entropy cryptographic tokens.
 */
export async function createScanSession(baseUrl: string): Promise<CreateScanSessionResult> {
  purgeExpiredSessions()

  const sessionToken = crypto.randomBytes(24).toString("base64url")
  const uploadToken = crypto.randomBytes(24).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  const newSession: EphemeralScanSession = {
    sessionToken,
    uploadToken,
    status: "pending",
    pages: [],
    createdAt: new Date().toISOString(),
    expiresAt,
  }

  sessions.set(sessionToken, newSession)

  const cleanBase = baseUrl.replace(/\/+$/, "")
  const qrUrl = `${cleanBase}/escanear-movil/${uploadToken}`

  return {
    sessionToken,
    uploadToken,
    qrUrl,
    expiresAt,
  }
}

/**
 * Finds a session by its mobile upload token.
 */
function findSessionByUploadToken(uploadToken: string): EphemeralScanSession | null {
  purgeExpiredSessions()
  for (const session of sessions.values()) {
    if (session.uploadToken === uploadToken) {
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        sessions.delete(session.sessionToken)
        return null
      }
      return session
    }
  }
  return null
}

/**
 * Retrieves the status and pages of a session for the desktop viewer.
 */
export async function getScanSessionStatus(
  sessionToken: string
): Promise<ScanSessionStatusResult> {
  if (!sessionToken || typeof sessionToken !== "string" || sessionToken.length < 16) {
    return { status: "not_found", pagesCount: 0 }
  }

  purgeExpiredSessions()

  const session = sessions.get(sessionToken)
  if (!session) {
    return { status: "not_found", pagesCount: 0 }
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    sessions.delete(sessionToken)
    return { status: "expired", pagesCount: 0 }
  }

  return {
    status: session.status,
    pagesCount: session.pages.length,
    pages: session.pages,
    expiresAt: session.expiresAt,
  }
}

/**
 * Notifies from mobile that the phone has loaded the capture view.
 */
export async function pingMobileScanSession(
  uploadToken: string
): Promise<{ ok: boolean; status: string; pagesCount: number }> {
  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 16) {
    return { ok: false, status: "invalid_token", pagesCount: 0 }
  }

  const session = findSessionByUploadToken(uploadToken)
  if (!session) {
    return { ok: false, status: "not_found", pagesCount: 0 }
  }

  if (session.status === "pending") {
    session.status = "connected"
  }

  return {
    ok: true,
    status: session.status,
    pagesCount: session.pages.length,
  }
}

/**
 * Uploads a captured document page from the phone to the active session.
 */
export async function uploadScanPage(
  uploadToken: string,
  dataUrl: string
): Promise<{ success: boolean; message: string; pageIndex?: number; totalPages?: number }> {
  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 16) {
    return { success: false, message: "Token de subida inválido o ausente." }
  }

  const session = findSessionByUploadToken(uploadToken)
  if (!session) {
    return { success: false, message: "La sesión no existe o ya ha expirado." }
  }

  if (session.pages.length >= MAX_PAGES_PER_SESSION) {
    return {
      success: false,
      message: `Límite de ${MAX_PAGES_PER_SESSION} páginas por sesión alcanzado.`,
    }
  }

  if (!isValidImageDataUrl(dataUrl)) {
    return {
      success: false,
      message: "Formato de imagen no admitido o tamaño excesivo (se admite JPEG, PNG y WebP hasta 4MB).",
    }
  }

  // Prevent duplicate page uploads
  const commaIdx = dataUrl.indexOf(",")
  const base64Data = dataUrl.slice(commaIdx + 1)
  const sizeBytes = Math.round((base64Data.length * 3) / 4)

  const isDuplicate = session.pages.some(
    (p) => p.dataUrl.slice(0, 200) === dataUrl.slice(0, 200) && p.sizeBytes === sizeBytes
  )
  if (isDuplicate) {
    return {
      success: true,
      message: "Página ya recibida previamente.",
      pageIndex: session.pages.length - 1,
      totalPages: session.pages.length,
    }
  }

  const newPage: EphemeralScanPage = {
    id: `scan_page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dataUrl,
    sizeBytes,
    uploadedAt: new Date().toISOString(),
  }

  session.pages.push(newPage)
  session.status = "receiving"

  return {
    success: true,
    message: "Página transferida con éxito a la PC.",
    pageIndex: session.pages.length - 1,
    totalPages: session.pages.length,
  }
}

/**
 * Removes a page from the active session.
 */
export async function removeScanPage(
  uploadToken: string,
  pageId: string
): Promise<{ success: boolean; message: string; totalPages?: number }> {
  const session = findSessionByUploadToken(uploadToken)
  if (!session) {
    return { success: false, message: "Sesión no encontrada o expirada." }
  }

  session.pages = session.pages.filter((p) => p.id !== pageId)
  return {
    success: true,
    message: "Página eliminada de la sesión.",
    totalPages: session.pages.length,
  }
}

/**
 * Cleans up and deletes a session immediately (zero persistence).
 */
export async function cleanupScanSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return
  sessions.delete(sessionToken)
}
