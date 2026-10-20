"use client"

import React, { useRef, useEffect, useState } from "react"
import { SignatureElement, PdfPageInfo } from "@/lib/pdf-sign/types"
import { renderPdfPageToCanvas } from "@/lib/pdf-sign/sign-engine"
import { SignatureOverlayElement } from "./SignatureOverlayElement"

interface PdfCanvasEditorProps {
  arrayBuffer: ArrayBuffer
  currentPageInfo: PdfPageInfo
  elements: SignatureElement[]
  selectedElementId: string | null
  zoomScale: number
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updated: Partial<SignatureElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onOpenMultiPage: (element: SignatureElement) => void
}

export function PdfCanvasEditor({
  arrayBuffer,
  currentPageInfo,
  elements,
  selectedElementId,
  zoomScale,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onOpenMultiPage,
}: PdfCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [renderedSize, setRenderedSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })
  const [isRendering, setIsRendering] = useState<boolean>(true)

  // Render active PDF page to canvas
  useEffect(() => {
    let isCancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    setIsRendering(true)

    renderPdfPageToCanvas(
      arrayBuffer,
      currentPageInfo.pageIndex,
      canvas,
      zoomScale
    )
      .then((size) => {
        if (!isCancelled) {
          setRenderedSize(size)
          setIsRendering(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsRendering(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [arrayBuffer, currentPageInfo.pageIndex, zoomScale])

  // Elements that belong to current active page
  const pageElements = elements.filter(
    (el) => el.pageIndex === currentPageInfo.pageIndex
  )

  const handleContainerClick = (e: React.MouseEvent) => {
    // If clicking on the background (not an element), deselect
    if (e.target === containerRef.current || e.target === canvasRef.current) {
      onSelectElement(null)
    }
  }

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4 overflow-auto scrollbar-thin">
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative bg-white shadow-xl rounded-lg border border-slate-300 transition-all mx-auto"
        style={{
          width: renderedSize.width > 0 ? `${renderedSize.width}px` : "auto",
          height: renderedSize.height > 0 ? `${renderedSize.height}px` : "auto",
        }}
      >
        {/* LIENZO PDF RENDERIZADO POR PDF.JS */}
        <canvas ref={canvasRef} className="block rounded-lg" />

        {/* INDICADOR DE CARGA DE PÁGINA */}
        {isRendering && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center rounded-lg z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-600">
                Cargando página {currentPageInfo.displayPageNumber}...
              </span>
            </div>
          </div>
        )}

        {/* CAPA DE ELEMENTOS DE FIRMA INTERACTIVOS */}
        {renderedSize.width > 0 && (
          <div
            className="absolute inset-0 pointer-events-auto overflow-hidden rounded-lg"
            style={{ width: `${renderedSize.width}px`, height: `${renderedSize.height}px` }}
          >
            {pageElements.map((el) => (
              <SignatureOverlayElement
                key={el.id}
                element={el}
                isSelected={selectedElementId === el.id}
                containerWidth={renderedSize.width}
                containerHeight={renderedSize.height}
                onSelect={() => onSelectElement(el.id)}
                onUpdate={(updated) => onUpdateElement(el.id, updated)}
                onDelete={() => onDeleteElement(el.id)}
                onDuplicate={() => onDuplicateElement(el.id)}
                onOpenMultiPage={() => onOpenMultiPage(el)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
