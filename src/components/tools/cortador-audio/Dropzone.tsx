"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, Music, ShieldCheck, AlertCircle, FileAudio, Sparkles } from "lucide-react"
import { MAX_AUDIO_FILE_SIZE_LABEL } from "@/lib/audio-cutter/audio-inspector"

interface DropzoneProps {
  onFileSelected: (file: File) => void
  isLoading?: boolean
  error?: string | null
}

const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".aac"]

export function Dropzone({ onFileSelected, isLoading = false, error }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading) setIsDragOver(true)
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
    if (isLoading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileSelected(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelected(files[0])
      e.target.value = ""
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Privacy & Hardware notification banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/80 border border-purple-200/60 text-xs sm:text-sm text-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-brand">
              Procesamiento 100% privado en tu dispositivo:
            </span>{" "}
            Tu audio no se sube a ningún servidor. El corte se realiza dentro de tu propio navegador.
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 shrink-0 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>Motor WebAssembly</span>
        </div>
      </div>

      {/* Main Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
          isDragOver
            ? "border-brand bg-purple-50/60 scale-[1.005]"
            : "border-slate-300 bg-white hover:border-brand/60 hover:bg-slate-50/50 shadow-xs"
        } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />

        {/* Icon */}
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-brand-light text-brand mb-5 transition-transform group-hover:scale-105">
          <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 stroke-[1.8]" />
        </div>

        {/* Headline text */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Cortá tu audio online
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-md leading-relaxed mb-6">
          Arrastrá y soltá tu archivo de audio acá o hacé clic para seleccionarlo desde tu dispositivo.
        </p>

        {/* Supported formats & file size limits */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {["MP3", "WAV", "M4A", "OGG"].map((fmt) => (
            <span
              key={fmt}
              className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold tracking-wide border border-slate-200"
            >
              {fmt}
            </span>
          ))}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-brand text-xs font-semibold border border-purple-200">
            Hasta {MAX_AUDIO_FILE_SIZE_LABEL}
          </span>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
        >
          <FileAudio className="h-4 w-4" />
          <span>Elegir archivo de audio</span>
        </button>
      </div>

      {/* Error notification if any */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{error}</div>
        </div>
      )}
    </div>
  )
}
