"use client"

import React, { useRef, useState } from "react"
import { UploadCloud, Image as ImageIcon, AlertCircle } from "lucide-react"
import { MAX_BATCH_FILES, MAX_FILE_SIZE_BYTES, validateImageFileInitial } from "@/lib/image-processor/validator"

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  currentCount?: number
}

export function Dropzone({
  onFilesSelected,
  disabled = false,
  currentCount = 0,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const processFileList = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setErrorMessage(null)

    const remainingSlots = Math.max(0, MAX_BATCH_FILES - currentCount)
    if (remainingSlots <= 0) {
      setErrorMessage(`Alcanzaste el límite de ${MAX_BATCH_FILES} imágenes por lote. Procesá o limpiá la lista antes de añadir más.`)
      return
    }

    const selectedFiles: File[] = []
    const fileArray = Array.from(files)

    for (let i = 0; i < fileArray.length; i++) {
      if (selectedFiles.length >= remainingSlots) {
        setErrorMessage(`Se seleccionaron solo las primeras ${remainingSlots} imágenes para no superar el límite de ${MAX_BATCH_FILES}.`)
        break
      }

      const file = fileArray[i]
      const validation = validateImageFileInitial(file)
      if (!validation.ok) {
        setErrorMessage(validation.error || `Archivo ignorado: ${file.name}`)
        continue
      }
      selectedFiles.push(file)
    }

    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (disabled) return
    processFileList(e.dataTransfer.files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFileList(e.target.files)
    if (e.target) {
      e.target.value = "" // reset so re-selecting same file works
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Zona de carga de imágenes. Presioná para seleccionar archivos o arrastralos aquí."
        className={`relative flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          isDragOver
            ? "border-brand bg-brand-light/70 scale-[0.99]"
            : "border-border hover:border-brand/60 bg-white hover:bg-brand-light/20 shadow-xs"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-brand-light text-brand mb-4 shadow-xs">
          <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground text-center mb-1">
          Elegí tus imágenes o arrastralas aquí
        </h3>

        <p className="text-xs sm:text-sm text-foreground-muted text-center max-w-md mb-3">
          Admite formatos <strong>JPG</strong>, <strong>PNG</strong> y <strong>WebP</strong>. Procesamiento 100% privado en tu dispositivo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-foreground-subtle">
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-600">
            <ImageIcon className="h-3 w-3" /> Hasta 50 MB por archivo
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-600">
            Máx. {MAX_BATCH_FILES} imágenes por lote
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs sm:text-sm text-amber-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
