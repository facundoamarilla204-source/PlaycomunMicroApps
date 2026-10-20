"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import {
  PenTool,
  RotateCcw,
  Trash2,
  Check,
  X,
  Palette,
  Sparkles,
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

interface DrawSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSignature: (dataUrl: string, title: string, aspectRatio: number) => void
}

const PRESET_COLORS = [
  { label: "Negro", value: "#0F172A" },
  { label: "Azul marino", value: "#1E3A8A" },
  { label: "Azul real", value: "#2563EB" },
  { label: "Violeta PlayComun", value: "#7C3AED" },
  { label: "Gris oscuro", value: "#334155" },
]

const STROKE_WIDTHS = [
  { label: "Fino", value: 2.5 },
  { label: "Normal", value: 4.0 },
  { label: "Grueso", value: 6.0 },
]

export function DrawSignatureModal({
  isOpen,
  onClose,
  onAddSignature,
}: DrawSignatureModalProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentColor, setCurrentColor] = useState<string>("#0F172A")
  const [currentWidth, setCurrentWidth] = useState<number>(3.5)
  const [customHex, setCustomHex] = useState<string>("")
  const [isDrawing, setIsDrawing] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentStrokeRef = useRef<Point[]>([])

  const activeColor = customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : currentColor

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

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
  }, [strokes])

  // Resize canvas with high DPI scale
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
    if (isOpen) {
      // Delay slightly to ensure modal is mounted and layout rendered
      const timer = setTimeout(resizeCanvas, 50)
      window.addEventListener("resize", resizeCanvas)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("resize", resizeCanvas)
      }
    }
  }, [isOpen, resizeCanvas])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  if (!isOpen) return null

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    const pt = getCanvasPoint(e)
    setIsDrawing(true)
    currentStrokeRef.current = [pt]

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.fillStyle = activeColor
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
    ctx.strokeStyle = activeColor
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
        color: activeColor,
        width: currentWidth,
      }
      setStrokes((prev) => [...prev, newStroke])
    }
    currentStrokeRef.current = []
  }

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setStrokes([])
  }

  // Export trimmed high-res transparent PNG
  const handleConfirm = () => {
    if (strokes.length === 0) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const s of strokes) {
      for (const p of s.points) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }
    }

    if (minX === Infinity) return

    const pad = 20
    const w = Math.max(100, Math.ceil(maxX - minX + pad * 2))
    const h = Math.max(60, Math.ceil(maxY - minY + pad * 2))
    const dpr = 3

    const offscreen = document.createElement("canvas")
    offscreen.width = w * dpr
    offscreen.height = h * dpr

    const ctx = offscreen.getContext("2d")
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const offsetX = minX - pad
    const offsetY = minY - pad

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

    const dataUrl = offscreen.toDataURL("image/png")
    const aspectRatio = w / Math.max(1, h)

    onAddSignature(dataUrl, "Firma dibujada", aspectRatio)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/70 text-brand flex items-center justify-center border border-purple-200/60">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Dibujar mi firma</h2>
              <p className="text-xs text-slate-500">Trazá tu firma con el mouse o tu pantalla táctil.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* LIENZO DE DIBUJO */}
          <div className="relative rounded-3xl border-2 border-slate-300 bg-white shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-64 sm:h-72 touch-none cursor-crosshair block"
              style={{ touchAction: "none" }}
            />

            {/* Línea guía base de firma */}
            <div className="absolute left-8 right-8 bottom-16 border-b border-dashed border-slate-200 pointer-events-none" />

            {/* Marca de agua si no hay trazos */}
            {strokes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 gap-2">
                <PenTool className="w-8 h-8 opacity-40 text-brand" />
                <span className="text-xs font-medium">Hacé clic y arrastrá para firmar</span>
              </div>
            )}

            {/* Botones de acción flotantes en el lienzo */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs flex items-center justify-center gap-1.5 text-xs font-medium"
                title="Deshacer último trazo"
              >
                <RotateCcw className="w-4 h-4" /> Deshacer
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs flex items-center justify-center gap-1.5 text-xs font-medium"
                title="Limpiar toda la pizarra"
              >
                <Trash2 className="w-4 h-4" /> Limpiar
              </button>
            </div>
          </div>

          {/* BARRA DE COLOR Y GROSOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            {/* Color */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand" /> Color de tinta:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setCurrentColor(c.value)
                      setCustomHex("")
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform min-h-[40px] min-w-[40px] flex items-center justify-center ${
                      activeColor === c.value
                        ? "border-brand scale-110 shadow-xs"
                        : "border-transparent hover:scale-105"
                    }`}
                    aria-label={`Color ${c.label}`}
                  >
                    <span
                      className="w-5 h-5 rounded-full block border border-slate-200 shadow-2xs"
                      style={{ backgroundColor: c.value }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Grosor */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-xs font-bold text-slate-700 block">Grosor del trazo:</span>
              <div className="flex items-center gap-2">
                {STROKE_WIDTHS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setCurrentWidth(w.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium min-h-[40px] transition-colors ${
                      currentWidth === w.value
                        ? "bg-purple-100 text-brand font-bold ring-1 ring-brand/30"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={strokes.length === 0}
            className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40 min-h-[44px] flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Colocar firma en el documento
          </button>
        </div>
      </motion.div>
    </div>
  )
}
