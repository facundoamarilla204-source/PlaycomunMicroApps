import { describe, it, expect, beforeEach } from "vitest"
import {
  createScanSession,
  getScanSessionStatus,
  pingMobileScanSession,
  uploadScanPage,
  removeScanPage,
  cleanupScanSession,
  isValidImageDataUrl,
} from "./scan-session"

// 1x1 transparent PNG data URL
const VALID_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

// 1x1 white JPEG data URL
const VALID_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

describe("Scan Session (Mobile QR Pairing & Ephemeral Store)", () => {
  it("validates legitimate image data URLs correctly", () => {
    expect(isValidImageDataUrl(VALID_PNG)).toBe(true)
    expect(isValidImageDataUrl(VALID_JPEG)).toBe(true)
    expect(isValidImageDataUrl("data:text/plain;base64,aGVsbG8=")).toBe(false)
    expect(isValidImageDataUrl("not_a_data_url")).toBe(false)
    expect(isValidImageDataUrl("data:image/png;base64,invalid_bytes")).toBe(false)
  })

  it("creates a secure session with cryptographic tokens and valid QR URL", async () => {
    const session = await createScanSession("https://playcomun.com")
    expect(session.sessionToken).toBeDefined()
    expect(session.sessionToken.length).toBeGreaterThanOrEqual(24)
    expect(session.uploadToken).toBeDefined()
    expect(session.uploadToken.length).toBeGreaterThanOrEqual(24)
    expect(session.sessionToken).not.toEqual(session.uploadToken)
    expect(session.qrUrl).toBe(`https://playcomun.com/escanear-movil/${session.uploadToken}`)
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it("handles the complete mobile pairing flow: create -> ping -> upload -> status -> cleanup", async () => {
    // 1. PC creates session
    const session = await createScanSession("https://playcomun.com")

    // Check initial status
    const initialStatus = await getScanSessionStatus(session.sessionToken)
    expect(initialStatus.status).toBe("pending")
    expect(initialStatus.pagesCount).toBe(0)

    // 2. Mobile opens QR link and pings
    const pingRes = await pingMobileScanSession(session.uploadToken)
    expect(pingRes.ok).toBe(true)
    expect(pingRes.status).toBe("connected")

    // PC checks status after mobile ping
    const connectedStatus = await getScanSessionStatus(session.sessionToken)
    expect(connectedStatus.status).toBe("connected")

    // 3. Mobile uploads first scanned page
    const uploadRes1 = await uploadScanPage(session.uploadToken, VALID_PNG)
    expect(uploadRes1.success).toBe(true)
    expect(uploadRes1.totalPages).toBe(1)

    // 4. Mobile uploads second scanned page
    const uploadRes2 = await uploadScanPage(session.uploadToken, VALID_JPEG)
    expect(uploadRes2.success).toBe(true)
    expect(uploadRes2.totalPages).toBe(2)

    // 5. PC checks received pages
    const statusWithPages = await getScanSessionStatus(session.sessionToken)
    expect(statusWithPages.status).toBe("receiving")
    expect(statusWithPages.pagesCount).toBe(2)
    expect(statusWithPages.pages).toBeDefined()
    expect(statusWithPages.pages?.[0].dataUrl).toBe(VALID_PNG)
    expect(statusWithPages.pages?.[1].dataUrl).toBe(VALID_JPEG)

    // 6. Mobile can remove a page if retaken
    const pageIdToRemove = statusWithPages.pages![0].id
    const removeRes = await removeScanPage(session.uploadToken, pageIdToRemove)
    expect(removeRes.success).toBe(true)
    expect(removeRes.totalPages).toBe(1)

    // 7. PC finishes and triggers immediate zero-persistence cleanup
    await cleanupScanSession(session.sessionToken)

    const purgedStatus = await getScanSessionStatus(session.sessionToken)
    expect(purgedStatus.status).toBe("not_found")
  })

  it("rejects unauthorized uploads with invalid or expired tokens", async () => {
    const res = await uploadScanPage("invalid_token_123456789", VALID_PNG)
    expect(res.success).toBe(false)
    expect(res.message).toContain("no existe o ya ha expirado")
  })

  it("prevents duplicate identical page uploads in quick succession", async () => {
    const session = await createScanSession("https://playcomun.com")
    const res1 = await uploadScanPage(session.uploadToken, VALID_PNG)
    expect(res1.success).toBe(true)

    // Retry sending same image
    const res2 = await uploadScanPage(session.uploadToken, VALID_PNG)
    expect(res2.success).toBe(true)
    expect(res2.message).toContain("ya recibida")
    expect(res2.totalPages).toBe(1)
  })
})
