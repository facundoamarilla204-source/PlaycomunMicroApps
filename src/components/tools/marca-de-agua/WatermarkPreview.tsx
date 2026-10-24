"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  WatermarkConfig,
  WatermarkImageItem,
} from "@/lib/watermark/types"
import {
  calculateFontSizePx,
  calculateLogoDimensions,
  measureMultilineText,
  resolveWatermarkPosition,
} from "@/lib/watermark/layout"
import { drawFullComposition, loadImageElement } from "@/lib/watermark/engine"
import {
  Eye,
  EyeOff,
  Move,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Loader2,
} from "lucide-react"

interface WatermarkPreviewProps {
  activeItem: WatermarkImageItem | null
  config: WatermarkConfig
  logoImg: HTMLImageElement | null
  onCustomPositionChange: (pos: { xRel: number; yRel: number }) => void
  onDownloadActive?: () => void
  isDownloadingActive?: boolean
}

export function WatermarkPreview({
  activeItem,
  config,
  logoImg,
  onCustomPositionChange,
  onDownloadActive,
  isDownloadingActive,
}: WatermarkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [baseImgElement, setBaseImgElement] = useState<HTMLImageElement | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zoomMode, setZoomMode] = useState<"fit" | "actual">("fit")
  const [isHoveringWatermark, setIsHoveringWatermark] = useState(false)
  const [isExceedingBounds, setIsExceedingBounds] = useState(false)

  // Load active image element into state
  useEffect(() => {
    if (!activeItem) {
      setBaseImgElement(null)
      return
    }

    let isMounted = true
    loadImageElement(activeItem.file)
      .then((img) => {
        if (isMounted) setBaseImgElement(img)
      })
      .catch(() => {
        if (isMounted) setBaseImgElement(null)
      })

    return () => {
      isMounted = false
    }
  }, [activeItem])

  // Re-render preview canvas whenever image, watermark config, logo or showOriginal changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !baseImgElement) return

    const fullW = baseImgElement.naturalWidth || baseImgElement.width
    const fullH = baseImgElement.naturalHeight || baseImgElement.height

    // Max preview canvas resolution to ensure 60fps responsiveness during drag
    const maxPreviewDim = 1920
    const previewScale = Math.min(1, maxPreviewDim / Math.max(fullW, fullH))
    const previewW = Math.round(fullW * previewScale)
    const previewH = Math.round(fullH * previewScale)

    const isJpeg = config.outputFormat === "jpeg"
    const fillBackground = isJpeg && (activeItem?.hasTransparency ?? false)

    if (showOriginal) {
      // Show clean original image
      canvas.width = previewW
      canvas.height = previewH
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, previewW, previewH)
        if (fillBackground) {
          ctx.fillStyle = config.backgroundColor || "#ffffff"
          ctx.fillRect(0, 0, previewW, previewH)
        }
        ctx.drawImage(baseImgElement, 0, 0, previewW, previewH)
      }
      setIsExceedingBounds(false)
      return
    }

    // Measure watermark size on full dimensions to check bounds
    try {
      const offscreen = document.createElement("canvas")
      const offCtx = offscreen.getContext("2d")
      if (offCtx) {
        let wW = 0
        let wH = 0
        if (config.type === "text") {
          const fontSize = calculateFontSizePx(fullW, fullH, config.textConfig.fontSizeRel)
          const m = measureMultilineText(offCtx, config.textConfig.text, fontSize, config.textConfig.fontFamily)
          wW = m.width
          wH = m.height
        } else if (logoImg) {
          const dims = calculateLogoDimensions(
            fullW,
            fullH,
            logoImg.naturalWidth || logoImg.width,
            logoImg.naturalHeight || logoImg.height,
            config.imageConfig.scaleRel
          )
          wW = dims.width
          wH = dims.height
        }

        const box = resolveWatermarkPosition(fullW, fullH, wW, wH, config)
        const exceeds =
          box.centerX - wW / 2 < 0 ||
          box.centerX + wW / 2 > fullW ||
          box.centerY - wH / 2 < 0 ||
          box.centerY + wH / 2 > fullH ||
          wW > fullW ||
          wH > fullH

        setIsExceedingBounds(exceeds)
      }
    } catch {
      setIsExceedingBounds(false)
    }

    // Draw full composition onto preview canvas
    drawFullComposition(canvas, baseImgElement, config, logoImg, {
      targetWidth: previewW,
      targetHeight: previewH,
      fillBackground,
      backgroundColor: config.backgroundColor || "#ffffff",
    })
  }, [baseImgElement, config, logoImg, showOriginal, activeItem])

  // Drag interaction math: converts client coordinates to relative (0.0 to 1.0)
  const updateDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      const xRel = Math.max(0.02, Math.min(0.98, x / rect.width))
      const yRel = Math.max(0.02, Math.min(0.98, y / rect.height))

      onCustomPositionChange({
        xRel: parseFloat(xRel.toFixed(3)),
        yRel: parseFloat(yRel.toFixed(3)),
      })
    },
    [onCustomPositionChange]
  )

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (config.mode === "repeated") return
    setIsDragging(true)
    updateDragPosition(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      updateDragPosition(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (config.mode === "repeated") return
    if (e.touches.length === 1) {
      setIsDragging(true)
      updateDragPosition(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDragging && e.touches.length === 1) {
      updateDragPosition(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  if (!activeItem || !baseImgElement) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
        <p>Seleccioná una imagen del lote para ver la vista previa en tiempo real.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vista previa interactiva
          </span>
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
            {baseImgElement.naturalWidth} × {baseImgElement.naturalHeight} px
          </span>
          {activeItem.hasTransparency && (
            <span className="inline-flex items-center rounded-md bg-violet-50 text-brand px-2 py-0.5 text-xs font-medium">
              Transparencia alfa
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle button */}
          <button
            type="button"
            onClick={() => setZoomMode((prev) => (prev === "fit" ? "actual" : "fit"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors btn-tactile"
            title={zoomMode === "fit" ? "Ver tamaño completo (100%)" : "Ajustar al contenedor"}
          >
            {zoomMode === "fit" ? (
              <>
                <ZoomIn className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">100%</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Ajustar</span>
              </>
            )}
          </button>

          {/* Toggle Before/After original image */}
          <button
            type="button"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all btn-tactile ${
              showOriginal
                ? "border-brand bg-brand text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {showOriginal ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Original</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                <span>Mantener para ver original</span>
              </>
            )}
          </button>

          {/* Download active image */}
          {onDownloadActive && (
            <button
              type="button"
              onClick={onDownloadActive}
              disabled={isDownloadingActive}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white px-3 py-1.5 text-xs font-semibold transition-all shadow-xs btn-tactile disabled:opacity-50"
              title="Descargar esta imagen individual con la marca de agua"
            >
              {isDownloadingActive ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar foto</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Warning if watermark exceeds bounds */}
      {isExceedingBounds && !showOriginal && config.mode === "single" && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Atención:</strong> La marca de agua excede o queda cerca del borde de la imagen. Podés arrastrarla para corregir su posición o reducir su escala/margen.
          </span>
        </div>
      )}

      {/* Canvas viewport container */}
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center overflow-auto rounded-xl bg-slate-900/5 p-2 sm:p-4 min-h-[340px] max-h-[580px] ${
          zoomMode === "actual" ? "cursor-grab" : ""
        }`}
        style={{
          backgroundImage:
            "radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      >
        <div className="relative inline-block max-w-full">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`block rounded-lg shadow-md transition-shadow select-none ${
              config.mode === "single"
                ? isDragging
                  ? "cursor-grabbing shadow-xl ring-2 ring-brand"
                  : "cursor-crosshair hover:ring-1 hover:ring-brand/50"
                : "cursor-default"
            } ${zoomMode === "fit" ? "max-h-[520px] max-w-full w-auto h-auto object-contain" : ""}`}
            style={{
              touchAction: "none",
            }}
          />

          {/* Drag instruction overlay badge */}
          {config.mode === "single" && !showOriginal && (
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-slate-900/75 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-white shadow-xs">
              <Move className="h-3 w-3 text-brand-light" />
              <span>Arrastrá con el mouse o dedo para ubicar la marca</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Archivo activo: <strong className="text-slate-700">{activeItem.originalName}</strong></span>
        <span>Modo: <strong className="text-slate-700">{config.mode === "single" ? "Marca única" : "Patrón repetido"}</strong></span>
      </div>
    </div>
  )
}
