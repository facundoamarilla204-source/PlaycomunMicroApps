import crypto from "crypto"
import { createAdminClient } from "@/utils/supabase/admin"

export interface CreateSessionResult {
  sessionToken: string
  uploadToken: string
  qrUrl: string
  expiresAt: string
}

export interface SessionStatusResult {
  status: "pending" | "connected" | "completed" | "expired" | "cancelled" | "not_found"
  signatureData?: string | null
  initialsData?: string | null
  expiresAt?: string
}

const MAX_PAYLOAD_BYTES = 500 * 1024 // 500 KB

function isValidPngDataUrl(dataUrl: string): boolean {
  if (typeof dataUrl !== "string") return false
  if (!dataUrl.startsWith("data:image/png;base64,")) return false
  if (dataUrl.length > MAX_PAYLOAD_BYTES * 1.4) return false

  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (buffer.length < 8) return false
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    )
  } catch {
    return false
  }
}

/**
 * Creates an ephemeral signing session for mobile QR transfer.
 */
export async function createSignatureSession(baseUrl: string): Promise<CreateSessionResult> {
  const supabase = createAdminClient()

  // Clean expired sessions opportunistically
  try {
    await supabase
      .from("signature_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString())
  } catch {}

  const sessionToken = crypto.randomBytes(24).toString("base64url")
  const uploadToken = crypto.randomBytes(24).toString("base64url")
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes TTL

  const { error } = await supabase.from("signature_sessions").insert({
    session_token: sessionToken,
    upload_token: uploadToken,
    status: "pending",
    expires_at: expiresAt,
  })

  if (error) {
    throw new Error(`No se pudo inicializar la sesión temporal de firma: ${error.message}`)
  }

  const cleanBase = baseUrl.replace(/\/+$/, "")
  const qrUrl = `${cleanBase}/firmar-movil/${uploadToken}`

  return {
    sessionToken,
    uploadToken,
    qrUrl,
    expiresAt,
  }
}

/**
 * Gets the current status of a session by the desktop session token.
 */
export async function getSessionStatus(sessionToken: string): Promise<SessionStatusResult> {
  if (!sessionToken || typeof sessionToken !== "string" || sessionToken.length < 16) {
    return { status: "not_found" }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("signature_sessions")
    .select("status, signature_data, initials_data, expires_at")
    .eq("session_token", sessionToken)
    .single()

  if (error || !data) {
    return { status: "not_found" }
  }

  const now = new Date().toISOString()
  if (data.expires_at < now) {
    // Purge expired
    try {
      await supabase.from("signature_sessions").delete().eq("session_token", sessionToken)
    } catch {}
    return { status: "expired" }
  }

  return {
    status: data.status as any,
    signatureData: data.signature_data,
    initialsData: data.initials_data,
    expiresAt: data.expires_at,
  }
}

/**
 * Called by the mobile device when the page loads to signal connection.
 */
export async function pingMobileSession(uploadToken: string): Promise<{ ok: boolean; status: string }> {
  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 16) {
    return { ok: false, status: "invalid_token" }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("signature_sessions")
    .select("status, expires_at")
    .eq("upload_token", uploadToken)
    .single()

  if (error || !data) {
    return { ok: false, status: "not_found" }
  }

  const now = new Date().toISOString()
  if (data.expires_at < now) {
    return { ok: false, status: "expired" }
  }

  if (data.status === "pending") {
    await supabase
      .from("signature_sessions")
      .update({ status: "connected" })
      .eq("upload_token", uploadToken)
  }

  return { ok: true, status: data.status === "pending" ? "connected" : data.status }
}

/**
 * Mobile device submits signature data (and optional initials).
 */
export async function submitMobileSignature(
  uploadToken: string,
  signatureData: string,
  initialsData?: string | null
): Promise<{ success: boolean; message: string }> {
  if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 16) {
    return { success: false, message: "Token de subida inválido o ausente." }
  }

  if (!isValidPngDataUrl(signatureData)) {
    return { success: false, message: "El formato de la firma debe ser una imagen PNG válida." }
  }

  if (initialsData && !isValidPngDataUrl(initialsData)) {
    return { success: false, message: "El formato de las iniciales debe ser una imagen PNG válida." }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("signature_sessions")
    .select("status, expires_at")
    .eq("upload_token", uploadToken)
    .single()

  if (error || !data) {
    return { success: false, message: "La sesión no existe o ya fue finalizada." }
  }

  const now = new Date().toISOString()
  if (data.expires_at < now) {
    return { success: false, message: "La sesión ha expirado. Por favor solicitá un nuevo código QR." }
  }

  if (data.status === "completed") {
    return { success: false, message: "Esta sesión ya fue completada previamente." }
  }

  if (data.status === "cancelled") {
    return { success: false, message: "Esta sesión fue cancelada por la computadora." }
  }

  const { error: updateError } = await supabase
    .from("signature_sessions")
    .update({
      status: "completed",
      signature_data: signatureData,
      initials_data: initialsData || null,
      completed_at: new Date().toISOString(),
    })
    .eq("upload_token", uploadToken)

  if (updateError) {
    return { success: false, message: "Error al registrar la firma en el servidor temporal." }
  }

  return { success: true, message: "Firma transferida con éxito." }
}

/**
 * Immediately purges the session data once the desktop has received it.
 */
export async function cleanupSignatureSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return
  const supabase = createAdminClient()
  try {
    await supabase.from("signature_sessions").delete().eq("session_token", sessionToken)
  } catch {}
}

/**
 * Cancels a session when closed by user.
 */
export async function cancelSignatureSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return
  const supabase = createAdminClient()
  try {
    await supabase
      .from("signature_sessions")
      .update({ status: "cancelled" })
      .eq("session_token", sessionToken)
  } catch {}
}
