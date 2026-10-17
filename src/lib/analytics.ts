import { track } from "@vercel/analytics"

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export type EventPayload = Record<string, string | number | boolean | null | undefined>

/**
 * Registra un evento de analítica respetando la privacidad del usuario.
 * Se comunica con Vercel Analytics y con Google Analytics 4 (si window.gtag está presente).
 */
export function trackEvent(name: string, payload?: EventPayload) {
  if (typeof window === "undefined") return

  try {
    // Vercel Analytics Custom Events
    track(name, payload as any)
  } catch (e) {
    // Silencioso para no interferir con la experiencia del usuario
  }

  try {
    // GA4 Custom Event si está configurado
    if (typeof window.gtag === "function") {
      window.gtag("event", name, payload)
    }
  } catch (e) {
    // Silencioso
  }
}

/**
 * Registra el uso de una herramienta (cálculo realizado, generación, etc.)
 */
export function trackToolUse(toolSlug: string, action: string = "calculate") {
  trackEvent("tool_used", {
    tool: toolSlug,
    action,
    timestamp: Date.now(),
  })
}

/**
 * Registra una acción de valor/conversión (descarga de PDF, exportación, etc.)
 */
export function trackDocumentExport(toolSlug: string, format: string = "pdf") {
  trackEvent("document_exported", {
    tool: toolSlug,
    format,
    timestamp: Date.now(),
  })
}

/**
 * Registra aperturas o clics hacia planes Pro
 */
export function trackProInterest(source: string, intent: "modal_view" | "upgrade_click") {
  trackEvent("pro_interest", {
    source,
    intent,
    timestamp: Date.now(),
  })
}
