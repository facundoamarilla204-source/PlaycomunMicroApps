"use client"

import { useState } from "react"
import { Eye, CheckCircle2, XCircle, Wand2, ArrowLeftRight } from "lucide-react"
import {
  calculateContrast,
  suggestContrastAdjustment,
} from "@/lib/color-palette/contrast-checker"
import { normalizeHex, isValidHex } from "@/lib/color-palette/color-converter"

interface ContrastCheckerSectionProps {
  paletteColors: string[]
}

export function ContrastCheckerSection({ paletteColors }: ContrastCheckerSectionProps) {
  const [foreground, setForeground] = useState<string>(paletteColors[0] || "#0F172A")
  const [background, setBackground] = useState<string>(paletteColors[paletteColors.length - 1] || "#FFFFFF")
  const [suggestedColor, setSuggestedColor] = useState<string | null>(null)

  const contrast = calculateContrast(foreground, background)

  const handleSwap = () => {
    const prevFg = foreground
    setForeground(background)
    setBackground(prevFg)
    setSuggestedColor(null)
  }

  const handleCheckSuggestion = () => {
    const candidate = suggestContrastAdjustment(foreground, background, 4.5)
    setSuggestedColor(candidate)
  }

  const handleApplySuggestion = () => {
    if (suggestedColor) {
      setForeground(suggestedColor)
      setSuggestedColor(null)
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs space-y-8">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Eye className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Contraste y accesibilidad (WCAG 2.2)
          </h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Comprobá la legibilidad real entre el color de texto y el fondo según la fórmula oficial de luminancia sRGB. Evaluá criterios para texto normal, texto grande y componentes gráficos.
        </p>
      </div>

      {/* Selectores de color y chips rápidos de la paleta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Selector de Texto (Foreground) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="fg-color-picker" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Color de texto (Primer plano)
            </label>
            <span className="font-mono text-xs font-bold text-slate-700">{foreground}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="fg-color-picker"
              type="color"
              value={foreground}
              onChange={(e) => {
                setForeground(e.target.value.toUpperCase())
                setSuggestedColor(null)
              }}
              className="w-12 h-10 p-0 rounded-lg border border-slate-300 cursor-pointer bg-white"
            />
            <input
              type="text"
              value={foreground}
              onChange={(e) => {
                const val = e.target.value.toUpperCase()
                setForeground(val)
                setSuggestedColor(null)
              }}
              onBlur={() => {
                if (isValidHex(foreground)) setForeground(normalizeHex(foreground)!)
              }}
              maxLength={7}
              className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Chips de colores de la paleta activa */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Cargar desde tu paleta:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {paletteColors.map((hex, i) => (
                <button
                  key={`fg-${hex}-${i}`}
                  type="button"
                  onClick={() => {
                    setForeground(hex)
                    setSuggestedColor(null)
                  }}
                  style={{ backgroundColor: hex }}
                  title={`Usar ${hex} como texto`}
                  className={`w-7 h-7 rounded-md border transition-transform active:scale-90 cursor-pointer ${
                    foreground === hex ? "ring-2 ring-purple-600 ring-offset-1 border-white" : "border-slate-300"
                  }`}
                  aria-label={`Usar color ${hex} como texto`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selector de Fondo (Background) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="bg-color-picker" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Color de fondo (Superficie)
            </label>
            <span className="font-mono text-xs font-bold text-slate-700">{background}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="bg-color-picker"
              type="color"
              value={background}
              onChange={(e) => {
                setBackground(e.target.value.toUpperCase())
                setSuggestedColor(null)
              }}
              className="w-12 h-10 p-0 rounded-lg border border-slate-300 cursor-pointer bg-white"
            />
            <input
              type="text"
              value={background}
              onChange={(e) => {
                const val = e.target.value.toUpperCase()
                setBackground(val)
                setSuggestedColor(null)
              }}
              onBlur={() => {
                if (isValidHex(background)) setBackground(normalizeHex(background)!)
              }}
              maxLength={7}
              className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Chips de colores de la paleta activa */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Cargar desde tu paleta:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {paletteColors.map((hex, i) => (
                <button
                  key={`bg-${hex}-${i}`}
                  type="button"
                  onClick={() => {
                    setBackground(hex)
                    setSuggestedColor(null)
                  }}
                  style={{ backgroundColor: hex }}
                  title={`Usar ${hex} como fondo`}
                  className={`w-7 h-7 rounded-md border transition-transform active:scale-90 cursor-pointer ${
                    background === hex ? "ring-2 ring-purple-600 ring-offset-1 border-white" : "border-slate-300"
                  }`}
                  aria-label={`Usar color ${hex} como fondo`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Botón para intercambiar texto y fondo */}
      <div className="flex justify-center -my-3">
        <button
          type="button"
          onClick={handleSwap}
          className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
          title="Intercambiar colores de texto y fondo"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Invertir colores</span>
        </button>
      </div>

      {/* Resultado de Contraste y Vista Previa en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Razón Numérica y Criterios WCAG */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Relación de contraste calculada
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 tracking-tight">
                {contrast.ratioFormatted}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  contrast.normalTextAA
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : contrast.largeTextAA
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {contrast.normalTextAA
                  ? "Pasa WCAG AA"
                  : contrast.largeTextAA
                  ? "Solo texto grande"
                  : "Contraste insuficiente"}
              </span>
            </div>
          </div>

          {/* Tabla de verificación de umbrales WCAG 2.2 */}
          <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-700 font-medium">Texto normal (&lt; 18pt) · Nivel AA (4.5:1)</span>
              {contrast.normalTextAA ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Pasa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Falla
                </span>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-700 font-medium">Texto grande (≥ 18pt / 14pt negrita) · Nivel AA (3:1)</span>
              {contrast.largeTextAA ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Pasa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Falla
                </span>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-700 font-medium">Texto normal · Nivel AAA (7:1)</span>
              {contrast.normalTextAAA ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Pasa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                  No alcanza
                </span>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-700 font-medium">Componentes gráficos y bordes de UI (3:1)</span>
              {contrast.uiComponentsAA ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Pasa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Falla
                </span>
              )}
            </div>
          </div>

          {/* Sugerencia automática si falla texto normal AA */}
          {!contrast.normalTextAA && (
            <div className="pt-2 border-t border-slate-200">
              {suggestedColor ? (
                <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-xs text-purple-950 font-medium">
                    Tono sugerido con contraste verificado de 4.5:1:
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: suggestedColor }}
                        className="w-5 h-5 rounded-md border border-slate-300"
                      />
                      <span className="font-mono font-bold text-xs text-purple-900">{suggestedColor}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors min-h-[32px] cursor-pointer"
                    >
                      Aplicar ajuste
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckSuggestion}
                  className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sugerir tono accesible para texto</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Muestra Visual en Vivo sobre el Fondo */}
        <div
          style={{ backgroundColor: background }}
          className="lg:col-span-7 rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-6 transition-colors"
        >
          <div className="space-y-3">
            <span
              style={{ color: foreground }}
              className="text-xs font-bold uppercase tracking-wider opacity-80"
            >
              Vista previa interactiva
            </span>
            <h3
              style={{ color: foreground }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug"
            >
              Diseñá interfaces accesibles y claras
            </h3>
            <p
              style={{ color: foreground }}
              className="text-sm sm:text-base leading-relaxed"
            >
              Este párrafo representa texto normal de lectura (15px-16px). Un buen contraste asegura que todas las personas puedan leer la información sin forzar la vista, incluso en pantallas bajo la luz solar directa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div
              style={{
                borderColor: foreground,
                color: foreground,
              }}
              className="px-4 py-2 rounded-xl border-2 text-xs font-bold inline-flex items-center gap-2 select-none"
            >
              <span>Botón secundario</span>
            </div>

            <div
              style={{
                backgroundColor: foreground,
                color: background,
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs select-none"
            >
              <span>Botón primario</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
