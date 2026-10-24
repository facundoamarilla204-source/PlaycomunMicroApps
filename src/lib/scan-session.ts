import crypto from "crypto"
import os from "os"
import { createAdminClient } from "@/utils/supabase/admin"
import { siteConfig } from "@/config/site"

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
  lanQrUrl?: string | null
  onlineQrUrl?: string
  expiresAt: string
}

export interface ScanSessionStatusResult {
  status: "pending" | "connected" | "receiving" | "completed" | "expired" | "not_found"
  pagesCount: number
  pages?: EphemeralScanPage[]
  expiresAt?: string
}

// Global in-memory storage fallback
declare global {
  // eslint-disable-next-line no-var
  var __ephemeralScanSessions: Map<string, EphemeralScanSession> | undefined
}

const memorySessions: Map<string, EphemeralScanSession> =
  globalThis.__ephemeralScanSessions || new Map<string, EphemeralScanSession>()

if (process.env.NODE_ENV !== "production") {
  globalThis.__ephemeralScanSessions = memorySessions
}

const SESSION_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL
const MAX_PAGES_PER_SESSION = 15
const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4 MB per page image

/**
 * Returns the local network IPv4 address (e.g. 192.168.0.x)
 * so mobile devices on the same Wi-Fi can reach the local development server.
 */
export function getLocalNetworkIp(): string | null {
  try {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address
        }
      }
    }
  } catch {}
  return null
}

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
 * Creates a new ephemeral scanning session with cryptographic tokens.
 * Persists in Supabase `signature_sessions` table (with in-memory fallback)
 * to ensure seamless communication across devices, networks, and worker processes.
 */
export async function createScanSession(requestOrigin: string): Promise<CreateScanSessionResult> {
  const sessionToken = crypto.randomBytes(24).toString("base64url")
  const uploadToken = crypto.randomBytes(24).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  // 1. Try Supabase insertion
  let savedInSupabase = false
  try {
    const supabase = createAdminClient()
    // Opportunistic cleanup of expired records
    Promise.resolve(
      supabase
        .from("signature_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString())
    ).catch(() => {})

    const { error } = await supabase.from("signature_sessions").insert({
      session_token: sessionToken,
      upload_token: uploadToken,
      status: "pending",
      signature_data: JSON.stringify([]), // holds pages array
      expires_at: expiresAt,
    })

    if (!error) {
      savedInSupabase = true
    }
  } catch {}

  // 2. Also keep in-memory fallback
  memorySessions.set(sessionToken, {
    sessionToken,
    uploadToken,
    status: "pending",
    pages: [],
    createdAt: new Date().toISOString(),
    expiresAt,
  })

  // Determine intelligent QR URLs
  const cleanReqOrigin = (requestOrigin || "").replace(/\/+$/, "")
  const isLocalhost =
    cleanReqOrigin.includes("localhost") || cleanReqOrigin.includes("127.0.0.1")

  const lanIp = getLocalNetworkIp()
  let lanQrUrl: string | null = null

  if (lanIp) {
    const portMatch = cleanReqOrigin.match(/:(\d+)$/)
    const port = portMatch ? `:${portMatch[1]}` : ":3000"
    lanQrUrl = `http://${lanIp}${port}/escanear-movil/${uploadToken}`
  }

  const onlineBase = (siteConfig.url || "https://www.playcomun.online").replace(/\/+$/, "")
  const onlineQrUrl = `${onlineBase}/escanear-movil/${uploadToken}`

  // If in localhost and LAN IP is found, default qrUrl to LAN so phone on Wi-Fi works immediately
  const qrUrl = isLocalhost && lanQrUrl ? lanQrUrl : `${cleanReqOrigin}/escanear-movil/${uploadToken}`

  return {
    sessionToken,
    uploadToken,
    qrUrl,
    lanQrUrl,
    onlineQrUrl,
    expiresAt,
  }
}

/**
 * Retrieves the status and received pages of an active session.
 */
export async function getScanSessionStatus(
  sessionToken: string
): Promise<ScanSessionStatusResult> {
  if (!sessionToken || typeof sessionToken !== "string" || sessionToken.length < 16) {
    return { status: "not_found", pagesCount: 0 }
  }

  // 1. Try Supabase query
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("signature_sessions")
      .select("status, signature_data, expires_at")
      .eq("session_token", sessionToken)
      .single()

    if (!error && data) {
      if (new Date(data.expires_at).getTime() < Date.now()) {
        Promise.resolve(supabase.from("signature_sessions").delete().eq("session_token", sessionToken)).catch(() => {})
        return { status: "expired", pagesCount: 0 }
      }

      let pages: EphemeralScanPage[] = []
      if (data.signature_data) {
        try {
          pages = JSON.parse(data.signature_data)
        } catch {}
      }

      return {
        status: data.status as any,
        pagesCount: pages.length,
        pages,
        expiresAt: data.expires_at,
      }
    }
  } catch {}

  // 2. Fallback to in-memory store
  const memSession = memorySessions.get(sessionToken)
  if (!memSession) {
    return { status: "not_found", pagesCount: 0 }
  }

  if (new Date(memSession.expiresAt).getTime() < Date.now()) {
    memorySessions.delete(sessionToken)
    return { status: "expired", pagesCount: 0 }
  }

  return {
    status: memSession.status,
    pagesCount: memSession.pages.length,
    pages: memSession.pages,
    expiresAt: memSession.expiresAt,
  }
}

/**
 * Mobile device pings upon scanning the QR code to confirm live connection.
 */
export async function pingMobileScanSession(
  uploadToken: string
): Promise<{ ok: boolean; status: string; pagesCount: number }> {
  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 16) {
    return { ok: false, status: "invalid_token", pagesCount: 0 }
  }

  // 1. Try Supabase
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("signature_sessions")
      .select("status, signature_data, expires_at")
      .eq("upload_token", uploadToken)
      .single()

    if (!error && data) {
      if (new Date(data.expires_at).getTime() < Date.now()) {
        return { ok: false, status: "expired", pagesCount: 0 }
      }

      let pages: EphemeralScanPage[] = []
      if (data.signature_data) {
        try {
          pages = JSON.parse(data.signature_data)
        } catch {}
      }

      if (data.status === "pending") {
        await supabase
          .from("signature_sessions")
          .update({ status: "connected" })
          .eq("upload_token", uploadToken)
      }

      return {
        ok: true,
        status: data.status === "pending" ? "connected" : data.status,
        pagesCount: pages.length,
      }
    }
  } catch {}

  // 2. Fallback to in-memory store
  for (const session of memorySessions.values()) {
    if (session.uploadToken === uploadToken) {
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        memorySessions.delete(session.sessionToken)
        return { ok: false, status: "expired", pagesCount: 0 }
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
  }

  return { ok: false, status: "not_found", pagesCount: 0 }
}

/**
 * Uploads a document page captured from the smartphone.
 */
export async function uploadScanPage(
  uploadToken: string,
  dataUrl: string
): Promise<{ success: boolean; message: string; pageIndex?: number; totalPages?: number }> {
  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 16) {
    return { success: false, message: "Token de subida inválido o ausente." }
  }

  if (!isValidImageDataUrl(dataUrl)) {
    return {
      success: false,
      message: "Formato no válido (se admite JPEG, PNG y WebP de hasta 4MB).",
    }
  }

  const commaIdx = dataUrl.indexOf(",")
  const base64Data = dataUrl.slice(commaIdx + 1)
  const sizeBytes = Math.round((base64Data.length * 3) / 4)

  const newPage: EphemeralScanPage = {
    id: `scan_page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dataUrl,
    sizeBytes,
    uploadedAt: new Date().toISOString(),
  }

  // 1. Try Supabase
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("signature_sessions")
      .select("status, signature_data, expires_at")
      .eq("upload_token", uploadToken)
      .single()

    if (!error && data) {
      if (new Date(data.expires_at).getTime() < Date.now()) {
        return { success: false, message: "La sesión ha expirado." }
      }

      let existingPages: EphemeralScanPage[] = []
      if (data.signature_data) {
        try {
          existingPages = JSON.parse(data.signature_data)
        } catch {}
      }

      if (existingPages.length >= MAX_PAGES_PER_SESSION) {
        return {
          success: false,
          message: `Límite de ${MAX_PAGES_PER_SESSION} páginas alcanzado.`,
        }
      }

      // Check duplicates
      const isDuplicate = existingPages.some(
        (p) => p.dataUrl.slice(0, 200) === dataUrl.slice(0, 200) && p.sizeBytes === sizeBytes
      )
      if (isDuplicate) {
        return {
          success: true,
          message: "Página ya recibida previamente.",
          totalPages: existingPages.length,
        }
      }

      const updatedPages = [...existingPages, newPage]
      await supabase
        .from("signature_sessions")
        .update({
          status: "receiving",
          signature_data: JSON.stringify(updatedPages),
        })
        .eq("upload_token", uploadToken)

      return {
        success: true,
        message: "Página transferida con éxito a la PC.",
        pageIndex: updatedPages.length - 1,
        totalPages: updatedPages.length,
      }
    }
  } catch {}

  // 2. Fallback to in-memory store
  for (const session of memorySessions.values()) {
    if (session.uploadToken === uploadToken) {
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        memorySessions.delete(session.sessionToken)
        return { success: false, message: "La sesión ha expirado." }
      }

      if (session.pages.length >= MAX_PAGES_PER_SESSION) {
        return {
          success: false,
          message: `Límite de ${MAX_PAGES_PER_SESSION} páginas alcanzado.`,
        }
      }

      const isDuplicate = session.pages.some(
        (p) => p.dataUrl.slice(0, 200) === dataUrl.slice(0, 200) && p.sizeBytes === sizeBytes
      )
      if (isDuplicate) {
        return {
          success: true,
          message: "Página ya recibida previamente.",
          totalPages: session.pages.length,
        }
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
  }

  return { success: false, message: "La sesión no existe o ya ha expirado." }
}

/**
 * Removes a page from the active session.
 */
export async function removeScanPage(
  uploadToken: string,
  pageId: string
): Promise<{ success: boolean; message: string; totalPages?: number }> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("signature_sessions")
      .select("signature_data")
      .eq("upload_token", uploadToken)
      .single()

    if (data && data.signature_data) {
      let pages: EphemeralScanPage[] = JSON.parse(data.signature_data)
      pages = pages.filter((p) => p.id !== pageId)
      await supabase
        .from("signature_sessions")
        .update({ signature_data: JSON.stringify(pages) })
        .eq("upload_token", uploadToken)

      return { success: true, message: "Página eliminada.", totalPages: pages.length }
    }
  } catch {}

  for (const session of memorySessions.values()) {
    if (session.uploadToken === uploadToken) {
      session.pages = session.pages.filter((p) => p.id !== pageId)
      return { success: true, message: "Página eliminada.", totalPages: session.pages.length }
    }
  }

  return { success: false, message: "Sesión no encontrada." }
}

/**
 * Immediately purges session from Supabase and memory (zero persistence).
 */
export async function cleanupScanSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return

  try {
    const supabase = createAdminClient()
    await supabase.from("signature_sessions").delete().eq("session_token", sessionToken)
  } catch {}

  memorySessions.delete(sessionToken)
}
