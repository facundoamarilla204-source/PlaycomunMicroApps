"use client"

import React, { useState } from "react"
import { DocumentPage } from "@/lib/pdf-editor/types"
import { PageCard } from "./PageCard"
import { Layers } from "lucide-react"

interface PageGridProps {
  pages: DocumentPage[]
  selectedIds: Set<string>
  onToggleSelect: (pageId: string) => void
  onRotateCw: (pageId: string) => void
  onRotateCcw: (pageId: string) => void
  onMoveLeft: (pageId: string) => void
  onMoveRight: (pageId: string) => void
  onDelete: (pageId: string) => void
  onZoom: (page: DocumentPage) => void
  onReorder: (sourceIndex: number, targetIndex: number) => void
}

export function PageGrid({
  pages,
  selectedIds,
  onToggleSelect,
  onRotateCw,
  onRotateCcw,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onZoom,
  onReorder,
}: PageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      return
    }
    onReorder(draggedIndex, targetIndex)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
        <Layers className="h-12 w-12 text-gray-400 mb-3" />
        <h4 className="text-base font-semibold text-gray-700">No hay páginas activas</h4>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Cargá un documento PDF o escaneá una página con tu cámara para comenzar a organizar.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Grid responsivo con espaciado generoso */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {pages.map((page, index) => (
          <div
            key={page.id}
            onDrop={(e) => handleDrop(e, index)}
            className="transition-transform duration-150"
          >
            <PageCard
              page={page}
              currentIndex={index}
              totalCount={pages.length}
              isSelected={selectedIds.has(page.id)}
              onToggleSelect={onToggleSelect}
              onRotateCw={onRotateCw}
              onRotateCcw={onRotateCcw}
              onMoveLeft={onMoveLeft}
              onMoveRight={onMoveRight}
              onDelete={onDelete}
              onZoom={onZoom}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
