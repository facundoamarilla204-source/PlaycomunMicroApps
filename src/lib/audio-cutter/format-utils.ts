/**
 * Utilities for formatting audio time, durations and file sizes
 */

export function formatTime(seconds: number, includeMs = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  const mStr = mins.toString().padStart(2, "0")
  const sStr = secs.toString().padStart(2, "0")
  const msStr = ms.toString().padStart(3, "0")

  if (includeMs) {
    return `${mStr}:${sStr}.${msStr}`
  }
  return `${mStr}:${sStr}`
}

export function parseTimeToSeconds(mins: number, secs: number, ms: number): number {
  const safeMins = Math.max(0, isNaN(mins) ? 0 : mins)
  const safeSecs = Math.max(0, Math.min(59, isNaN(secs) ? 0 : secs))
  const safeMs = Math.max(0, Math.min(999, isNaN(ms) ? 0 : ms))
  return safeMins * 60 + safeSecs + safeMs / 1000
}

export function splitSeconds(totalSeconds: number): { mins: number; secs: number; ms: number } {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  const ms = Math.round((totalSeconds % 1) * 1000)
  return { mins, secs, ms }
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export function getCleanBaseName(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".")
  if (lastDot > 0) {
    return originalName.substring(0, lastDot)
  }
  return originalName
}
