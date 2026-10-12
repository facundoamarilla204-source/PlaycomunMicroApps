"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  ImageItem,
  ProcessingConfig,
  ProcessResult,
  BatchSummaryData,
} from "@/lib/image-processor/types"
import {
  inspectAndLoadImage,
  processSingleImage,
  runBatchProcessing,
} from "@/lib/image-processor/engine"
import { revokeItemUrls, revokeObjectUrl } from "@/lib/image-processor/utils"
import { Dropzone } from "./Dropzone"
import { GlobalConfigPanel } from "./GlobalConfigPanel"
import { ImageCard } from "./ImageCard"
import { BatchSummary } from "./BatchSummary"
import { BeforeAfterModal } from "./BeforeAfterModal"
import {
  Play,
  Trash2,
  Plus,
  ShieldCheck,
  Cpu,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react"

const DEFAULT_CONFIG: ProcessingConfig = {
  operation: "compress-and-convert",
  targetFormat: "webp",
  qualityPreset: "balanced",
  qualityValue: 0.65,
  enableResize: false,
  maxWidth: null,
  maxHeight: null,
  keepAspectRatio: true,
  backgroundColor: "#ffffff",
}

export function CompresorImagenes() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [config, setConfig] = useState<ProcessingConfig>(DEFAULT_CONFIG)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [activeCompareItem, setActiveCompareItem] = useState<ImageItem | null>(null)
  const fileInputAddMoreRef = useRef<HTMLInputElement>(null)

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => revokeItemUrls(item))
    }
  }, [])

  // Check if any image in batch contains transparency
  const hasTransparentImages = useMemo(() => {
    return items.some((item) => item.hasTransparency)
  }, [items])

  // Batch summary calculations
  const summary: BatchSummaryData = useMemo(() => {
    let completedCount = 0
    let errorCount = 0
    let pendingCount = 0
    let originalTotalBytes = 0
    let finalTotalBytes = 0

    items.forEach((item) => {
      if (item.status === "completed" && item.result) {
        completedCount++
        originalTotalBytes += item.originalSize
        finalTotalBytes += item.result.size
      } else if (item.status === "error") {
        errorCount++
      } else {
        pendingCount++
      }
    })

    const netSavingsBytes = originalTotalBytes - finalTotalBytes
    const netPercentDiff =
      originalTotalBytes > 0
        ? ((finalTotalBytes - originalTotalBytes) / originalTotalBytes) * 100
        : 0
    const isRealSaving = netSavingsBytes > 0

    return {
      totalCount: items.length,
      completedCount,
      errorCount,
      pendingCount,
      originalTotalBytes,
      finalTotalBytes,
      netSavingsBytes,
      netPercentDiff,
      isRealSaving,
    }
  }, [items])

  // Add new files to list
  const handleFilesSelected = async (files: File[]) => {
    const newItems: ImageItem[] = []

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const previewUrl = URL.createObjectURL(file)

      try {
        const metadata = await inspectAndLoadImage(file)
        newItems.push({
          id,
          file,
          originalName: file.name,
          originalSize: file.size,
          originalType: file.type || "image/jpeg",
          originalFormat: metadata.format,
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          previewUrl,
          hasTransparency: metadata.hasTransparency,
          status: "pending",
        })
      } catch (err: any) {
        // If image decode fails, register with error
        newItems.push({
          id,
          file,
          originalName: file.name,
          originalSize: file.size,
          originalType: file.type || "unknown",
          originalFormat: "desconocido",
          originalWidth: 0,
          originalHeight: 0,
          previewUrl,
          hasTransparency: false,
          status: "error",
          errorMessage: err?.message || "No se pudo leer la imagen",
        })
      }
    }

    setItems((prev) => [...prev, ...newItems])
  }

  // Remove single item with URL revocation
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id)
      if (item) {
        revokeItemUrls(item)
      }
      return prev.filter((it) => it.id !== id)
    })
  }

  // Clear all items with URL revocation
  const handleClearAll = () => {
    items.forEach((item) => revokeItemUrls(item))
    setItems([])
  }

  // Retry processing a single image
  const handleRetrySingle = async (id: string) => {
    const targetItem = items.find((it) => it.id === id)
    if (!targetItem) return

    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: "processing", errorMessage: undefined } : it
      )
    )

    try {
      const result = await processSingleImage(targetItem, config)
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === id) {
            if (it.result?.downloadUrl) {
              revokeObjectUrl(it.result.downloadUrl)
            }
            return { ...it, status: "completed", result }
          }
          return it
        })
      )
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: "error", errorMessage: err?.message || "Error al procesar" }
            : it
        )
      )
    }
  }

  // Execute full batch processing with concurrency control
  const handleProcessAll = async () => {
    if (isProcessingBatch) return
    const pendingItems = items.filter(
      (it) => it.status === "pending" || it.status === "error"
    )
    if (pendingItems.length === 0) return

    setIsProcessingBatch(true)

    await runBatchProcessing(
      pendingItems,
      config,
      (id) => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, status: "processing" } : it))
        )
      },
      (id, result) => {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id === id) {
              if (it.result?.downloadUrl) {
                revokeObjectUrl(it.result.downloadUrl)
              }
              return { ...it, status: "completed", result }
            }
            return it
          })
        )
      },
      (id, errorMsg) => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, status: "error", errorMessage: errorMsg }
              : it
          )
        )
      },
      2 // Max 2 concurrent processes for mobile memory stability
    )

    setIsProcessingBatch(false)
  }

  const hasPendingItems = items.some(
    (it) => it.status === "pending" || it.status === "error"
  )

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans">
      {/* Privacy & Technology Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-brand-light/60 border border-brand/20 text-xs sm:text-sm text-foreground">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-brand">
              Procesamiento 100% privado en tu navegador:
            </span>{" "}
            Tus fotos se comprimen localmente. No se suben a ningún servidor ni se guardan en la nube.
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-foreground-subtle shrink-0 text-xs font-medium">
          <Cpu className="h-3.5 w-3.5 text-brand" />
          <span>Motor Web Canvas HD</span>
        </div>
      </div>

      {/* Upload Zone */}
      <Dropzone
        onFilesSelected={handleFilesSelected}
        disabled={isProcessingBatch}
        currentCount={items.length}
      />

      {/* Hidden input to add more files to existing batch */}
      <input
        ref={fileInputAddMoreRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(Array.from(e.target.files))
            e.target.value = ""
          }
        }}
      />

      {/* Main Configuration & Items List */}
      {items.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Options Panel */}
          <GlobalConfigPanel
            config={config}
            onChange={setConfig}
            disabled={isProcessingBatch}
            hasTransparentImagesInBatch={hasTransparentImages}
          />

          {/* Batch Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-border shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                Imágenes en el lote ({items.length})
              </span>
              <button
                type="button"
                disabled={isProcessingBatch}
                onClick={() => fileInputAddMoreRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5 text-brand" />
                <span>Agregar más</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessingBatch}
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpiar lista</span>
              </button>

              <button
                type="button"
                disabled={isProcessingBatch || !hasPendingItems}
                onClick={handleProcessAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingBatch ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Procesando lote...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Procesar {items.length} {items.length === 1 ? "imagen" : "imágenes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary Banner (Shown when at least 1 image is completed) */}
          {summary.completedCount > 0 && (
            <BatchSummary summary={summary} items={items} />
          )}

          {/* Images List */}
          <div className="space-y-3">
            {items.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onRetry={handleRetrySingle}
                onOpenCompare={setActiveCompareItem}
                isProcessingBatch={isProcessingBatch}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visual Comparison Modal */}
      <BeforeAfterModal
        item={activeCompareItem}
        isOpen={!!activeCompareItem}
        onClose={() => setActiveCompareItem(null)}
      />
    </div>
  )
}
