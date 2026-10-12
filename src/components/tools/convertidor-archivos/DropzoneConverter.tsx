"use client"

import React, { useState, useRef } from "react"
import { ConversionOperation } from "@/lib/converter/types"
import { UploadCloud, File, AlertCircle } from "lucide-react"

interface DropzoneConverterProps {
  operation: ConversionOperation
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function DropzoneConverter({
  operation,
  onFilesSelected,
  disabled = false,
}: DropzoneConverterProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragError(null)
    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return

    if (!operation.allowMultipleFiles && droppedFiles.length > 1) {
      setDragError("Esta operación solo admite un archivo a la vez. Se procesará el primero.")
      onFilesSelected([droppedFiles[0]])
      return
    }

    onFilesSelected(droppedFiles)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      onFilesSelected(files)
      e.target.value = ""
    }
  }

  const acceptedExtensionsString = operation.acceptedExtensions.join(",")

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
          disabled
            ? "border-gray-200 bg-gray-50/50 opacity-60 cursor-not-allowed"
            : isDragOver
            ? "border-violet-600 bg-violet-50/40 scale-[1.005]"
            : "border-gray-300 hover:border-violet-500 bg-white hover:bg-gray-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensionsString}
          multiple={operation.allowMultipleFiles}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          id="file-dropzone-input"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
              isDragOver
                ? "bg-violet-600 text-white"
                : "bg-violet-50 text-violet-600"
            }`}
          >
            <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-gray-900">
              Arrastrá tu {operation.allowMultipleFiles ? "o tus archivos" : "archivo"} aquí o{" "}
              <span className="text-violet-600 hover:underline">explorá en tu dispositivo</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Formatos admitidos:{" "}
              <span className="font-semibold text-gray-700 font-mono">
                {operation.acceptedExtensions.join(", ").replace(/\./g, "")}
              </span>
              {" "}· Tamaño máximo: {operation.environment === "worker" ? "25 MB" : "50 MB"}
            </p>
          </div>

          {operation.allowMultipleFiles && (
            <p className="text-xs text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md font-medium">
              Podés seleccionar varias imágenes para combinarlas en un único PDF
            </p>
          )}
        </div>
      </div>

      {dragError && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{dragError}</span>
        </div>
      )}
    </div>
  )
}
