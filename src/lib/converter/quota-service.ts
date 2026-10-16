import crypto from "crypto"
import { createClient } from "@/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { isProUser } from "@/lib/pro"
import { ConversionQuotaState } from "./types"

const WORKER_SECRET =
  process.env.CONVERSION_WORKER_SECRET || "playcomun-dev-secret-change-in-prod"

const IP_SALT =
  process.env.CONVERSION_IP_SALT || "playcomun-ip-anonymizer-salt-2026"

export const MAX_SIZE_FREE_MB = 10
export const MAX_SIZE_PRO_MB = 50
export const MAX_SIZE_FREE_BYTES = MAX_SIZE_FREE_MB * 1024 * 1024
export const MAX_SIZE_PRO_BYTES = MAX_SIZE_PRO_MB * 1024 * 1024

// Service role Supabase client for atomic SECURITY DEFINER RPC execution
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// In-memory sliding window rate limiter for token endpoint protection
interface RateLimitBucket {
  count: number
  resetAt: number
}
const tokenRateLimits = new Map<string, RateLimitBucket>()

export function checkTokenRateLimit(
  identifier: string,
  maxPerMinute = 20
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const bucket = tokenRateLimits.get(identifier)

  if (!bucket || now > bucket.resetAt) {
    tokenRateLimits.set(identifier, {
      count: 1,
      resetAt: now + 60_000,
    })
    return { allowed: true, remaining: maxPerMinute - 1 }
  }

  if (bucket.count >= maxPerMinute) {
    return { allowed: false, remaining: 0 }
  }

  bucket.count++
  return { allowed: true, remaining: maxPerMinute - bucket.count }
}

/**
 * Extracts and anonymizes the client identifier without storing raw IP.
 * - Authenticated: 'usr:<user_id>'
 * - Anonymous: 'anon:<HMAC_SHA256(ip, salt)>'
 */
export function getClientIdentifier(req: Request, userId: string | null): string {
  if (userId) {
    return `usr:${userId}`
  }

  const headers = req.headers
  const rawIp =
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"

  const ipHash = crypto
    .createHmac("sha256", IP_SALT)
    .update(rawIp)
    .digest("hex")
    .substring(0, 32)

  return `anon:${ipHash}`
}

/**
 * Checks if current request has Pro subscription
 */
export async function resolveUserProStatus(): Promise<{
  userId: string | null
  isPro: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, isPro: false }
  }

  const isPro = await isProUser(user.id)
  return { userId: user.id, isPro }
}

/**
 * Gets quota status from Supabase
 */
export async function fetchQuotaStatus(
  identifier: string,
  isPro: boolean
): Promise<ConversionQuotaState> {
  const adminSupabase = getAdminSupabase()
  const { data, error } = await adminSupabase.rpc("get_conversion_quota_status", {
    p_identifier: identifier,
    p_is_pro: isPro,
  })

  if (error || !data) {
    console.error("Error fetching quota status:", error)
    return {
      is_pro: isPro,
      limit: isPro ? 100 : 5,
      used: 0,
      remaining: isPro ? 100 : 5,
      quota_date: new Date().toISOString().split("T")[0],
      resets_at: new Date(Date.now() + 86400000).toISOString(),
      max_file_size_mb: isPro ? MAX_SIZE_PRO_MB : MAX_SIZE_FREE_MB,
    }
  }

  return {
    is_pro: Boolean(data.is_pro),
    limit: Number(data.limit),
    used: Number(data.used),
    remaining: Number(data.remaining),
    quota_date: String(data.quota_date),
    resets_at: String(data.resets_at),
    max_file_size_mb: isPro ? MAX_SIZE_PRO_MB : MAX_SIZE_FREE_MB,
  }
}

/**
 * Atomic reservation of quota in Supabase
 */
export async function reserveQuota(params: {
  identifier: string
  isPro: boolean
  operationId: string
  fileCount: number
  fileSizeBytes: number
}): Promise<{
  success: boolean
  reservationId?: string
  error?: string
  quota: ConversionQuotaState
}> {
  const adminSupabase = getAdminSupabase()
  const { data, error } = await adminSupabase.rpc("reserve_conversion_quota", {
    p_identifier: params.identifier,
    p_is_pro: params.isPro,
    p_operation_id: params.operationId,
    p_file_count: params.fileCount,
    p_file_size_bytes: params.fileSizeBytes,
  })

  if (error || !data) {
    console.error("Error reserving quota:", error)
    const fallback = await fetchQuotaStatus(params.identifier, params.isPro)
    return {
      success: false,
      error: "DATABASE_ERROR",
      quota: fallback,
    }
  }

  const quota: ConversionQuotaState = {
    is_pro: params.isPro,
    limit: Number(data.limit),
    used: Number(data.used),
    remaining: Number(data.remaining),
    quota_date: String(data.quota_date),
    resets_at: String(data.resets_at),
    max_file_size_mb: params.isPro ? MAX_SIZE_PRO_MB : MAX_SIZE_FREE_MB,
  }

  if (!data.success) {
    return {
      success: false,
      error: data.error || "QUOTA_EXCEEDED",
      quota,
    }
  }

  return {
    success: true,
    reservationId: data.reservation_id,
    quota,
  }
}

/**
 * Confirms a reservation after successful conversion
 */
export async function confirmQuota(
  reservationId: string,
  actualSizeBytes?: number
): Promise<{
  success: boolean
  quota?: ConversionQuotaState
}> {
  const adminSupabase = getAdminSupabase()
  const { data, error } = await adminSupabase.rpc("confirm_conversion_quota", {
    p_reservation_id: reservationId,
    p_actual_size: actualSizeBytes || null,
  })

  if (error || !data || !data.success) {
    console.error("Error confirming quota reservation:", error)
    return { success: false }
  }

  const quotaRaw = data.quota
  return {
    success: true,
    quota: quotaRaw
      ? {
          is_pro: Boolean(quotaRaw.is_pro),
          limit: Number(quotaRaw.limit),
          used: Number(quotaRaw.used),
          remaining: Number(quotaRaw.remaining),
          quota_date: String(quotaRaw.quota_date),
          resets_at: String(quotaRaw.resets_at),
          max_file_size_mb: quotaRaw.is_pro ? MAX_SIZE_PRO_MB : MAX_SIZE_FREE_MB,
        }
      : undefined,
  }
}

/**
 * Releases a reservation upon conversion failure or cancellation
 */
export async function releaseQuota(reservationId: string): Promise<{
  success: boolean
  quota?: ConversionQuotaState
}> {
  const adminSupabase = getAdminSupabase()
  const { data, error } = await adminSupabase.rpc("release_conversion_quota", {
    p_reservation_id: reservationId,
  })

  if (error || !data || !data.success) {
    console.error("Error releasing quota reservation:", error)
    return { success: false }
  }

  const quotaRaw = data.quota
  return {
    success: true,
    quota: quotaRaw
      ? {
          is_pro: Boolean(quotaRaw.is_pro),
          limit: Number(quotaRaw.limit),
          used: Number(quotaRaw.used),
          remaining: Number(quotaRaw.remaining),
          quota_date: String(quotaRaw.quota_date),
          resets_at: String(quotaRaw.resets_at),
          max_file_size_mb: quotaRaw.is_pro ? MAX_SIZE_PRO_MB : MAX_SIZE_FREE_MB,
        }
      : undefined,
  }
}

/**
 * Creates signed HMAC authorization token for the Render Worker
 */
export function signWorkerToken(params: {
  reservationId: string
  operationId: string
  isPro: boolean
  maxBytes: number
  timestamp: number
}): string {
  const payload = `${params.reservationId}:${params.operationId}:${params.isPro}:${params.maxBytes}:${params.timestamp}`
  return crypto.createHmac("sha256", WORKER_SECRET).update(payload).digest("hex")
}

/**
 * Verifies a cryptographic completion receipt produced by the worker
 */
export function verifyWorkerReceipt(
  receipt: string,
  reservationId: string,
  fileSize: number
): boolean {
  if (!receipt || !reservationId) return false

  const expected = crypto
    .createHmac("sha256", WORKER_SECRET)
    .update(`receipt:${reservationId}:${fileSize}`)
    .digest("hex")

  const receiptBuf = Buffer.from(receipt)
  const expectedBuf = Buffer.from(expected)

  if (receiptBuf.length !== expectedBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(receiptBuf, expectedBuf)
}
