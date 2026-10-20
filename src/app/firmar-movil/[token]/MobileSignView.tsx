"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  PenTool,
  RotateCcw,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Shield,
  Layers,
} from "lucide-react"

interface Point {
  x: number
  y: number
  pressure?: number
}

interface Stroke {
  points: Point[]
  color: string
  width: number
}

interface MobileSignViewProps {
  uploadToken: string
}

const COLOR_OPTIONS = [
  { label: "Negro", value: "#0F172A" },
  { label: "Azul marino", value: "#1E3A8A" },
  { label: "Azul real", value: "#2563EB" },
  { label: "Violeta PlayComun", value: "#7C3AED" },
]

const STROKE_WIDTHS = [
  { label: "Fino", value: 2.5 },
  { label: "Medio", value: 4 },
  { label: "Grueso", value: 6 },
]

export function MobileSignView({ uploadToken }: MobileSignViewProps) {
  const [activeTab, setActiveTab] = useState<"signature" | "initials">("signature")

  // Strokes for signature and initials
  const [signatureStrokes, setSignatureStrokes] = useState<Stroke[]>([])
  const [initialsStrokes, setInitialsStrokes] = useState<Stroke[]>([])

  // Canvas drawing state
  const [currentColor, setCurrentColor] = useState<string>("#0F172A")
  const [currentWidth, setCurrentWidth] = useState<number>(3.5)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentStrokeRef = useRef<Point[]>([])

  const currentStrokes = activeTab === "signature" ? signatureStrokes : initialsStrokes
  const setCurrentStrokes = activeTab === "signature" ? setSignatureStrokes : setInitialsStrokes

  // Redraw canvas whenever strokes change or tab switches
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of currentStrokes) {
      if (stroke.points.length === 0) continue

      ctx.save()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (stroke.points.length === 1) {
        ctx.fillStyle = stroke.color
        ctx.beginPath()
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc)
        }

        const last = stroke.points[stroke.points.length - 1]
        ctx.lineTo(last.x, last.y)
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [currentStrokes])

  // Resize canvas to match display size with high DPI
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 2
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Get pointer coordinates relative to canvas
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    }
  }

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const target = e.currentTarget
    try {
      target.setPointerCapture(e.pointerId)
    } catch {}

    const pt = getCanvasPoint(e)
    setIsDrawing(true)
    currentStrokeRef.current = [pt]

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.fillStyle = currentColor
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, currentWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const pt = getCanvasPoint(e)
    currentStrokeRef.current.push(pt)

    const points = currentStrokeRef.current
    if (points.length < 2) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.strokeStyle = currentColor
    ctx.lineWidth = currentWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const prev = points[points.length - 2]
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    ctx.restore()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    if (currentStrokeRef.current.length > 0) {
      const newStroke: Stroke = {
        points: [...currentStrokeRef.current],
        color: currentColor,
        width: currentWidth,
      }
      setCurrentStrokes((prev) => [...prev, newStroke])
    }
    currentStrokeRef.current = []
  }

  const handleUndo = () => {
    setCurrentStrokes((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setCurrentStrokes([])
  }

  // Export strokes from an offscreen canvas trimmed to tight bounding box with transparency
  const exportStrokesToPng = (strokes: Stroke[]): string | null => {
    if (strokes.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const stroke of strokes) {
      for (const p of stroke.points) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }
    }

    if (minX === Infinity) return null

    const padding = 16
    const renderWidth = Math.max(80, Math.ceil(maxX - minX + padding * 2))
    const renderHeight = Math.max(50, Math.ceil(maxY - minY + padding * 2))

    const offscreen = document.createElement("canvas")
    const dpr = 3 // Crisp 3x resolution for PDF rendering
    offscreen.width = renderWidth * dpr
    offscreen.height = renderHeight * dpr

    const ctx = offscreen.getContext("2d")
    if (!ctx) return null

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, renderWidth, renderHeight)

    const offsetX = minX - padding
    const offsetY = minY - padding

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue

      ctx.save()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (stroke.points.length === 1) {
        ctx.fillStyle = stroke.color
        ctx.beginPath()
        ctx.arc(stroke.points[0].x - offsetX, stroke.points[0].y - offsetY, stroke.width / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x - offsetX, stroke.points[0].y - offsetY)

        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2 - offsetX
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2 - offsetY
          ctx.quadraticCurveTo(stroke.points[i].x - offsetX, stroke.points[i].y - offsetY, xc, yc)
        }

        const last = stroke.points[stroke.points.length - 1]
        ctx.lineTo(last.x - offsetX, last.y - offsetY)
        ctx.stroke()
      }
      ctx.restore()
    }

    return offscreen.toDataURL("image/png")
  }

  // Submit to server
  const handleSubmit = async () => {
    if (signatureStrokes.length === 0) {
      setErrorMessage("Por favor dibujá tu firma en la pantalla antes de confirmar.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const signaturePng = exportStrokesToPng(signatureStrokes)
      if (!signaturePng) {
        throw new Error("No se pudo generar la imagen de la firma.")
      }

      const initialsPng = initialsStrokes.length > 0 ? exportStrokesToPng(initialsStrokes) : null

      const res = await fetch("/api/signature-session/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadToken,
          signatureData: signaturePng,
          initialsData: initialsPng,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo transferir la firma.")
      }

      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocurrió un error al enviar tu firma. Por favor intentá nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-5"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ¡Firma transferida con éxito!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tu firma ya se encuentra disponible en tu computadora. Volvé al navegador de tu PC para ubicarla en la página que elijas de tu PDF.
            </p>
          </div>

          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs text-purple-900 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-brand">
              <Shield className="w-4 h-4" />
              <span>Privacidad garantizada</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Los datos temporales se eliminan de forma automática una vez recibidos. Tu documento PDF nunca salió de tu computadora.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Podés cerrar esta pestaña en tu celular con tranquilidad.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      {/* Barra superior móvil */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-xs">
            P
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">PlayComun Online</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Conectado a la computadora
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
          <Smartphone className="w-3.5 h-3.5 text-brand" /> Móvil
        </div>
      </header>

      {/* Selector de Pestaña: Firma vs Iniciales */}
      <div className="p-4 space-y-3">
        <div className="flex bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("signature")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
              activeTab === "signature"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-brand" />
            Firma principal {signatureStrokes.length > 0 && "•"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("initials")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
              activeTab === "initials"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-brand" />
            Iniciales {initialsStrokes.length > 0 && "•"}
          </button>
        </div>

        {/* Notificación de error */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 p-1 font-bold"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instrucción visual */}
        <div className="text-center">
          <p className="text-xs text-slate-600">
            {activeTab === "signature"
              ? "Dibujá tu firma con el dedo en el recuadro blanco."
              : "Dibujá tus iniciales para aplicarlas en las páginas."}
          </p>
        </div>

        {/* LIENZO DE DIBUJO TÁCTIL */}
        <div className="relative rounded-3xl border-2 border-slate-300 bg-white shadow-inner overflow-hidden">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-72 touch-none cursor-crosshair block"
            style={{ touchAction: "none" }}
          />

          {/* Línea guía base de firma */}
          <div className="absolute left-6 right-6 bottom-16 border-b border-dashed border-slate-200 pointer-events-none" />

          {/* Marca de agua sutil de orientación */}
          {currentStrokes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 gap-2">
              <PenTool className="w-8 h-8 opacity-40 text-brand" />
              <span className="text-xs font-medium">Trazá tu firma aquí</span>
            </div>
          )}

          {/* Botones de acción flotantes en el lienzo */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleUndo}
              disabled={currentStrokes.length === 0}
              className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs flex items-center justify-center"
              aria-label="Deshacer último trazo"
              title="Deshacer último trazo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={currentStrokes.length === 0}
              className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs flex items-center justify-center"
              aria-label="Limpiar pizarra"
              title="Limpiar pizarra"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SELECTORES DE COLOR Y GROSOR */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          {/* Selector de color */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Tinta:</span>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCurrentColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    currentColor === c.value
                      ? "border-brand scale-110 shadow-xs"
                      : "border-transparent hover:scale-105"
                  }`}
                  aria-label={`Color ${c.label}`}
                >
                  <span
                    className="w-6 h-6 rounded-full block border border-slate-200"
                    style={{ backgroundColor: c.value }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Selector de grosor */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700">Grosor:</span>
            <div className="flex items-center gap-2">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setCurrentWidth(w.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium min-h-[44px] transition-colors ${
                    currentWidth === w.value
                      ? "bg-purple-100 text-brand font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTÓN PRINCIPAL DE ENVÍO */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || signatureStrokes.length === 0}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold text-sm shadow-md shadow-purple-500/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Transfiriendo firma..." : "Confirmar y transferir a la PC"}
          </button>
        </div>

        {/* NOTA DE PRIVACIDAD */}
        <div className="p-3 bg-slate-100/70 rounded-2xl text-[11px] text-slate-500 flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Tu documento PDF permanece en el navegador de tu computadora. El celular solo transmite el trazo transparente de tu firma a través de una sesión cifrada y efímera.
          </p>
        </div>
      </div>
    </div>
  )
}
