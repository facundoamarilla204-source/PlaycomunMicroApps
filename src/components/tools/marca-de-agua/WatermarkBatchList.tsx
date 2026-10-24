"use client"

import React, { useRef } from "react"
import {
  WatermarkImageItem,
} from "@/lib/watermark/types"
import { formatBytes } from "@/lib/watermark/layout"
import {
  Download,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileArchive,
  RefreshCw,
} from "lucide-react"

interface WatermarkBatchListProps {
  items: WatermarkImageItem[]
  activeId: string | null
  onSelectActive: (id: string) => void
  onRemoveItem: (id: string) => void
  onClearAll: () => void
  onAddFiles: (files: File[]) => void
  onProcessBatch: () => void
  onProcessSingle: (id: string) => void
  onDownloadSingle: (item: WatermarkImageItem) => void
  onDownloadZip: () => void
  isProcessingBatch: boolean
  batchProgress: number
}

export function WatermarkBatchList({
  items,
  activeId,
  onSelectActive,
  onRemoveItem,
  onClearAll,
  onAddFiles,
  onProcessBatch,
  onProcessSingle,
  onDownloadSingle,
  onDownloadZip,
  isProcessingBatch,
  batchProgress,
}: WatermarkBatchListProps) {
  const addFilesInputRef = useRef<HTMLInputElement>(null)

  const completedCount = items.filter((i) => i.status === "completed").length
  const hasCompleted = completedCount > 0

  const handleAddFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"))
      onAddFiles(files)
      e.target.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <input
        ref={addFilesInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAddFilesChange}
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">
            Lote de imágenes ({items.length})
          </h3>
          {completedCount > 0 && (
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
              {completedCount} listas para descargar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addFilesInputRef.current?.click()}
            disabled={isProcessingBatch}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors btn-tactile disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Agregar fotos</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessingBatch}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors btn-tactile disabled:opacity-50"
            title="Quitar todas las imágenes"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when running batch */}
      {isProcessingBatch && (
        <div className="space-y-1.5 p-3 rounded-xl bg-violet-50/70 border border-violet-100">
          <div className="flex items-center justify-between text-xs font-medium text-brand">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Procesando marca de agua en alta resolución...
            </span>
            <span className="font-mono">{Math.round(batchProgress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-violet-200/60">
            <div
              className="h-full bg-brand transition-all duration-200 ease-out"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* List of images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item) => {
          const isActive = item.id === activeId

          return (
            <div
              key={item.id}
              onClick={() => onSelectActive(item.id)}
              className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "border-brand bg-brand-light/30 ring-1 ring-brand shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50"
              }`}
            >
              {/* Thumbnail */}
              <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.originalName}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {item.originalWidth} × {item.originalHeight} px • {formatBytes(item.originalSize)}
                </p>

                {/* Status indicator badge */}
                <div className="mt-1 flex items-center gap-1.5">
                  {item.status === "completed" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Lista
                    </span>
                  )}
                  {item.status === "processing" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand">
                      <Loader2 className="h-3 w-3 animate-spin text-brand" />
                      Procesando
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                      <Clock className="h-3 w-3 text-amber-600" />
                      Pendiente
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700" title={item.errorMessage}>
                      <AlertCircle className="h-3 w-3 text-rose-600" />
                      Error
                    </span>
                  )}
                </div>
              </div>

              {/* Item actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onDownloadSingle(item)}
                  disabled={isProcessingBatch || item.status === "processing"}
                  className="p-1.5 text-slate-600 hover:text-brand hover:bg-brand-light rounded-lg transition-colors disabled:opacity-50"
                  title="Descargar esta imagen individual"
                >
                  {item.status === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>

                {item.status === "error" && (
                  <button
                    type="button"
                    onClick={() => onProcessSingle(item.id)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Reintentar procesamiento"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isProcessingBatch}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Eliminar del lote"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500 text-center sm:text-left">
          Hacé clic en cualquier foto para previsualizar y ajustar la marca de agua antes de procesar.
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
          {/* Process Batch CTA */}
          <button
            type="button"
            onClick={onProcessBatch}
            disabled={isProcessingBatch || items.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white px-5 py-2.5 text-sm font-semibold shadow-xs transition-all btn-tactile disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingBatch ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Aplicar a todas las imágenes</span>
              </>
            )}
          </button>

          {/* Download ZIP CTA */}
          {hasCompleted && (
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={isProcessingBatch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 px-4 py-2.5 text-sm font-semibold shadow-2xs transition-all btn-tactile"
            >
              <FileArchive className="h-4 w-4 text-emerald-700" />
              <span>Descargar ZIP ({completedCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
