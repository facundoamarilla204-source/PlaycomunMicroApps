"use client"

import React from "react"
import { ImageItem } from "@/lib/image-processor/types"
import {
  formatBytes,
  formatPercentDiff,
  getFormatBadgeLabel,
} from "@/lib/image-processor/utils"
import {
  Download,
  Trash2,
  RefreshCw,
  Eye,
  AlertCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  Check,
} from "lucide-react"

interface ImageCardProps {
  item: ImageItem
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  onOpenCompare: (item: ImageItem) => void
  isProcessingBatch: boolean
}

export function ImageCard({
  item,
  onRemove,
  onRetry,
  onOpenCompare,
  isProcessingBatch,
}: ImageCardProps) {
  const isCompleted = item.status === "completed" && !!item.result
  const isError = item.status === "error"
  const isProcessing = item.status === "processing"
  const isPending = item.status === "pending"

  const diff = isCompleted ? formatPercentDiff(item.result!.percentDiff) : null
  const wasResized =
    isCompleted &&
    (item.originalWidth !== item.result!.width ||
      item.originalHeight !== item.result!.height)

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-white shadow-xs hover:border-brand/40 transition-all duration-200">
      {/* 1. Left: Thumbnail & File Info */}
      <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
        {/* Thumbnail with checkerboard for transparency */}
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl overflow-hidden border border-border bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] bg-[size:10px_10px] flex items-center justify-center">
          <img
            src={isCompleted ? item.result!.downloadUrl : item.previewUrl}
            alt={item.originalName}
            className="h-full w-full object-cover"
          />
          {item.hasTransparency && (
            <span
              title="Imagen con canal alfa transparente"
              className="absolute bottom-1 right-1 text-[9px] font-bold bg-neutral-900/80 text-white px-1 py-0.2 rounded"
            >
              Alpha
            </span>
          )}
        </div>

        {/* Name and Format tags */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-[240px]"
              title={item.originalName}
            >
              {item.originalName}
            </h4>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
              {getFormatBadgeLabel(item.originalFormat)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground-subtle mt-1 flex-wrap">
            <span>{formatBytes(item.originalSize)}</span>
            <span>•</span>
            <span>
              {item.originalWidth} × {item.originalHeight} px
            </span>

            {/* Status indicators */}
            {isPending && (
              <span className="text-neutral-500 font-medium ml-1">
                (Pendiente)
              </span>
            )}
            {isProcessing && (
              <span className="inline-flex items-center gap-1 text-brand font-medium ml-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Procesando...
              </span>
            )}
            {isError && (
              <span className="text-red-600 font-medium ml-1">
                (Error en proceso)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle: Results Metrics when Completed */}
      {isCompleted && item.result && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 w-full sm:w-auto py-2 sm:py-0 border-y sm:border-y-0 border-border/60">
          {/* Format change indicator */}
          <div className="flex flex-col text-xs">
            <span className="text-foreground-subtle text-[11px]">Formato</span>
            <div className="flex items-center gap-1 font-semibold text-foreground mt-0.5">
              <span>{getFormatBadgeLabel(item.originalFormat)}</span>
              <span>→</span>
              <span className="text-brand">
                {getFormatBadgeLabel(item.result.extension)}
              </span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="flex flex-col text-xs">
            <span className="text-foreground-subtle text-[11px]">Dimensiones</span>
            <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
              <span>
                {item.result.width} × {item.result.height}
              </span>
              {wasResized && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-medium">
                  Redim.
                </span>
              )}
            </div>
          </div>

          {/* Real Weight & Savings */}
          <div className="flex flex-col text-xs">
            <span className="text-foreground-subtle text-[11px]">Peso final</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-foreground">
                {formatBytes(item.result.size)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  item.result.bytesSaved > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : item.result.bytesSaved < 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {item.result.bytesSaved > 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : item.result.bytesSaved < 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {diff?.text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error detail */}
      {isError && (
        <div className="w-full sm:w-auto flex-1 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span className="truncate">{item.errorMessage || "No se pudo procesar"}</span>
        </div>
      )}

      {/* 3. Right: Action Buttons */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1 sm:pt-0">
        {/* Before/After Visual Comparison */}
        {isCompleted && (
          <button
            type="button"
            onClick={() => onOpenCompare(item)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Comparar imagen original con el resultado"
            aria-label={`Comparar imagen antes y después para ${item.originalName}`}
          >
            <Eye className="h-3.5 w-3.5 text-brand" />
            <span>Comparar</span>
          </button>
        )}

        {/* Single File Download */}
        {isCompleted && item.result && (
          <a
            href={item.result.downloadUrl}
            download={item.result.fileName}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title={`Descargar ${item.result.fileName}`}
            aria-label={`Descargar ${item.result.fileName}`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar</span>
          </a>
        )}

        {/* Retry Button */}
        {(isError || isCompleted) && (
          <button
            type="button"
            disabled={isProcessingBatch}
            onClick={() => onRetry(item.id)}
            className="p-2 rounded-xl text-foreground-subtle hover:text-foreground hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-40"
            title="Volver a procesar este archivo"
            aria-label={`Reintentar procesamiento para ${item.originalName}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}

        {/* Remove Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onRemove(item.id)}
          className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30"
          title="Quitar imagen del lote"
          aria-label={`Quitar ${item.originalName} de la lista`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
