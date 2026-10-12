"use client"

import React, { useState, useEffect, useRef } from "react"
import { ImageItem } from "@/lib/image-processor/types"
import { formatBytes, formatPercentDiff, getFormatBadgeLabel } from "@/lib/image-processor/utils"
import {
  X,
  Columns2,
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Check,
} from "lucide-react"

interface BeforeAfterModalProps {
  item: ImageItem | null
  isOpen: boolean
  onClose: () => void
}

export function BeforeAfterModal({
  item,
  isOpen,
  onClose,
}: BeforeAfterModalProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider">("side-by-side")
  const [sliderPosition, setSliderPosition] = useState(50) // percentage 0-100
  const [isZoomed, setIsZoomed] = useState(false)
  const isDraggingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen || !item || !item.result) return null

  const originalUrl = item.previewUrl
  const resultUrl = item.result.downloadUrl
  const diff = formatPercentDiff(item.result.percentDiff)

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percent)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true
    handleSliderMove(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleSliderMove(e.clientX)
    }
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-neutral-50/80">
          <div>
            <h3 id="modal-title" className="text-base sm:text-lg font-bold text-foreground truncate max-w-md">
              Comparación visual: {item.originalName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-foreground-muted mt-0.5">
              <span>
                Original: {formatBytes(item.originalSize)} ({getFormatBadgeLabel(item.originalFormat)})
              </span>
              <span>•</span>
              <span>
                Resultado: {formatBytes(item.result.size)} ({getFormatBadgeLabel(item.result.extension)})
              </span>
              <span
                className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                  item.result.bytesSaved > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : item.result.bytesSaved < 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-neutral-200 text-neutral-800"
                }`}
              >
                {diff.text}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-white border border-border rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === "side-by-side"
                    ? "bg-brand text-white shadow-xs"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
                Lado a lado
              </button>
              <button
                type="button"
                onClick={() => setViewMode("slider")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === "slider"
                    ? "bg-brand text-white shadow-xs"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <SplitSquareVertical className="h-3.5 w-3.5" />
                Deslizador
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-neutral-100 transition-colors cursor-pointer"
              title={isZoomed ? "Reducir vista" : "Ampliar vista"}
              aria-label={isZoomed ? "Reducir vista" : "Ampliar vista"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Cerrar modal de comparación"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Mode Switcher */}
        <div className="sm:hidden flex items-center justify-center p-2 bg-neutral-100/60 border-b border-border text-xs gap-2">
          <button
            type="button"
            onClick={() => setViewMode("side-by-side")}
            className={`px-3 py-1 rounded-md font-medium ${
              viewMode === "side-by-side"
                ? "bg-white text-brand shadow-2xs"
                : "text-foreground-muted"
            }`}
          >
            Vista separada
          </button>
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1 rounded-md font-medium ${
              viewMode === "slider"
                ? "bg-white text-brand shadow-2xs"
                : "text-foreground-muted"
            }`}
          >
            Deslizador táctil
          </button>
        </div>

        {/* Modal Body / View Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-neutral-900/5 min-h-[320px] max-h-[68vh] flex items-center justify-center select-none">
          {viewMode === "side-by-side" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
              {/* Original Card */}
              <div className="flex flex-col items-center bg-white rounded-xl border border-border p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted bg-neutral-100 px-2 py-0.5 rounded">
                    Original
                  </span>
                  <span className="text-xs text-foreground-subtle">
                    {item.originalWidth} × {item.originalHeight} px • {formatBytes(item.originalSize)}
                  </span>
                </div>
                <div
                  className={`w-full flex items-center justify-center overflow-auto rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[size:16px_16px] border border-neutral-200 min-h-[220px] max-h-[46vh] ${
                    isZoomed ? "p-4 cursor-zoom-out" : "p-2 cursor-zoom-in"
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <img
                    src={originalUrl}
                    alt={`Original: ${item.originalName}`}
                    className={`object-contain transition-transform duration-200 ${
                      isZoomed ? "scale-150 max-w-none" : "max-h-[42vh] max-w-full"
                    }`}
                  />
                </div>
              </div>

              {/* Resultado Card */}
              <div className="flex flex-col items-center bg-white rounded-xl border border-border p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand-light px-2 py-0.5 rounded">
                    Resultado
                  </span>
                  <span className="text-xs text-foreground-subtle">
                    {item.result.width} × {item.result.height} px • {formatBytes(item.result.size)}
                  </span>
                </div>
                <div
                  className={`w-full flex items-center justify-center overflow-auto rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[size:16px_16px] border border-neutral-200 min-h-[220px] max-h-[46vh] ${
                    isZoomed ? "p-4 cursor-zoom-out" : "p-2 cursor-zoom-in"
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <img
                    src={resultUrl}
                    alt={`Resultado: ${item.result.fileName}`}
                    className={`object-contain transition-transform duration-200 ${
                      isZoomed ? "scale-150 max-w-none" : "max-h-[42vh] max-w-full"
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Split-Slider View */
            <div className="flex flex-col items-center w-full max-w-3xl">
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchMove={handleTouchMove}
                className="relative w-full max-h-[55vh] flex items-center justify-center overflow-hidden rounded-xl border border-neutral-300 shadow-md bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[size:16px_16px] cursor-ew-resize select-none"
              >
                {/* Result Image (Full underneath) */}
                <img
                  src={resultUrl}
                  alt="Resultado procesado"
                  className="max-h-[55vh] max-w-full object-contain pointer-events-none block"
                />

                {/* Original Image (Clipped on top) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-h-[55vh] max-w-none object-contain h-full"
                  />
                </div>

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-brand text-white shadow-md flex items-center justify-center text-xs font-bold border-2 border-white">
                    ↔
                  </div>
                </div>

                {/* Labels overlay */}
                <span className="absolute left-3 top-3 z-20 text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                  Original ({sliderPosition > 20 ? `${Math.round(sliderPosition)}%` : ""})
                </span>
                <span className="absolute right-3 top-3 z-20 text-[11px] font-bold uppercase tracking-wider bg-brand/90 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                  Resultado
                </span>
              </div>

              <p className="text-xs text-foreground-subtle mt-3 text-center">
                Arrastrá la barra central hacia la izquierda o derecha para comparar detalles de nitidez y compresión.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-neutral-50/80">
          <div className="text-xs text-foreground-subtle hidden sm:block">
            Las imágenes se visualizan en escala real para evitar diferencias falsas de renderizado.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-white text-xs sm:text-sm font-medium text-foreground hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <a
              href={resultUrl}
              download={item.result.fileName}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Descargar esta imagen
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
