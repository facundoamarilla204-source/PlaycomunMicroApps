"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { Layers, Check, X, Palette, Sparkles } from "lucide-react"
import { HANDWRITTEN_STYLES } from "@/lib/pdf-sign/fonts"
import { generateTextSignature } from "@/lib/pdf-sign/sign-engine"

interface InitialsModalProps {
  isOpen: boolean
  onClose: () => void
  onAddInitials: (dataUrl: string, title: string, aspectRatio: number) => void
  suggestedInitials?: string
}

const PRESET_COLORS = [
  { label: "Negro", value: "#0F172A" },
  { label: "Azul marino", value: "#1E3A8A" },
  { label: "Azul real", value: "#2563EB" },
  { label: "Violeta PlayComun", value: "#7C3AED" },
  { label: "Gris oscuro", value: "#334155" },
]

export function InitialsModal({
  isOpen,
  onClose,
  onAddInitials,
  suggestedInitials = "FA",
}: InitialsModalProps) {
  const [initials, setInitials] = useState<string>(suggestedInitials || "FA")
  const [selectedStyleId, setSelectedStyleId] = useState<string>("marck-script")
  const [selectedColor, setSelectedColor] = useState<string>("#0F172A")
  const [customHex, setCustomHex] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  if (!isOpen) return null

  const currentColor = customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : selectedColor
  const activeStyle = HANDWRITTEN_STYLES.find((s) => s.id === selectedStyleId) || HANDWRITTEN_STYLES[0]

  const handleConfirm = async () => {
    const textToSign = initials.trim().toUpperCase() || "FA"
    setIsGenerating(true)
    try {
      const dataUrl = await generateTextSignature(
        textToSign,
        activeStyle.fontFamily,
        currentColor,
        { isInitials: true }
      )

      const img = new Image()
      img.onload = () => {
        const ar = img.naturalWidth / Math.max(1, img.naturalHeight)
        onAddInitials(dataUrl, `Iniciales: ${textToSign}`, ar)
        setIsGenerating(false)
        onClose()
      }
      img.onerror = () => {
        onAddInitials(dataUrl, `Iniciales: ${textToSign}`, 1.5)
        setIsGenerating(false)
        onClose()
      }
      img.src = dataUrl
    } catch {
      setIsGenerating(false)
    }
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Personalizar iniciales</h2>
              <p className="text-xs text-slate-500">Creá un elemento independiente para colocar o foliar páginas.</p>
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Campo de texto de iniciales */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Tus iniciales (hasta 4 letras):
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              placeholder="Ej. FA"
              maxLength={4}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-2xs uppercase text-center"
            />
          </div>

          {/* Selector de Color y HEX */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-brand" /> Color de la tinta:
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.value)
                    setCustomHex("")
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                    currentColor === c.value
                      ? "border-brand bg-purple-50 text-brand ring-2 ring-brand/20 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-white min-h-[44px]">
                <span className="text-xs font-mono text-slate-400">HEX:</span>
                <input
                  type="text"
                  placeholder="#0F172A"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  maxLength={7}
                  className="w-20 text-xs font-mono px-1 py-1 focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Grilla de Estilos Tipográficos para Iniciales */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Estilo tipográfico:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {HANDWRITTEN_STYLES.map((style) => {
                const isSelected = selectedStyleId === style.id
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center min-h-[90px] relative ${
                      isSelected
                        ? "border-brand bg-purple-50/50 ring-2 ring-brand/30 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}

                    <div
                      className="text-2xl sm:text-3xl py-1 transition-colors"
                      style={{
                        fontFamily: style.fontFamily,
                        color: currentColor,
                      }}
                    >
                      {initials.trim().toUpperCase() || "FA"}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">
                      {style.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
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
            disabled={isGenerating || !initials.trim()}
            className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40 min-h-[44px] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Generando..." : "Colocar iniciales en el documento"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
