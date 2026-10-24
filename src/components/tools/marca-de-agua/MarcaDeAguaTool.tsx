"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  ProcessingStatus,
  WatermarkConfig,
  WatermarkImageItem,
} from "@/lib/watermark/types"
import {
  DEFAULT_WATERMARK_CONFIG,
  triggerFileDownload,
} from "@/lib/watermark/layout"
import {
  loadImageElement,
  processSingleWatermark,
} from "@/lib/watermark/engine"
import { createAndDownloadWatermarkZip } from "@/lib/watermark/zip"
import { WatermarkDropzone } from "./WatermarkDropzone"
import { WatermarkPreview } from "./WatermarkPreview"
import { WatermarkControls } from "./WatermarkControls"
import { WatermarkBatchList } from "./WatermarkBatchList"
import {
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react"

export function MarcaDeAguaTool() {
  const [items, setItems] = useState<WatermarkImageItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl)
        if (item.result?.downloadUrl?.startsWith("blob:")) URL.revokeObjectURL(item.result.downloadUrl)
      })
      if (config.imageConfig.logoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(config.imageConfig.logoUrl)
      }
    }
  }, [items, config.imageConfig.logoUrl])

  // Get active item
  const activeItem = items.find((i) => i.id === activeId) || items[0] || null

  // Ensure an item is always active when items exist
  useEffect(() => {
    if (items.length > 0 && !activeId) {
      setActiveId(items[0].id)
    }
  }, [items, activeId])

  // Handle files selected via dropzone or add more
  const handleFilesSelected = async (files: File[]) => {
    setFeedbackMessage(null)
    const newItems: WatermarkImageItem[] = []

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const previewUrl = URL.createObjectURL(file)

      try {
        const img = await loadImageElement(file)
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height

        // Detect basic format
        let format: "jpeg" | "png" | "webp" | "desconocido" = "desconocido"
        const type = (file.type || "").toLowerCase()
        if (type.includes("png")) format = "png"
        else if (type.includes("webp")) format = "webp"
        else if (type.includes("jpeg") || type.includes("jpg")) format = "jpeg"

        // Quick transparency check for PNG/WebP
        let hasTransparency = false
        if (format === "png" || format === "webp") {
          try {
            const canvas = document.createElement("canvas")
            const sampleW = Math.min(width, 60)
            const sampleH = Math.min(height, 60)
            canvas.width = sampleW
            canvas.height = sampleH
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(img, 0, 0, sampleW, sampleH)
              const data = ctx.getImageData(0, 0, sampleW, sampleH).data
              for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 250) {
                  hasTransparency = true
                  break
                }
              }
            }
          } catch {
            // Non-critical check failure
          }
        }

        newItems.push({
          id,
          file,
          originalName: file.name,
          originalSize: file.size,
          originalWidth: width,
          originalHeight: height,
          originalFormat: format,
          hasTransparency,
          previewUrl,
          status: "pending",
        })
      } catch (err: any) {
        newItems.push({
          id,
          file,
          originalName: file.name,
          originalSize: file.size,
          originalWidth: 0,
          originalHeight: 0,
          originalFormat: "desconocido",
          hasTransparency: false,
          previewUrl,
          status: "error",
          errorMessage: err?.message || "No se pudo leer el archivo de imagen.",
        })
      }
    }

    setItems((prev) => [...prev, ...newItems])
    if (!activeId && newItems.length > 0) {
      setActiveId(newItems[0].id)
    }
  }

  // Handle logo file upload
  const handleLogoUpload = async (file: File) => {
    try {
      const img = await loadImageElement(file)
      const url = URL.createObjectURL(file)

      setLogoImg(img)
      setConfig((prev) => ({
        ...prev,
        type: "image",
        imageConfig: {
          ...prev.imageConfig,
          logoFile: file,
          logoUrl: url,
          logoWidth: img.naturalWidth || img.width,
          logoHeight: img.naturalHeight || img.height,
          logoFormat: file.type || "png",
        },
      }))

      // Invalidate completed items since watermark changed
      setItems((prev) =>
        prev.map((i) => (i.status === "completed" ? { ...i, status: "pending" } : i))
      )
    } catch {
      setFeedbackMessage({
        type: "error",
        text: "No se pudo decodificar el archivo de logotipo. Intentá con un PNG o JPG válido.",
      })
    }
  }

  // Handle logo removal
  const handleLogoRemove = () => {
    if (config.imageConfig.logoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(config.imageConfig.logoUrl)
    }
    setLogoImg(null)
    setConfig((prev) => ({
      ...prev,
      type: "text",
      imageConfig: {
        ...prev.imageConfig,
        logoFile: null,
        logoUrl: null,
        logoWidth: 0,
        logoHeight: 0,
      },
    }))

    setItems((prev) =>
      prev.map((i) => (i.status === "completed" ? { ...i, status: "pending" } : i))
    )
  }

  // Handle watermark configuration changes
  const handleConfigChange = (partial: Partial<WatermarkConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...partial,
    }))

    // Invalidate completed state when watermark properties change
    setItems((prev) =>
      prev.map((i) => (i.status === "completed" ? { ...i, status: "pending" } : i))
    )
  }

  // Handle custom position dragging from preview canvas
  const handleCustomPositionChange = (pos: { xRel: number; yRel: number }) => {
    setConfig((prev) => ({
      ...prev,
      position: "custom",
      customPos: pos,
    }))

    setItems((prev) =>
      prev.map((i) => (i.status === "completed" ? { ...i, status: "pending" } : i))
    )
  }

  // Remove single image from batch
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const itemToRemove = prev.find((i) => i.id === id)
      if (itemToRemove) {
        if (itemToRemove.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(itemToRemove.previewUrl)
        if (itemToRemove.result?.downloadUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(itemToRemove.result.downloadUrl)
        }
      }
      const updated = prev.filter((i) => i.id !== id)
      if (activeId === id) {
        setActiveId(updated.length > 0 ? updated[0].id : null)
      }
      return updated
    })
  }

  // Clear all images
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl)
      if (item.result?.downloadUrl?.startsWith("blob:")) URL.revokeObjectURL(item.result.downloadUrl)
    })
    setItems([])
    setActiveId(null)
    setFeedbackMessage(null)
  }

  // Process a single item
  const handleProcessSingle = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "processing", errorMessage: undefined } : i))
    )

    try {
      const result = await processSingleWatermark(item, config, logoImg)
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "completed", result } : i))
      )
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: "error", errorMessage: err?.message || "Error al procesar marca de agua." }
            : i
        )
      )
    }
  }

  // Run batch processing across all items
  const handleProcessBatch = async () => {
    if (items.length === 0 || isProcessingBatch) return

    setIsProcessingBatch(true)
    setBatchProgress(0)
    setFeedbackMessage(null)

    let completedSuccess = 0
    let failedCount = 0

    for (let index = 0; index < items.length; index++) {
      const item = items[index]

      // Mark current as processing
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i))
      )

      // Small async tick so UI stays responsive
      await new Promise((r) => setTimeout(r, 30))

      try {
        const result = await processSingleWatermark(item, config, logoImg)
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "completed", result } : i))
        )
        completedSuccess++
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", errorMessage: err?.message || "Error al procesar marca de agua." }
              : i
          )
        )
        failedCount++
      }

      setBatchProgress(((index + 1) / items.length) * 100)
    }

    setIsProcessingBatch(false)

    if (failedCount === 0) {
      setFeedbackMessage({
        type: "success",
        text: `¡Lote completado con éxito! Se procesaron ${completedSuccess} imágenes con tu marca de agua.`,
      })
    } else {
      setFeedbackMessage({
        type: "info",
        text: `Procesamiento finalizado: ${completedSuccess} imágenes listas, ${failedCount} con error. Podés reintentar las fallidas individualmente.`,
      })
    }
  }

  // Download single image (processes on the fly if pending or not yet generated)
  const handleDownloadSingle = async (item: WatermarkImageItem) => {
    if (downloadingItemId) return
    setDownloadingItemId(item.id)
    setFeedbackMessage(null)

    try {
      let result = item.result

      // If not yet processed or pending, process it on the fly with current watermark settings
      if (!result || item.status !== "completed") {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i))
        )
        result = await processSingleWatermark(item, config, logoImg)
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "completed", result } : i))
        )
      }

      // Safe browser download
      triggerFileDownload(result.blob, result.fileName)
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "error", errorMessage: err?.message || "Error al procesar marca de agua." }
            : i
        )
      )
      setFeedbackMessage({
        type: "error",
        text: `Error al procesar "${item.originalName}": ${err?.message || "Error inesperado"}`,
      })
    } finally {
      setDownloadingItemId(null)
    }
  }

  // Download all as ZIP
  const handleDownloadZip = async () => {
    try {
      await createAndDownloadWatermarkZip(items, "imagenes-con-marca-de-agua.zip")
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Ocurrió un error al compilar el archivo ZIP.",
      })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-sm transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : feedbackMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
            {feedbackMessage.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            {feedbackMessage.type === "info" && <Info className="h-5 w-5 text-blue-600 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold underline hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* When no images loaded: initial dropzone view */}
      {items.length === 0 ? (
        <div className="max-w-2xl mx-auto py-4">
          <WatermarkDropzone onFilesSelected={handleFilesSelected} />
        </div>
      ) : (
        /* Workspace when images are loaded */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Center Column: Live Preview & Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <WatermarkPreview
                activeItem={activeItem}
                config={config}
                logoImg={logoImg}
                onCustomPositionChange={handleCustomPositionChange}
                onDownloadActive={() => activeItem && handleDownloadSingle(activeItem)}
                isDownloadingActive={
                  activeItem
                    ? activeItem.status === "processing" || downloadingItemId === activeItem.id
                    : false
                }
              />
            </div>

            {/* Right Column: Watermark Controls */}
            <div className="lg:col-span-5 space-y-4">
              <WatermarkControls
                config={config}
                onChange={handleConfigChange}
                onLogoUpload={handleLogoUpload}
                onLogoRemove={handleLogoRemove}
                logoImg={logoImg}
              />
            </div>
          </div>

          {/* Batch filmstrip / image list */}
          <WatermarkBatchList
            items={items}
            activeId={activeId}
            onSelectActive={(id) => setActiveId(id)}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
            onAddFiles={handleFilesSelected}
            onProcessBatch={handleProcessBatch}
            onProcessSingle={handleProcessSingle}
            onDownloadSingle={handleDownloadSingle}
            onDownloadZip={handleDownloadZip}
            isProcessingBatch={isProcessingBatch}
            batchProgress={batchProgress}
          />
        </div>
      )}
    </div>
  )
}
