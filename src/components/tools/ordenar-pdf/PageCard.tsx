"use client"

import React from "react"
import { motion } from "motion/react"
import {
  RotateCw,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Check,
  Camera,
} from "lucide-react"
import { DocumentPage } from "@/lib/pdf-editor/types"

interface PageCardProps {
  page: DocumentPage
  currentIndex: number
  totalCount: number
  isSelected: boolean
  onToggleSelect: (pageId: string) => void
  onRotateCw: (pageId: string) => void
  onRotateCcw: (pageId: string) => void
  onMoveLeft: (pageId: string) => void
  onMoveRight: (pageId: string) => void
  onDelete: (pageId: string) => void
  onZoom: (page: DocumentPage) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging?: boolean
}

// Color badges for multiple merged files
const SOURCE_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", border: "border-violet-200" },
  { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  { bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500", border: "border-cyan-200" },
]

export function PageCard({
  page,
  currentIndex,
  totalCount,
  isSelected,
  onToggleSelect,
  onRotateCw,
  onRotateCcw,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onZoom,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging = false,
}: PageCardProps) {
  const colorTheme = SOURCE_COLORS[page.sourceFileColorIndex % SOURCE_COLORS.length]
  const totalRotation = ((page.customRotation % 360) + 360) % 360

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, currentIndex)}
      onDragOver={(e) => onDragOver(e, currentIndex)}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-200 bg-white select-none ${
        isSelected
          ? "border-violet-600 ring-2 ring-violet-500/30 shadow-md shadow-violet-600/10"
          : "border-gray-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5"
      } ${isDragging ? "opacity-40 scale-95" : "opacity-100"}`}
    >
      {/* Header bar de la tarjeta */}
      <div className="flex items-center justify-between p-2.5 border-b border-gray-100">
        {/* Checkbox de selección accesible */}
        <button
          type="button"
          onClick={() => onToggleSelect(page.id)}
          aria-label={`Seleccionar página ${currentIndex + 1}`}
          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
            isSelected
              ? "bg-violet-600 border-violet-600 text-white shadow-xs"
              : "border-gray-300 bg-white hover:border-violet-500 text-transparent"
          }`}
        >
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </button>

        {/* Número de página orden actual */}
        <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full">
          {currentIndex + 1}
        </span>

        {/* Botón zoom / inspeccionar */}
        <button
          type="button"
          onClick={() => onZoom(page)}
          aria-label={`Ampliar vista de la página ${currentIndex + 1}`}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Área del Thumbnail visual */}
      <div
        onClick={() => onToggleSelect(page.id)}
        className="relative flex-1 cursor-pointer overflow-hidden p-3 bg-gray-50 flex items-center justify-center min-h-[170px]"
      >
        {page.thumbnailUrl ? (
          <div
            style={{
              transform: `rotate(${totalRotation}deg)`,
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className="relative flex items-center justify-center shadow-xs rounded bg-white max-h-[150px] overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.thumbnailUrl}
              alt={`Miniatura página ${currentIndex + 1}`}
              className="max-h-[150px] w-auto object-contain pointer-events-none"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 text-xs py-8 space-y-2">
            <div className="h-6 w-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            <span>Generando vista...</span>
          </div>
        )}

        {/* Badges sobre la imagen */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {page.isScanned && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              <Camera className="h-2.5 w-2.5" /> Escaneada
            </span>
          )}
          {totalRotation !== 0 && (
            <span className="inline-flex items-center rounded bg-violet-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
              {totalRotation}°
            </span>
          )}
        </div>
      </div>

      {/* Origen del archivo */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-white flex items-center justify-between text-[11px] text-gray-500">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${colorTheme.bg} ${colorTheme.text} font-medium truncate max-w-[150px]`}
          title={`${page.sourceFileName} (Pág. original ${page.displayPageNumber})`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${colorTheme.dot}`} />
          <span className="truncate">{page.sourceFileName}</span>
        </span>
        <span className="text-[10px] text-gray-400 shrink-0">
          orig. p.{page.displayPageNumber}
        </span>
      </div>

      {/* Barra de Controles Rápidos (Táctil y ratón) */}
      <div className="grid grid-cols-5 border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/50 rounded-b-2xl">
        {/* Mover hacia atrás */}
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => onMoveLeft(page.id)}
          aria-label={`Mover página ${currentIndex + 1} hacia la izquierda`}
          className="flex h-9 items-center justify-center text-gray-500 hover:text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Mover antes"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Rotar izquierda (-90°) */}
        <button
          type="button"
          onClick={() => onRotateCcw(page.id)}
          aria-label={`Rotar página ${currentIndex + 1} 90 grados a la izquierda`}
          className="flex h-9 items-center justify-center text-gray-500 hover:text-violet-700 hover:bg-violet-50 transition-colors"
          title="Rotar antihorario (-90°)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Rotar derecha (+90°) */}
        <button
          type="button"
          onClick={() => onRotateCw(page.id)}
          aria-label={`Rotar página ${currentIndex + 1} 90 grados a la derecha`}
          className="flex h-9 items-center justify-center text-gray-500 hover:text-violet-700 hover:bg-violet-50 transition-colors"
          title="Rotar horario (+90°)"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>

        {/* Mover hacia adelante */}
        <button
          type="button"
          disabled={currentIndex === totalCount - 1}
          onClick={() => onMoveRight(page.id)}
          aria-label={`Mover página ${currentIndex + 1} hacia la derecha`}
          className="flex h-9 items-center justify-center text-gray-500 hover:text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Mover después"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Eliminar página */}
        <button
          type="button"
          onClick={() => onDelete(page.id)}
          aria-label={`Eliminar página ${currentIndex + 1}`}
          className="flex h-9 items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Quitar página"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
