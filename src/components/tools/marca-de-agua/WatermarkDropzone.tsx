"use client"

import React, { useRef, useState } from "react"
import { UploadCloud, Image as ImageIcon, ShieldCheck, FileCheck } from "lucide-react"

interface WatermarkDropzoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function WatermarkDropzone({ onFilesSelected, disabled }: WatermarkDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    )
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      )
      onFilesSelected(selectedFiles)
      e.target.value = ""
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
        isDragOver
          ? "border-brand bg-brand-light/50 scale-[1.01]"
          : "border-slate-300 hover:border-brand/60 bg-white hover:bg-slate-50/50"
      } shadow-xs`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand mb-4">
        <UploadCloud className="h-8 w-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">
        Subí tus imágenes para agregar marca de agua
      </h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
        Arrastrá y soltá tus fotos aquí o hacé clic para explorar tus archivos. Podés cargar una o varias imágenes al mismo tiempo.
      </p>

      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700 mb-6">
        <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
        <span>Admite JPG, PNG y WebP • Procesamiento por lotes</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100 max-w-lg mx-auto">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          100% privado en tu navegador
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1.5">
          <FileCheck className="h-4 w-4 text-brand" />
          Resolución original preservada
        </span>
      </div>
    </div>
  )
}
