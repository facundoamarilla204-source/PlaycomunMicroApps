"use client"

import React, { useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  FileText,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Layers,
  ArrowUpDown,
} from "lucide-react"
import { LoadedPdfFile } from "@/lib/pdf-editor/types"
import { formatBytes } from "@/lib/pdf-editor/pdf-engine"

interface SourceFilesModalProps {
  isOpen: boolean
  onClose: () => void
  files: LoadedPdfFile[]
  onReorderFiles: (fromIndex: number, toIndex: number) => void
  onRemoveFile: (fileId: string) => void
  onAddFiles: (files: FileList | File[]) => void
}

export function SourceFilesModal({
  isOpen,
  onClose,
  files,
  onReorderFiles,
  onRemoveFile,
  onAddFiles,
}: SourceFilesModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Archivos PDF cargados
                </h3>
                <p className="text-xs text-gray-500">
                  Modificá el orden global de los documentos para combinar
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List of files */}
          <div className="p-6 overflow-y-auto space-y-3 divide-y divide-gray-100">
            {files.map((file, idx) => (
              <div
                key={file.id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.pageCount} {file.pageCount === 1 ? "página" : "páginas"} • {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onReorderFiles(idx, idx - 1)}
                    aria-label={`Mover ${file.name} hacia arriba`}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-20"
                    title="Mover arriba"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={idx === files.length - 1}
                    onClick={() => onReorderFiles(idx, idx + 1)}
                    aria-label={`Mover ${file.name} hacia abajo`}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-20"
                    title="Mover abajo"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Remove file */}
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    aria-label={`Quitar archivo ${file.name}`}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    title="Quitar archivo del lote"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddFiles(e.target.files)
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium text-xs hover:border-violet-500 hover:text-violet-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Añadir más PDFs
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-xs hover:bg-violet-700 transition-colors shadow-sm"
            >
              Aplicar y volver a la mesa
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
