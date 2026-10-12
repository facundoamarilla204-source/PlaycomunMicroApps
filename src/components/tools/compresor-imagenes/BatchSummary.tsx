"use client"

import React, { useState } from "react"
import { BatchSummaryData, ImageItem } from "@/lib/image-processor/types"
import { formatBytes, formatPercentDiff } from "@/lib/image-processor/utils"
import { createAndDownloadZip } from "@/lib/image-processor/zip"
import {
  Archive,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Loader2,
} from "lucide-react"

interface BatchSummaryProps {
  summary: BatchSummaryData
  items: ImageItem[]
}

export function BatchSummary({ summary, items }: BatchSummaryProps) {
  const [zipping, setZipping] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)

  const {
    completedCount,
    errorCount,
    originalTotalBytes,
    finalTotalBytes,
    netSavingsBytes,
    netPercentDiff,
    isRealSaving,
  } = summary

  const diffFormatted = formatPercentDiff(netPercentDiff)

  const handleDownloadAllZip = async () => {
    if (completedCount === 0 || zipping) return
    setZipping(true)
    setZipError(null)

    try {
      await createAndDownloadZip(items)
    } catch (err: any) {
      setZipError(err?.message || "No se pudo generar el archivo ZIP")
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Resumen del lote
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted">
            {completedCount} {completedCount === 1 ? "imagen procesada con éxito" : "imágenes procesadas con éxito"}
            {errorCount > 0 && ` (${errorCount} con error)`}
          </p>
        </div>

        {/* Botón Descargar ZIP masivo */}
        {completedCount > 0 && (
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={zipping}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {zipping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generando ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                <span>Descargar todas en ZIP ({completedCount})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tarjetas de Métricas Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <span className="text-xs font-medium text-foreground-subtle">
            Peso original acumulado
          </span>
          <span className="text-lg sm:text-xl font-bold text-foreground mt-1">
            {formatBytes(originalTotalBytes)}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <span className="text-xs font-medium text-foreground-subtle">
            Peso final resultante
          </span>
          <span className="text-lg sm:text-xl font-bold text-foreground mt-1">
            {formatBytes(finalTotalBytes)}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <span className="text-xs font-medium text-foreground-subtle">
            Diferencia total
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {isRealSaving ? (
              <>
                <TrendingDown className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-lg sm:text-xl font-bold text-emerald-700">
                  -{formatBytes(Math.abs(netSavingsBytes))}
                </span>
              </>
            ) : netPercentDiff > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-lg sm:text-xl font-bold text-amber-700">
                  +{formatBytes(Math.abs(netSavingsBytes))}
                </span>
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 text-neutral-500 shrink-0" />
                <span className="text-lg sm:text-xl font-bold text-neutral-700">
                  Sin cambio
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
          <span className="text-xs font-medium text-foreground-subtle">
            Variación neta global
          </span>
          <span
            className={`text-lg sm:text-xl font-bold mt-1 ${
              isRealSaving
                ? "text-emerald-700"
                : netPercentDiff > 0
                ? "text-amber-700"
                : "text-neutral-700"
            }`}
          >
            {diffFormatted.text}
          </span>
        </div>
      </div>

      {/* Honest verdict callout */}
      {!isRealSaving && completedCount > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-foreground-muted">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Resultado honesto:</strong> El peso total resultante aumentó o no tuvo reducción significativa ({diffFormatted.text}). Esto puede ocurrir al convertir a formatos con mayor profundidad de color (como PNG) o si la imagen original ya estaba sumamente comprimida con antelación.
          </div>
        </div>
      )}

      {zipError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{zipError}</span>
        </div>
      )}
    </div>
  )
}
