"use client"

import React, { useState, useRef } from "react"
import { motion } from "motion/react"
import {
  UploadCloud,
  Check,
  X,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  AlertCircle,
  Eye,
} from "lucide-react"
import { processUploadedSignatureImage } from "@/lib/pdf-sign/sign-engine"

interface UploadSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSignature: (dataUrl: string, title: string, aspectRatio: number) => void
}

export function UploadSignatureModal({
  isOpen,
  onClose,
  onAddSignature,
}: UploadSignatureModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeBackground, setRemoveBackground] = useState<boolean>(true)
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null)
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<number>(3.0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    await handleProcessFile(file, removeBackground)
  }

  const handleProcessFile = async (file: File, removeBg: boolean) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Por favor seleccioná un archivo de imagen válido (PNG, JPG o WebP).")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("La imagen no debe superar los 15 MB.")
      return
    }

    setSelectedFile(file)
    setErrorMessage(null)
    setIsProcessing(true)

    try {
      // Process with selected background option
      const result = await processUploadedSignatureImage(file, removeBg)
      setProcessedDataUrl(result.dataUrl)
      setAspectRatio(result.aspectRatio)

      // Also cache original without removing background if not yet cached
      if (!originalDataUrl) {
        const origResult = await processUploadedSignatureImage(file, false)
        setOriginalDataUrl(origResult.dataUrl)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "No se pudo procesar la imagen.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleRemoveBg = async (checked: boolean) => {
    setRemoveBackground(checked)
    if (selectedFile) {
      await handleProcessFile(selectedFile, checked)
    }
  }

  const handleConfirm = () => {
    if (!processedDataUrl) return
    onAddSignature(processedDataUrl, "Firma subida", aspectRatio)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/70 text-brand flex items-center justify-center border border-purple-200/60">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Subir imagen de firma</h2>
              <p className="text-xs text-slate-500">Cargá una foto o escaneo de tu firma manuscrita.</p>
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

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!selectedFile ? (
            /* ZONA DE CARGA INICIAL */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand p-8 text-center bg-slate-50/50 hover:bg-purple-50/30 transition-all flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-brand flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Seleccionar imagen de firma</p>
                <p className="text-xs text-slate-500 mt-0.5">Admite PNG transparente, JPG o WebP</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs pointer-events-none"
              >
                Explorar archivos
              </button>
            </div>
          ) : (
            /* VISTA PREVIA Y CONTROLES DE EDICIÓN LOCAL */
            <div className="space-y-4">
              {/* Contenedor de previsualización con fondo de transparencia en cuadrícula */}
              <div className="relative rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-6 flex items-center justify-center min-h-[180px] overflow-hidden">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                    <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    <span>Optimizando firma...</span>
                  </div>
                ) : (
                  processedDataUrl && (
                    <img
                      src={processedDataUrl}
                      alt="Vista previa de firma"
                      className="max-h-40 max-w-full object-contain filter drop-shadow-xs"
                    />
                  )
                )}
              </div>

              {/* Interruptor: Quitar fondo blanco de papel */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    Quitar fondo blanco automáticamente
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Convierte el papel blanco en fondo transparente para que se funda naturalmente en el PDF.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => handleToggleRemoveBg(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>

              {/* Botón para cambiar de imagen */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setProcessedDataUrl(null)
                    setOriginalDataUrl(null)
                  }}
                  className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 py-1"
                >
                  Cambiar imagen seleccionada
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
            disabled={!processedDataUrl || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40 min-h-[44px] flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Colocar en el documento
          </button>
        </div>
      </motion.div>
    </div>
  )
}
