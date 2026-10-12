"use client"

import React from "react"
import { FileItem } from "@/lib/converter/types"
import { formatBytes } from "@/lib/converter/utils"
import {
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

interface FileListProps {
  files: FileItem[]
  onRemoveFile: (id: string) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  allowReorder?: boolean
  disabled?: boolean
}

export function FileList({
  files,
  onRemoveFile,
  onMoveUp,
  onMoveDown,
  allowReorder = false,
  disabled = false,
}: FileListProps) {
  if (files.length === 0) return null

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 px-1">
        <span>Archivos seleccionados ({files.length})</span>
        {allowReorder && files.length > 1 && (
          <span>Podés ordenar el orden de las páginas</span>
        )}
      </div>

      <div className="space-y-2">
        {files.map((item, index) => {
          return (
            <div
              key={item.id}
              className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatBytes(item.size)}</span>
                      {item.pageCount && (
                        <span>· {item.pageCount} {item.pageCount === 1 ? "página" : "páginas"}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {allowReorder && (
                    <div className="flex items-center mr-1">
                      <button
                        type="button"
                        onClick={() => onMoveUp && onMoveUp(index)}
                        disabled={disabled || index === 0}
                        aria-label="Mover hacia arriba"
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveDown && onMoveDown(index)}
                        disabled={disabled || index === files.length - 1}
                        aria-label="Mover hacia abajo"
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Status Indicator */}
                  {item.status === "processing" && (
                    <span className="flex items-center gap-1.5 text-xs text-violet-700 font-semibold px-2 py-1 bg-violet-50 rounded-md">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{item.progress > 0 ? `${item.progress}%` : "Procesando"}</span>
                    </span>
                  )}

                  {item.status === "completed" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-md">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Listo</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveFile(item.id)}
                    disabled={disabled}
                    aria-label={`Quitar archivo ${item.name}`}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar during processing */}
              {item.status === "processing" && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.progress, 5)}%` }}
                  />
                </div>
              )}

              {/* Error message */}
              {item.status === "error" && item.error && (
                <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{item.error}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
