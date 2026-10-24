"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  UploadCloud,
  FileImage,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Archive,
  MapPin,
  Camera,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  Info,
  X,
  FileCheck2,
} from "lucide-react"
import JSZip from "jszip"
import {
  inspectImageMetadata,
  stripImageMetadata,
  type ExifMetadataSummary,
  type StripExifResult,
} from "@/lib/exif-stripper/exif-engine"

export interface ExifItem {
  id: string
  file: File
  previewUrl: string
  format: "jpeg" | "png" | "webp" | "unknown"
  status: "idle" | "inspecting" | "ready" | "processing" | "completed" | "error"
  metadata?: ExifMetadataSummary
  result?: StripExifResult
  downloadUrl?: string
  errorMessage?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function detectFormat(file: File): "jpeg" | "png" | "webp" | "unknown" {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (type.includes("jpeg") || type.includes("jpg") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "jpeg"
  }
  if (type.includes("png") || name.endsWith(".png")) {
    return "png"
  }
  if (type.includes("webp") || name.endsWith(".webp")) {
    return "webp"
  }
  return "unknown"
}

export function EliminarMetadatosExifTool() {
  const [items, setItems] = useState<ExifItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingAll, setIsProcessingAll] = useState(false)
  const [isZipping, setIsZipping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl)
      })
    }
  }, [items])

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => {
      const fmt = detectFormat(file)
      return fmt !== "unknown"
    })

    if (validFiles.length === 0) return

    const newItems: ExifItem[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      format: detectFormat(file),
      status: "inspecting",
    }))

    setItems((prev) => [...prev, ...newItems])

    // Inspect metadata for each new item
    for (const item of newItems) {
      try {
        const metadata = await inspectImageMetadata(item.file)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "ready", metadata } : i
          )
        )
      } catch (err) {
        console.error("Error al inspeccionar metadatos:", err)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "ready",
                  metadata: {
                    hasGps: false,
                    hasCameraInfo: false,
                    hasDateTime: false,
                    hasSoftware: false,
                    hasThumbnail: false,
                    hasComments: false,
                    hasIptcXmp: false,
                    totalSegmentsFound: 0,
                    rawSegments: [],
                  },
                }
              : i
          )
        )
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const clearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl)
    })
    setItems([])
  }

  const processItem = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "processing" } : i))
    )

    const item = items.find((i) => i.id === id)
    if (!item) return

    try {
      const result = await stripImageMetadata(item.file)
      const downloadUrl = URL.createObjectURL(result.blob)

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: "completed",
                result,
                downloadUrl,
              }
            : i
        )
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar archivo"
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: "error", errorMessage: msg } : i
        )
      )
    }
  }

  const processAll = async () => {
    setIsProcessingAll(true)
    const pendingItems = items.filter(
      (i) => i.status === "ready" || i.status === "error"
    )

    for (const item of pendingItems) {
      await processItem(item.id)
    }
    setIsProcessingAll(false)
  }

  const downloadSingle = (item: ExifItem) => {
    if (!item.downloadUrl || !item.result) return
    const a = document.createElement("a")
    a.href = item.downloadUrl

    // Clean filename preserving original extension
    const ext = item.format === "jpeg" ? "jpg" : item.format
    const nameWithoutExt = item.file.name.replace(/\.[^/.]+$/, "")
    a.download = `${nameWithoutExt}_sin_exif.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadAllZip = async () => {
    const completed = items.filter((i) => i.status === "completed" && i.result)
    if (completed.length === 0) return

    setIsZipping(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder("imagenes_sin_metadatos") || zip

      for (const item of completed) {
        if (!item.result) continue
        const ext = item.format === "jpeg" ? "jpg" : item.format
        const nameWithoutExt = item.file.name.replace(/\.[^/.]+$/, "")
        const filename = `${nameWithoutExt}_sin_exif.${ext}`
        folder.file(filename, item.result.blob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "imagenes_limpias_playcomun.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error al generar ZIP:", err)
    } finally {
      setIsZipping(false)
    }
  }

  const completedCount = items.filter((i) => i.status === "completed").length
  const totalGpsDetected = items.filter((i) => i.metadata?.hasGps).length
  const totalMetadataDetected = items.filter(
    (i) => (i.metadata?.totalSegmentsFound ?? 0) > 0
  ).length

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Privacy Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-brand flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Procesamiento 100% local en tu navegador
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Tus fotos nunca se suben a internet ni a ningún servidor. La eliminación de metadatos se ejecuta directamente en la memoria de tu dispositivo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            Sin conexión requerida
          </span>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-brand bg-purple-50/50 scale-[0.99]"
            : "border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-brand flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
          Arrastrá tus imágenes aquí o hacé clic para explorar
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
          Admite múltiples archivos JPEG, PNG y WebP. Podés subir tantas fotos como necesites y procesarlas por lote.
        </p>
      </div>

      {/* Main Action Bar & List */}
      {items.length > 0 && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-slate-700">
                {items.length} {items.length === 1 ? "imagen cargada" : "imágenes cargadas"}
              </span>
              {totalGpsDetected > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  {totalGpsDetected} con ubicación GPS
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-slate-600 hover:text-rose-600 px-3 py-2 rounded-xl transition-colors hover:bg-rose-50 border border-transparent"
              >
                Limpiar todo
              </button>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={downloadAllZip}
                  disabled={isZipping}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {isZipping ? "Empaquetando..." : `Descargar todas (${completedCount}) ZIP`}
                </button>
              )}

              <button
                type="button"
                onClick={processAll}
                disabled={isProcessingAll || items.every((i) => i.status === "completed")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-brand text-white hover:bg-brand-dark transition-transform active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShieldCheck className="w-4 h-4" />
                {isProcessingAll ? "Limpiando..." : "Eliminar metadatos"}
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                {/* Left: Thumbnail & Name */}
                <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.format.toUpperCase()} · {formatBytes(item.file.size)}
                    </p>

                    {/* Metadata summary badges */}
                    {item.metadata && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {item.metadata.hasGps && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3" />
                            Ubicación GPS
                          </span>
                        )}
                        {item.metadata.hasCameraInfo && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            <Camera className="w-3 h-3 text-slate-500" />
                            Cámara: {item.metadata.cameraModel || "Detectada"}
                          </span>
                        )}
                        {item.metadata.hasDateTime && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {item.metadata.dateTime?.split(" ")[0] || "Fecha"}
                          </span>
                        )}
                        {item.metadata.hasComments && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            Comentarios
                          </span>
                        )}
                        {item.metadata.totalSegmentsFound === 0 && item.status !== "completed" && (
                          <span className="text-[11px] text-slate-500 italic">
                            Sin metadatos detectados
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {item.status === "completed" && item.result && (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Limpio y verificado
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatBytes(item.result.newSizeBytes)} ({item.result.isLossless ? "Sin compresión" : "Reorientada"})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadSingle(item)}
                        className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                        title="Descargar imagen limpia"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {item.status === "processing" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-brand font-medium animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Limpiando...
                    </span>
                  )}

                  {item.status === "error" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 font-medium">
                        {item.errorMessage || "Error"}
                      </span>
                      <button
                        type="button"
                        onClick={() => processItem(item.id)}
                        className="text-xs text-slate-700 hover:text-slate-900 underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {item.status === "ready" && (
                    <button
                      type="button"
                      onClick={() => processItem(item.id)}
                      className="text-xs font-medium text-brand hover:text-brand-dark px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors hover:bg-rose-50"
                    title="Quitar de la lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
