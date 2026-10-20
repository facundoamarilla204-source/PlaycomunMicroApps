import { describe, it, expect, beforeAll } from "vitest"
import fs from "fs"
import path from "path"
import {
  createSignatureSession,
  getSessionStatus,
  pingMobileSession,
  submitMobileSignature,
  cleanupSignatureSession,
} from "@/lib/signature-session"

// Load .env.local if not already in process.env
beforeAll(() => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const envPath = path.resolve(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...rest] = trimmed.split("=")
          const val = rest.join("=").replace(/^["']|["']$/g, "")
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
})

const MOCK_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

describe("Signature Session Lifecycle & Security", () => {
  it("rejects invalid upload tokens", async () => {
    const pingRes = await pingMobileSession("invalid_token")
    expect(pingRes.ok).toBe(false)

    const submitRes = await submitMobileSignature("invalid_token", MOCK_PNG_DATA_URL)
    expect(submitRes.success).toBe(false)
  })

  it("rejects non-PNG or malformed data URLs", async () => {
    const session = await createSignatureSession("https://playcomun.com")
    expect(session.sessionToken).toBeDefined()
    expect(session.uploadToken).toBeDefined()

    // Try submitting text instead of PNG
    const failRes = await submitMobileSignature(session.uploadToken, "data:text/plain;base64,aGVsbG8=")
    expect(failRes.success).toBe(false)
    expect(failRes.message).toContain("PNG")

    await cleanupSignatureSession(session.sessionToken)
  }, 15000)

  it(
    "handles the complete valid mobile QR flow: create -> ping -> submit -> retrieve -> cleanup",
    async () => {
    // 1. Desktop creates session
    const session = await createSignatureSession("https://playcomun.com")
    expect(session.sessionToken.length).toBeGreaterThanOrEqual(24)
    expect(session.uploadToken.length).toBeGreaterThanOrEqual(24)
    expect(session.qrUrl).toContain(`/firmar-movil/${session.uploadToken}`)

    // 2. Initial status is pending
    const initialStatus = await getSessionStatus(session.sessionToken)
    expect(initialStatus.status).toBe("pending")
    expect(initialStatus.signatureData).toBeFalsy()

    // 3. Mobile connects and pings
    const pingResult = await pingMobileSession(session.uploadToken)
    expect(pingResult.ok).toBe(true)
    expect(pingResult.status).toBe("connected")

    // 4. Desktop detects connected status
    const connectedStatus = await getSessionStatus(session.sessionToken)
    expect(connectedStatus.status).toBe("connected")

    // 5. Mobile submits valid transparent PNG signature
    const submitResult = await submitMobileSignature(session.uploadToken, MOCK_PNG_DATA_URL)
    expect(submitResult.success).toBe(true)

    // 6. Double submit is rejected (single use!)
    const secondSubmit = await submitMobileSignature(session.uploadToken, MOCK_PNG_DATA_URL)
    expect(secondSubmit.success).toBe(false)

    // 7. Desktop retrieves completed signature
    const completedStatus = await getSessionStatus(session.sessionToken)
    expect(completedStatus.status).toBe("completed")
    expect(completedStatus.signatureData).toBe(MOCK_PNG_DATA_URL)

    // 8. Desktop cleans up immediately upon receipt (zero permanent storage)
    await cleanupSignatureSession(session.sessionToken)

    const afterCleanup = await getSessionStatus(session.sessionToken)
    expect(afterCleanup.status).toBe("not_found")
  }, 25000)
})
