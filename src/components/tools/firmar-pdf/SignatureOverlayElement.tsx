"use client"

import React, { useRef, useState, useEffect } from "react"
import { Trash2, Copy, Layers, Maximize2 } from "lucide-react"
import { SignatureElement } from "@/lib/pdf-sign/types"

interface SignatureOverlayElementProps {
  element: SignatureElement
  isSelected: boolean
  containerWidth: number // Current display pixel width of the canvas
  containerHeight: number // Current display pixel height of the canvas
  onSelect: () => void
  onUpdate: (updated: Partial<SignatureElement>) => void
  onDelete: () => void
  onDuplicate: () => void
  onOpenMultiPage: () => void
}

export function SignatureOverlayElement({
  element,
  isSelected,
  containerWidth,
  containerHeight,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onOpenMultiPage,
}: SignatureOverlayElementProps) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const isResizingRef = useRef<boolean>(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
  })
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initialW: number; initialH: number }>({
    mouseX: 0,
    mouseY: 0,
    initialW: 0,
    initialH: 0,
  })

  // Pixel dimensions relative to visual canvas display
  const pixelX = element.x * containerWidth
  const pixelY = element.y * containerHeight
  const pixelW = Math.max(30, element.width * containerWidth)
  const pixelH = Math.max(20, element.height * containerHeight)

  // Keyboard navigation when selected
  useEffect(() => {
    if (!isSelected) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }

      const stepPx = e.shiftKey ? 10 : 2
      const stepRelX = stepPx / containerWidth
      const stepRelY = stepPx / containerHeight

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onUpdate({ x: Math.max(0, element.x - stepRelX) })
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        onUpdate({ x: Math.min(1 - element.width, element.x + stepRelX) })
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        onUpdate({ y: Math.max(0, element.y - stepRelY) })
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        onUpdate({ y: Math.min(1 - element.height, element.y + stepRelY) })
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        onDelete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isSelected, element, containerWidth, containerHeight, onUpdate, onDelete])

  // DRAG HANDLERS
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    // Only drag with primary click/touch
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect()

    isDraggingRef.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: element.x,
      initialY: element.y,
    }
  }

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()
    e.preventDefault()

    const deltaX = (e.clientX - dragStartRef.current.mouseX) / containerWidth
    const deltaY = (e.clientY - dragStartRef.current.mouseY) / containerHeight

    const nextX = Math.max(0, Math.min(1 - element.width, dragStartRef.current.initialX + deltaX))
    const nextY = Math.max(0, Math.min(1 - element.height, dragStartRef.current.initialY + deltaY))

    onUpdate({ x: nextX, y: nextY })
  }

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()
    isDraggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // RESIZE HANDLER (Preserves aspect ratio)
  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation()
    isResizingRef.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialW: element.width,
      initialH: element.height,
    }
  }

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return
    e.stopPropagation()
    e.preventDefault()

    const deltaX = (e.clientX - resizeStartRef.current.mouseX) / containerWidth
    const newWidth = Math.max(0.04, Math.min(1 - element.x, resizeStartRef.current.initialW + deltaX))

    // Calculate height according to aspect ratio and container dimensions
    // Aspect ratio = visualWidthPx / visualHeightPx
    const newWidthPx = newWidth * containerWidth
    const newHeightPx = newWidthPx / Math.max(0.1, element.aspectRatio)
    const newHeight = Math.min(1 - element.y, newHeightPx / containerHeight)

    onUpdate({ width: newWidth, height: newHeight })
  }

  const handlePointerUpResize = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return
    e.stopPropagation()
    isResizingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  return (
    <div
      ref={elementRef}
      onPointerDown={handlePointerDownDrag}
      onPointerMove={handlePointerMoveDrag}
      onPointerUp={handlePointerUpDrag}
      onPointerCancel={handlePointerUpDrag}
      className={`absolute cursor-move select-none group touch-none ${
        isSelected
          ? "ring-2 ring-brand ring-offset-1 shadow-md bg-purple-50/20"
          : "hover:ring-1 hover:ring-brand/40"
      }`}
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${pixelW}px`,
        height: `${pixelH}px`,
      }}
      tabIndex={0}
      role="button"
      aria-label={`Elemento ${element.type} seleccionado`}
    >
      {/* Imagen real del elemento con fondo transparente */}
      <img
        src={element.dataUrl}
        alt={element.title || "Elemento de firma"}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* BARRA DE HERRAMIENTAS FLOTANTE CONTEXTUAL CUANDO ESTÁ SELECCIONADO */}
      {isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 bg-slate-900 text-white rounded-xl shadow-lg text-[11px] font-semibold whitespace-nowrap animate-in fade-in"
        >
          {/* Duplicar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors flex items-center gap-1"
            title="Duplicar en esta página"
            aria-label="Duplicar elemento"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          {/* Aplicar a otras páginas */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenMultiPage()
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors flex items-center gap-1"
            title="Repetir en otras páginas"
            aria-label="Repetir en otras páginas"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Otras páginas</span>
          </button>

          <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

          {/* Eliminar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 hover:bg-rose-600 rounded-lg text-rose-300 hover:text-white transition-colors flex items-center gap-1"
            title="Eliminar elemento"
            aria-label="Eliminar elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitar</span>
          </button>
        </div>
      )}

      {/* MANIJA DE REDIMENSIONADO EN ESQUINA INFERIOR DERECHA */}
      {isSelected && (
        <div
          onPointerDown={handlePointerDownResize}
          onPointerMove={handlePointerMoveResize}
          onPointerUp={handlePointerUpResize}
          onPointerCancel={handlePointerUpResize}
          className="absolute -right-2 -bottom-2 w-5 h-5 rounded-full bg-brand text-white border-2 border-white shadow-md flex items-center justify-center cursor-nwse-resize z-20 hover:scale-125 transition-transform"
          title="Arrastrar para cambiar tamaño"
          aria-label="Cambiar tamaño"
        >
          <Maximize2 className="w-2.5 h-2.5 rotate-90" />
        </div>
      )}
    </div>
  )
}
