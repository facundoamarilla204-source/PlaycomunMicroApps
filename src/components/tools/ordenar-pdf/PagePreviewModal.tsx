"use client"

import React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  RotateCw,
  RotateCcw,
  Trash2,
  FileText,
} from "lucide-react"
import { DocumentPage } from "@/lib/pdf-editor/types"

interface PagePreviewModalProps {
  page: DocumentPage | null
  currentIndex: number
  totalCount: number
  onClose: () => void
  onRotateCw: (pageId: string) => void
  onRotateCcw: (pageId: string) => void
  onDelete: (pageId: string) => void
}

export function PagePreviewModal({
  page,
  currentIndex,
  totalCount,
  onClose,
  onRotateCw,
  onRotateCcw,
  onDelete,
}: PagePreviewModalProps) {
  if (!page) return null

  const totalRotation = ((page.customRotation % 360) + 360) % 360

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl rounded-2xl bg-gray-900 border border-gray-800 text-white overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/90">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
                {currentIndex + 1}
              </span>
              <div>
                <h4 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                  Página {currentIndex + 1} de {totalCount}
                </h4>
                <p className="text-[11px] text-gray-400">
                  Archivo de origen: {page.sourceFileName} (pág. {page.displayPageNumber})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image Display */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-950/60 min-h-[300px]">
            {page.thumbnailUrl ? (
              <div
                style={{
                  transform: `rotate(${totalRotation}deg)`,
                  transition: "transform 0.25s ease-out",
                }}
                className="max-h-[60vh] max-w-full flex items-center justify-center shadow-2xl rounded-lg bg-white overflow-hidden p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.thumbnailUrl}
                  alt={`Vista completa de la página ${currentIndex + 1}`}
                  className="max-h-[58vh] max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Cargando miniatura...</div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRotateCcw(page.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> Rotar antihorario
              </button>

              <button
                type="button"
                onClick={() => onRotateCw(page.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
              >
                <RotateCw className="h-4 w-4" /> Rotar horario
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(page.id)
                  onClose()
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Eliminar página
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-medium text-white transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
