"use client"

import React, { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, FileCheck, Layers } from "lucide-react"
import { PdfPageInfo, SignatureElement } from "@/lib/pdf-sign/types"
import { renderPageThumbnail } from "@/lib/pdf-sign/sign-engine"

interface PageNavigationRailProps {
  pages: PdfPageInfo[]
  currentPageIndex: number
  elements: SignatureElement[]
  arrayBuffer: ArrayBuffer
  onSelectPage: (index: number) => void
}

export function PageNavigationRail({
  pages,
  currentPageIndex,
  elements,
  arrayBuffer,
  onSelectPage,
}: PageNavigationRailProps) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})

  // Progressive thumbnail rendering
  useEffect(() => {
    let isCancelled = false

    const loadThumbnails = async () => {
      // Find pages without thumbnails yet
      for (const page of pages) {
        if (thumbnails[page.pageIndex]) continue

        try {
          const thumbUrl = await renderPageThumbnail(arrayBuffer, page.pageIndex, 120)
          if (!isCancelled) {
            setThumbnails((prev) => ({ ...prev, [page.pageIndex]: thumbUrl }))
          }
        } catch {
          // Thumbnail error fallback
        }
      }
    }

    loadThumbnails()

    return () => {
      isCancelled = true
    }
  }, [pages, arrayBuffer, thumbnails])

  // Count elements per page
  const getElementsCountOnPage = (pageIndex: number): number => {
    return elements.filter((el) => el.pageIndex === pageIndex).length
  }

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      onSelectPage(currentPageIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      onSelectPage(currentPageIndex + 1)
    }
  }

  return (
    <div className="flex flex-col bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 space-y-3">
      {/* Selector rápido y paginador */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand" />
          Páginas ({pages.length})
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPageIndex === 0}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Página anterior"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            {currentPageIndex + 1} / {pages.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentPageIndex === pages.length - 1}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Página siguiente"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de miniaturas de páginas */}
      <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[500px] scrollbar-thin pb-2 lg:pb-0">
        {pages.map((page) => {
          const isCurrent = page.pageIndex === currentPageIndex
          const count = getElementsCountOnPage(page.pageIndex)
          const thumb = thumbnails[page.pageIndex]

          return (
            <button
              key={page.pageIndex}
              type="button"
              onClick={() => onSelectPage(page.pageIndex)}
              className={`group flex lg:flex-col items-center gap-2 p-2 rounded-xl text-left border transition-all shrink-0 min-h-[44px] ${
                isCurrent
                  ? "border-brand bg-white ring-2 ring-brand/20 shadow-xs"
                  : "border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300"
              }`}
            >
              {/* Miniatura visual */}
              <div className="w-14 h-20 sm:w-16 sm:h-22 bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`Página ${page.displayPageNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                )}

                {/* Badge de elementos colocados */}
                {count > 0 && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center shadow-2xs">
                    {count}
                  </div>
                )}
              </div>

              {/* Número y estado */}
              <div className="flex lg:flex-row items-center justify-between w-full text-[11px] font-medium text-slate-600">
                <span>Pág. {page.displayPageNumber}</span>
                {count > 0 && (
                  <span className="hidden lg:inline-flex text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {count} {count === 1 ? "firma" : "firmas"}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
