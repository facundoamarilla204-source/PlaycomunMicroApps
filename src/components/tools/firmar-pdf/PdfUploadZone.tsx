"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  UploadCloud,
  FileText,
  Lock,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  PenTool,
  Smartphone,
  Layers,
} from "lucide-react"

interface PdfUploadZoneProps {
  onFileSelected: (file: File, password?: string) => Promise<void>
  isLoading: boolean
  errorMessage: string | null
  onClearError: () => void
}

export function PdfUploadZone({
  onFileSelected,
  isLoading,
  errorMessage,
  onClearError,
}: PdfUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [passwordPromptFile, setPasswordPromptFile] = useState<File | null>(null)
  const [passwordInput, setPasswordInput] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onClearError()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      await processSelectedFile(file)
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      await processSelectedFile(file)
    }
  }

  const processSelectedFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Por favor seleccioná un archivo en formato PDF válido.")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("El archivo supera el límite recomendado de 50 MB para procesamiento en el navegador.")
      return
    }

    try {
      await onFileSelected(file)
    } catch (err: any) {
      if (err?.message?.includes("contraseña") || err?.name === "PasswordException") {
        setPasswordPromptFile(file)
      }
    }
  }

  const handleUnlockPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordPromptFile) return

    const file = passwordPromptFile
    const pwd = passwordInput
    setPasswordPromptFile(null)
    setPasswordInput("")

    await onFileSelected(file, pwd)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Mensaje de error si la carga falla */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aviso sobre el archivo</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearError}
              className="text-rose-400 hover:text-rose-600 p-1 font-bold text-base"
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL DROPZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all ${
          isDragOver
            ? "border-brand bg-purple-50/60 scale-[1.01] shadow-lg shadow-purple-500/10"
            : "border-slate-300 hover:border-brand/70 hover:bg-slate-50/80 bg-white shadow-xs"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-purple-50 text-brand flex items-center justify-center border border-purple-100/80 shadow-xs">
            {isLoading ? (
              <div className="w-9 h-9 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-10 h-10 text-brand" />
            )}
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isLoading ? "Procesando documento PDF..." : "Arrastrá tu PDF aquí o hacé clic para seleccionar"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Admite documentos PDF de cualquier cantidad de páginas. Procesamiento 100% privado en tu navegador.
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-sm font-bold shadow-md shadow-purple-500/20 transition-all pointer-events-none"
          >
            <FileText className="w-4 h-4" />
            {isLoading ? "Cargando páginas..." : "Elegir archivo PDF"}
          </button>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tu PDF no sale de tu dispositivo
            </span>
            <span>Máximo 50 MB</span>
            <span>Sin marcas de agua</span>
          </div>
        </div>
      </div>

      {/* CARACTERÍSTICAS Y MÉTODOS DE FIRMA DISPONIBLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-brand flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Escribir con estilos</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Escribí tu nombre y elegí entre 8 estilos tipográficos de caligrafía y cursiva natural con color personalizado.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-brand flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Dibujar a mano alzada</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Trazá tu firma con el mouse, pantalla táctil o lápiz digital con trazo fluido y fondo transparente automático.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-brand flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Firmar con QR desde el celular</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Escaneá un código QR con tu teléfono, firmá cómodamente con el dedo y la firma llegará en tiempo real a tu PC.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-brand flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Iniciales y logo de empresa</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Agregá iniciales para foliar páginas y subí el logo de tu negocio manteniendo sus proporciones exactas.
          </p>
        </div>
      </div>

      {/* MODAL DE CONTRASEÑA */}
      {passwordPromptFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">PDF con contraseña</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{passwordPromptFile.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Este archivo PDF está protegido con contraseña. Ingresá la clave para que tu navegador pueda desbloquearlo y mostrar sus páginas.
            </p>

            <form onSubmit={handleUnlockPassword} className="space-y-4">
              <input
                type="password"
                placeholder="Contraseña del documento"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordPromptFile(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!passwordInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-sm disabled:opacity-40 min-h-[44px]"
                >
                  Desbloquear y cargar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
