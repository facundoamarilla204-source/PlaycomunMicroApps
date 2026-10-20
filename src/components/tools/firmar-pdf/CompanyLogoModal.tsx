"use client"

import React, { useState, useRef } from "react"
import { motion } from "motion/react"
import {
  Building2,
  UploadCloud,
  Check,
  X,
  AlertCircle,
} from "lucide-react"

interface CompanyLogoModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLogo: (dataUrl: string, title: string, aspectRatio: number) => void
}

export function CompanyLogoModal({
  isOpen,
  onClose,
  onAddLogo,
}: CompanyLogoModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<number>(1.0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isReading, setIsReading] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    processFile(file)
  }

  const processFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Por favor seleccioná un logo en formato PNG (recomendado con transparencia), JPG o WebP.")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("El archivo de logo no debe superar los 15 MB.")
      return
    }

    setSelectedFile(file)
    setErrorMessage(null)
    setIsReading(true)

    const reader = new FileReader()
    reader.onerror = () => {
      setErrorMessage("Error al leer el archivo del logo.")
      setIsReading(false)
    }
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        const ar = img.naturalWidth / Math.max(1, img.naturalHeight)
        setPreviewUrl(dataUrl)
        setAspectRatio(ar)
        setIsReading(false)
      }
      img.onerror = () => {
        setErrorMessage("No se pudo decodificar el logo seleccionado.")
        setIsReading(false)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleConfirm = () => {
    if (!previewUrl) return
    const logoTitle = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "Logo de empresa"
    onAddLogo(previewUrl, `Logo: ${logoTitle}`, aspectRatio)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/70 text-brand flex items-center justify-center border border-purple-200/60">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Logo de empresa</h2>
              <p className="text-xs text-slate-500">Agregá tu isotipo o membrete institucional al PDF.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand p-8 text-center bg-slate-50/50 hover:bg-purple-50/30 transition-all flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-brand flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Cargar logo de empresa</p>
                <p className="text-xs text-slate-500 mt-0.5">Se recomienda PNG transparente para mejor integración</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs pointer-events-none"
              >
                Elegir imagen de logo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-6 flex items-center justify-center min-h-[170px]">
                <img
                  src={previewUrl}
                  alt="Vista previa del logo"
                  className="max-h-36 max-w-full object-contain filter drop-shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span>Proporción original preservada</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="font-semibold text-brand hover:underline"
                >
                  Cambiar archivo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!previewUrl || isReading}
            className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40 min-h-[44px] flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Colocar logo en el documento
          </button>
        </div>
      </motion.div>
    </div>
  )
}
