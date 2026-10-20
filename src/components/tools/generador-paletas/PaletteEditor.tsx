"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Lock, Unlock, Copy, Check, Pipette } from "lucide-react"
import { ColorSample } from "@/lib/color-palette/types"
import {
  normalizeHex,
  getContrastingTextColor,
} from "@/lib/color-palette/color-converter"
import { copyToClipboard } from "@/lib/color-palette/palette-exporter"

interface PaletteEditorProps {
  colors: ColorSample[]
  onUpdateColor: (index: number, newHex: string) => void
  onToggleLock: (index: number) => void
}

export function PaletteEditor({
  colors,
  onUpdateColor,
  onToggleLock,
}: PaletteEditorProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  const handleCopy = async (hex: string, index: number) => {
    const success = await copyToClipboard(hex)
    if (success) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1800)
    }
  }

  const handleStartEdit = (index: number, currentHex: string) => {
    setEditingIndex(index)
    setEditValue(currentHex)
  }

  const handleCommitEdit = (index: number) => {
    const normalized = normalizeHex(editValue)
    if (normalized) {
      onUpdateColor(index, normalized)
    }
    setEditingIndex(null)
  }

  return (
    <div className="w-full">
      {/* Contenedor de muestras cromáticas: en desktop es horizontal, en móvil se adapta fluidamente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row gap-3 sm:gap-4 lg:gap-2 lg:h-[340px] w-full rounded-2xl overflow-hidden p-1.5 sm:p-2 bg-slate-100/80 border border-slate-200">
        {colors.map((color, index) => {
          const textColor = getContrastingTextColor(color.hex)
          const isCopied = copiedIndex === index
          const isEditing = editingIndex === index

          return (
            <motion.div
              key={color.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{ backgroundColor: color.hex }}
              className="relative lg:flex-1 min-h-[170px] sm:min-h-[220px] lg:min-h-full rounded-xl p-4 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md group"
            >
              {/* Barra superior de la muestra: Bloqueo e indicador */}
              <div className="flex items-center justify-between w-full">
                <span
                  style={{ color: textColor }}
                  className="text-xs font-bold tracking-wide uppercase opacity-90 select-none"
                >
                  {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => onToggleLock(index)}
                  aria-label={color.locked ? `Desbloquear color ${color.hex}` : `Bloquear color ${color.hex}`}
                  title={color.locked ? "Color bloqueado al regenerar" : "Bloquear color"}
                  style={{
                    color: textColor,
                    backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.45)",
                  }}
                  className="p-2 rounded-lg backdrop-blur-xs transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                >
                  {color.locked ? (
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Unlock className="w-4 h-4 opacity-70 group-hover:opacity-100" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Centro de la muestra: Valores de color y selector interactivo */}
              <div className="my-auto py-2 text-center">
                {isEditing ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCommitEdit(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCommitEdit(index)
                        if (e.key === "Escape") setEditingIndex(null)
                      }}
                      autoFocus
                      className="w-28 px-2 py-1 text-center font-mono font-bold text-sm bg-white text-slate-900 rounded-lg shadow-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      maxLength={7}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(index, color.hex)}
                    style={{ color: textColor }}
                    title="Hacé clic para escribir otro código HEX"
                    className="font-mono font-extrabold text-lg sm:text-xl tracking-wider cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 rounded px-1"
                  >
                    {color.hex}
                  </button>
                )}

                {/* Etiquetas de valores RGB y HSL */}
                <div
                  style={{ color: textColor }}
                  className="mt-1 text-[11px] font-medium opacity-85 space-y-0.5 select-none"
                >
                  <div>
                    RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                  </div>
                  <div>
                    HSL({color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%)
                  </div>
                </div>
              </div>

              {/* Barra inferior: Selector nativo de color y botón de copiar */}
              <div className="flex items-center justify-between w-full pt-2">
                {/* Selector nativo estilizado */}
                <label
                  title="Abrir selector de color visual"
                  style={{
                    color: textColor,
                    backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.45)",
                  }}
                  className="relative p-2 rounded-lg backdrop-blur-xs cursor-pointer transition-transform active:scale-90 flex items-center justify-center min-h-[38px] min-w-[38px] focus-within:ring-2 focus-within:ring-purple-600"
                >
                  <Pipette className="w-4 h-4" aria-hidden="true" />
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => onUpdateColor(index, e.target.value.toUpperCase())}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    aria-label={`Cambiar tono del color ${index + 1}`}
                  />
                </label>

                {/* Botón copiar HEX */}
                <button
                  type="button"
                  onClick={() => handleCopy(color.hex, index)}
                  aria-label={`Copiar código ${color.hex}`}
                  title="Copiar código HEX"
                  style={{
                    color: textColor,
                    backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.45)",
                  }}
                  className="p-2 rounded-lg backdrop-blur-xs transition-transform active:scale-90 flex items-center justify-center min-h-[38px] min-w-[38px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
