"use client"

import React, { useRef } from "react"
import { motion } from "motion/react"
import {
  UploadCloud,
  Camera,
  Layers,
  Scissors,
  RotateCw,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Files,
} from "lucide-react"

interface InitialChoiceViewProps {
  onFilesSelected: (files: FileList | File[]) => void
  onStartCamera: () => void
  isLoading?: boolean
}

export function InitialChoiceView({
  onFilesSelected,
  onStartCamera,
  isLoading = false,
}: InitialChoiceViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Selector de modo principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opción 1: Cargar archivos PDF */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/40 p-8 sm:p-10 transition-all hover:border-violet-600 hover:bg-violet-50/80 hover:shadow-lg flex flex-col items-center text-center justify-between min-h-[340px]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFilesSelected(e.target.files)
              }
            }}
          />

          <div className="w-full flex justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              <Files className="h-3 w-3" /> Varios archivos
            </span>
          </div>

          <div className="my-auto space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md transition-transform group-hover:scale-105">
              <UploadCloud className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                Cargar archivos PDF
              </h3>
              <p className="text-sm text-gray-600 max-w-sm">
                Arrastrá tus documentos aquí o hacé clic para explorar. Podés subir un PDF o combinar varios a la vez.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 text-white font-medium text-sm shadow-sm hover:bg-violet-700 transition-all active:scale-95"
          >
            {isLoading ? "Leyendo páginas..." : "Seleccionar archivos PDF"}
          </button>
        </motion.div>

        {/* Opción 2: Escanear con cámara */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          onClick={onStartCamera}
          className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 transition-all hover:border-violet-500 hover:shadow-lg flex flex-col items-center text-center justify-between min-h-[340px]"
        >
          <div className="w-full flex justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
              <Camera className="h-3 w-3" /> Cámara móvil o webcam
            </span>
          </div>

          <div className="my-auto space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg transition-transform group-hover:scale-105 group-hover:bg-violet-600">
              <Camera className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                Escanear a PDF con cámara
              </h3>
              <p className="text-sm text-gray-600 max-w-sm">
                Fotografiá documentos impresos, hojas de cuaderno o recibos. Incluye corrección de bordes y filtros de lectura.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-violet-600 transition-all active:scale-95 shadow-md shadow-gray-900/10"
          >
            Abrir escáner de cámara
          </button>
        </motion.div>
      </div>

      {/* Tarjetas de operaciones destacadas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Unir y ordenar</h4>
            <p className="text-xs text-gray-500">Reorganizá a tu gusto</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Dividir y extraer</h4>
            <p className="text-xs text-gray-500">Por partes o rangos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <RotateCw className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Rotar y depurar</h4>
            <p className="text-xs text-gray-500">Girá en 90° y 180°</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">100% privado</h4>
            <p className="text-xs text-gray-500">Proceso en tu equipo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
