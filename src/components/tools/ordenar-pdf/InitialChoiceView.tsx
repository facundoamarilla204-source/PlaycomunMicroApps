"use client"

import React, { useRef } from "react"
import { motion } from "motion/react"
import {
  UploadCloud,
  Camera,
  Layers,
  Scissors,
  RotateCw,
  ShieldCheck,
  Smartphone,
  ImageIcon,
  Sparkles,
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
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Sección principal: Opciones de escaneo directo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-violet-600" />
              <span>Digitalizar y escanear documentos</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Escaneo fiel en color original con encuadre A4 y opción de reconstrucción OCR.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            <span>Escaneo inteligente</span>
          </span>
        </div>

        {/* 3 Tarjetas de inicio directo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Opción 1: Escanear con la cámara */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18 }}
            onClick={onStartCamera}
            className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-500 hover:shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-600/20 group-hover:scale-105 transition-transform">
                <Camera className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200/50">
                Webcam PC
              </span>
            </div>

            <div className="my-4 space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                Escanear con la cámara
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Fotografiá hojas A4 directamente desde la cámara de tu computadora con guía de encuadre.
              </p>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white font-medium text-xs hover:bg-violet-600 transition-colors shadow-xs"
            >
              Iniciar cámara
            </button>
          </motion.div>

          {/* Opción 2: Subir foto o fotos */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18 }}
            onClick={() => photosInputRef.current?.click()}
            className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-500 hover:shadow-lg flex flex-col justify-between"
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

            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <ImageIcon className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                Una o varias fotos
              </span>
            </div>

            <div className="my-4 space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                Subir foto o fotos
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Seleccioná una o varias fotografías de tu galería o disco para armar tu documento.
              </p>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white font-medium text-xs hover:bg-emerald-600 transition-colors shadow-xs"
            >
              Elegir fotos
            </button>
          </motion.div>

          {/* Opción 3: Escanear con el celular mediante QR */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18 }}
            onClick={onStartQrScan}
            className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-500 hover:shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <Smartphone className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/50">
                Sin cables
              </span>
            </div>

            <div className="my-4 space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                Escanear con el celular (QR)
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Conectá tu teléfono mediante código QR para enviar hojas sucesivas a la computadora.
              </p>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white font-medium text-xs hover:bg-indigo-600 transition-colors shadow-xs"
            >
              Conectar celular vía QR
            </button>
          </motion.div>
        </div>
      </div>

      {/* Opción secundaria: Cargar archivos PDF existentes para organizar */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">
          O cargá documentos PDF existentes para unir, ordenar o dividir
        </h3>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.18 }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => pdfInputRef.current?.click()}
          className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/40 p-6 sm:p-8 transition-all hover:border-violet-600 hover:bg-violet-50/80 hover:shadow-md flex flex-col sm:flex-row items-center justify-between gap-4"
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

          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                Cargar archivos PDF
              </h4>
              <p className="text-xs text-gray-600 max-w-md">
                Arrastrá documentos PDF aquí o explorá tus archivos. Podés subir un PDF o combinar varios.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs shadow-xs hover:bg-violet-700 transition-colors"
          >
            {isLoading ? "Leyendo páginas..." : "Seleccionar archivos PDF"}
          </button>
        </motion.div>
      </div>

      {/* Tarjetas de operaciones destacadas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Unir y ordenar</h4>
            <p className="text-[11px] text-gray-500">Reorganizá a tu gusto</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Dividir y extraer</h4>
            <p className="text-[11px] text-gray-500">Por partes o rangos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <RotateCw className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Rotar y depurar</h4>
            <p className="text-[11px] text-gray-500">Girá en 90° y 180°</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">100% privado</h4>
            <p className="text-[11px] text-gray-500">Proceso en tu equipo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
