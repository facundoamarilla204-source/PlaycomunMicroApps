"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { QRCodeSVG } from "qrcode.react"
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"

interface QrMobileModalProps {
  isOpen: boolean
  onClose: () => void
  onSignatureReceived: (
    signatureDataUrl: string,
    initialsDataUrl?: string | null
  ) => void
}

export function QrMobileModal({
  isOpen,
  onClose,
  onSignatureReceived,
}: QrMobileModalProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<
    "loading" | "pending" | "connected" | "completed" | "expired" | "error"
  >("loading")
  const [receivedSignature, setReceivedSignature] = useState<string | null>(null)
  const [receivedInitials, setReceivedInitials] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize session when modal opens
  const startSession = async () => {
    setSessionStatus("loading")
    setErrorMessage(null)
    setSessionToken(null)
    setQrUrl(null)
    setReceivedSignature(null)
    setReceivedInitials(null)

    try {
      const res = await fetch("/api/signature-session/create", {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("No se pudo iniciar la sesión de firma.")
      }
      const data = await res.json()
      setSessionToken(data.sessionToken)
      setQrUrl(data.qrUrl)
      setSessionStatus("pending")
    } catch (err: any) {
      setSessionStatus("error")
      setErrorMessage(err?.message || "Error al conectar con el servidor temporal.")
    }
  }

  useEffect(() => {
    if (isOpen) {
      startSession()
    } else {
      // Clean up when modal closes
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }
  }, [isOpen])

  // Poll status while session is active
  useEffect(() => {
    if (!sessionToken || sessionStatus === "completed" || sessionStatus === "expired" || sessionStatus === "error") {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/signature-session/status?token=${sessionToken}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.status === "connected") {
          setSessionStatus("connected")
        } else if (data.status === "completed" && data.signatureData) {
          setSessionStatus("completed")
          setReceivedSignature(data.signatureData)
          setReceivedInitials(data.initialsData || null)

          // Immediately clean up from database (zero persistence)
          fetch("/api/signature-session/cleanup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken }),
          }).catch(() => {})

          // Stop polling
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current)
            pollingTimerRef.current = null
          }
        } else if (data.status === "expired" || data.status === "not_found") {
          setSessionStatus("expired")
        }
      } catch {}
    }

    // Poll every 1.8 seconds
    pollingTimerRef.current = setInterval(checkStatus, 1800)

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }
  }, [sessionToken, sessionStatus])

  if (!isOpen) return null

  const handleCopyLink = () => {
    if (!qrUrl) return
    navigator.clipboard.writeText(qrUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handlePlaceReceivedSignature = () => {
    if (receivedSignature) {
      onSignatureReceived(receivedSignature, receivedInitials)
      onClose()
    }
  }

  const handleClose = () => {
    if (sessionToken && sessionStatus !== "completed") {
      fetch("/api/signature-session/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      }).catch(() => {})
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/70 text-brand flex items-center justify-center border border-purple-200/60">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Firmar desde el celular</h2>
              <p className="text-xs text-slate-500">Escaneá el código QR para dibujar tu firma en la pantalla del teléfono.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5 text-center">
          {sessionStatus === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Generando sesión temporal cifrada...</p>
            </div>
          )}

          {(sessionStatus === "pending" || sessionStatus === "connected") && qrUrl && (
            <div className="space-y-5">
              {/* Contenedor del código QR con esquinas redondeadas */}
              <div className="inline-block p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-md">
                <QRCodeSVG
                  value={qrUrl}
                  size={200}
                  level="M"
                  marginSize={1}
                  fgColor="#0F172A"
                />
              </div>

              {/* Indicador de estado en tiempo real */}
              <div className="space-y-1.5">
                {sessionStatus === "connected" ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Celular conectado: esperando tu firma en la pantalla...
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-brand">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                    Esperando escaneo con la cámara del celular...
                  </div>
                )}

                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed pt-1">
                  1. Abrí la cámara de tu celular y apuntá al código QR.
                  <br />
                  2. Dibujá tu firma en la pantalla y tocala para transferirla aquí.
                </p>
              </div>

              {/* Opción alternativa de enlace directo */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "¡Enlace copiado!" : "Copiar enlace para abrir en el celular"}
                </button>
              </div>
            </div>
          )}

          {sessionStatus === "completed" && (
            <div className="space-y-5 py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">¡Firma recibida con éxito!</h3>
                <p className="text-xs text-slate-500">
                  La firma capturada en tu teléfono ya está lista para colocarse sobre las páginas del documento.
                </p>
              </div>

              {/* Vista previa de la firma recibida */}
              {receivedSignature && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] max-w-xs mx-auto">
                  <img
                    src={receivedSignature}
                    alt="Firma recibida"
                    className="max-h-24 mx-auto object-contain"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceReceivedSignature}
                className="w-full py-3 px-6 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 min-h-[46px]"
              >
                <Check className="w-4 h-4" />
                Ubicar firma en el PDF
              </button>
            </div>
          )}

          {sessionStatus === "expired" && (
            <div className="space-y-4 py-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Sesión expirada</h3>
                <p className="text-xs text-slate-500">
                  Por seguridad, cada sesión tiene una vigencia de 15 minutos.
                </p>
              </div>
              <button
                type="button"
                onClick={startSession}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-sm min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                Generar nuevo código QR
              </button>
            </div>
          )}

          {sessionStatus === "error" && (
            <div className="space-y-4 py-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-700">{errorMessage || "Error al conectar."}</p>
              <button
                type="button"
                onClick={startSession}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          )}

          {/* Nota de privacidad y seguridad */}
          <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 flex items-start gap-2 text-left">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              El PDF original nunca se envía a ningún servidor. La comunicación temporal solo transporta el trazo de tu firma con cifrado en tránsito y se elimina inmediatamente al recibirse.
            </p>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white min-h-[44px]"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
