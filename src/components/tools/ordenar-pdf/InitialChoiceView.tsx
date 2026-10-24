"use client"

import React, { useRef } from "react"
import {
  Upload,
  Camera,
  Layers,
  Scissors,
  RotateCw,
  ShieldCheck,
  Smartphone,
  ImageIcon,
} from "lucide-react"

interface InitialChoiceViewProps {
  onFilesSelected: (files: FileList | File[]) => void
  onStartCamera: () => void
  onStartUploadPhotos: () => void
  onStartQrScan: () => void
  isLoading?: boolean
}

export function InitialChoiceView({
  onFilesSelected,
  onStartCamera,
  onStartUploadPhotos,
  onStartQrScan,
  isLoading = false,
}: InitialChoiceViewProps) {
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. Zona de carga principal de PDF */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => pdfInputRef.current?.click()}
        className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            pdfInputRef.current?.click()
          }
        }}
      >
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFilesSelected(e.target.files)
              e.target.value = ""
            }
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition-colors group-hover:bg-brand-light group-hover:text-brand">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Cargar archivos PDF
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-md">
                Arrastrá documentos aquí o hacé clic para explorar tus archivos. Podés subir un PDF o varios para combinarlos.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {isLoading ? "Procesando páginas..." : "Elegir archivos PDF"}
          </button>
        </div>
      </div>

      {/* 2. Sección de digitalización física / cámara */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Digitalizar documentos físicos
          </h3>
          <span className="text-xs text-slate-500">
            Encuadre A4, color original y texto digital con OCR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Opción 1: Cámara web PC */}
          <div
            onClick={onStartCamera}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onStartCamera()
              }
            }}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.98] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand-light group-hover:text-brand">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Cámara de la computadora
                </h4>
                <span className="text-[11px] text-slate-500">Webcam integrada</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capturá hojas impresas directamente frente a la pantalla con visor en vivo.
            </p>
          </div>

          {/* Opción 2: Subir fotos existentes */}
          <div
            onClick={() => photosInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                photosInputRef.current?.click()
              }
            }}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.98] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFilesSelected(e.target.files)
                  e.target.value = ""
                }
              }}
            />
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand-light group-hover:text-brand">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Subir fotografías
                </h4>
                <span className="text-[11px] text-slate-500">JPG, PNG o WEBP</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Elegí imágenes de tu dispositivo para convertirlas en páginas organizadas.
            </p>
          </div>

          {/* Opción 3: Celular vía QR */}
          <div
            onClick={onStartQrScan}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onStartQrScan()
              }
            }}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.98] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand-light group-hover:text-brand">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Escanear con celular
                </h4>
                <span className="text-[11px] text-slate-500">Conexión por código QR</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sincronizá tu teléfono para enviar fotos consecutivas a la mesa de trabajo.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Operaciones disponibles discretas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-600">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white">
          <Layers className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Combinar y reordenar</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white">
          <Scissors className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Dividir y extraer</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white">
          <RotateCw className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Rotar páginas</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white">
          <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Procesamiento local</span>
        </div>
      </div>
    </div>
  )
}
