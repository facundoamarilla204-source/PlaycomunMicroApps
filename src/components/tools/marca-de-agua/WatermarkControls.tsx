"use client"

import React, { useRef } from "react"
import {
  FontOption,
  OutputFormat,
  PresetPosition,
  WatermarkConfig,
  WatermarkMode,
  WatermarkType,
} from "@/lib/watermark/types"
import {
  AVAILABLE_FONTS,
  PRESET_POSITION_LABELS,
} from "@/lib/watermark/layout"
import {
  Type,
  Image as ImageIcon,
  Grid,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  Sun,
  Shield,
  Upload,
  Trash2,
  Layers,
  Settings2,
  Minus,
  Plus,
} from "lucide-react"

interface WatermarkControlsProps {
  config: WatermarkConfig
  onChange: (updated: Partial<WatermarkConfig>) => void
  onLogoUpload: (file: File) => void
  onLogoRemove: () => void
  logoImg: HTMLImageElement | null
}

const PRESET_COLORS = [
  { name: "Blanco", hex: "#ffffff" },
  { name: "Negro", hex: "#0f172a" },
  { name: "Gris", hex: "#94a3b8" },
  { name: "Dorado", hex: "#f59e0b" },
  { name: "Marca PlayComun", hex: "#7f22fe" },
  { name: "Rojo", hex: "#ef4444" },
]

export function WatermarkControls({
  config,
  onChange,
  onLogoUpload,
  onLogoRemove,
  logoImg,
}: WatermarkControlsProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleTextConfigChange = (partial: Partial<WatermarkConfig["textConfig"]>) => {
    onChange({
      textConfig: {
        ...config.textConfig,
        ...partial,
      },
    })
  }

  const handleImageConfigChange = (partial: Partial<WatermarkConfig["imageConfig"]>) => {
    onChange({
      imageConfig: {
        ...config.imageConfig,
        ...partial,
      },
    })
  }

  const handleRepeatConfigChange = (partial: Partial<WatermarkConfig["repeatConfig"]>) => {
    onChange({
      repeatConfig: {
        ...config.repeatConfig,
        ...partial,
      },
    })
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLogoUpload(e.target.files[0])
      e.target.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      {/* 1. Selector de Tipo: Texto vs Logotipo */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Tipo de marca de agua
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => onChange({ type: "text" })}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all btn-tactile ${
              config.type === "text"
                ? "bg-white text-brand shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Type className="h-4 w-4" />
            <span>Texto</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ type: "image" })}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all btn-tactile ${
              config.type === "image"
                ? "bg-white text-brand shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Logotipo</span>
          </button>
        </div>
      </div>

      {/* 2. Selector de Modalidad: Única vs Repetida (Patrón) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Disposición en la imagen
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => onChange({ mode: "single" })}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium transition-all btn-tactile ${
              config.mode === "single"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4 text-slate-500" />
            <span>Marca única</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: "repeated" })}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium transition-all btn-tactile ${
              config.mode === "repeated"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Grid className="h-4 w-4 text-slate-500" />
            <span>Patrón repetido</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 3. Ajustes específicos de TEXTO */}
      {config.type === "text" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="watermark-text" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Texto de la marca
              </label>
              <span className="text-[11px] text-slate-400">Admite saltos de línea</span>
            </div>
            <textarea
              id="watermark-text"
              rows={2}
              value={config.textConfig.text}
              onChange={(e) => handleTextConfigChange({ text: e.target.value })}
              placeholder="Escribí tu marca, nombre o sitio web..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Tipografía */}
          <div className="space-y-1.5">
            <label htmlFor="font-family" className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tipografía
            </label>
            <select
              id="font-family"
              value={config.textConfig.fontFamily}
              onChange={(e) => handleTextConfigChange({ fontFamily: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.id} value={font.family}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tamaño relativo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-700">
              <span className="font-bold uppercase tracking-wider text-slate-600">Tamaño relativo</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                {config.textConfig.fontSizeRel}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleTextConfigChange({
                    fontSizeRel: Math.max(2, parseFloat((config.textConfig.fontSizeRel - 0.5).toFixed(1))),
                  })
                }
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition-all shadow-2xs"
                title="Reducir tamaño"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <input
                type="range"
                min="2"
                max="35"
                step="0.5"
                value={config.textConfig.fontSizeRel}
                onChange={(e) => handleTextConfigChange({ fontSizeRel: parseFloat(e.target.value) })}
                onInput={(e: React.FormEvent<HTMLInputElement>) =>
                  handleTextConfigChange({ fontSizeRel: parseFloat((e.target as HTMLInputElement).value) })
                }
                className="w-full accent-brand cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                style={{ touchAction: "none" }}
              />

              <button
                type="button"
                onClick={() =>
                  handleTextConfigChange({
                    fontSizeRel: Math.min(35, parseFloat((config.textConfig.fontSizeRel + 0.5).toFixed(1))),
                  })
                }
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition-all shadow-2xs"
                title="Aumentar tamaño"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Accesos rápidos de tamaño para móviles */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400 mr-0.5">Rápidos:</span>
              {[
                { label: "Chico", val: 4 },
                { label: "Normal", val: 6.5 },
                { label: "Medio", val: 10 },
                { label: "Grande", val: 16 },
                { label: "Extra", val: 24 },
                { label: "Máx", val: 32 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleTextConfigChange({ fontSizeRel: p.val })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    Math.abs(config.textConfig.fontSizeRel - p.val) < 0.3
                      ? "bg-brand text-white font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label} ({p.val}%)
                </button>
              ))}
            </div>
          </div>

          {/* Color y Opacidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Color del texto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.textConfig.color}
                  onChange={(e) => handleTextConfigChange({ color: e.target.value })}
                  className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={config.textConfig.color}
                  onChange={(e) => handleTextConfigChange({ color: e.target.value })}
                  className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono uppercase text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Opacidad</span>
                <span className="font-mono text-slate-500">
                  {Math.round(config.textConfig.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.textConfig.opacity}
                onChange={(e) => handleTextConfigChange({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-brand cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Swatches rápidos de color */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 mr-1">Rápidos:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => handleTextConfigChange({ color: c.hex })}
                className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
                  config.textConfig.color.toLowerCase() === c.hex.toLowerCase()
                    ? "ring-2 ring-brand ring-offset-1"
                    : "border-slate-300"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Alineación multilínea y Rotación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Alineación
              </label>
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => handleTextConfigChange({ align })}
                    className={`flex-1 flex justify-center py-1.5 rounded text-xs transition-colors ${
                      config.textConfig.align === align
                        ? "bg-white text-slate-900 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                    {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                    {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Rotación</span>
                <span className="font-mono text-slate-500">{config.textConfig.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={config.textConfig.rotation}
                onChange={(e) => handleTextConfigChange({ rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <button type="button" onClick={() => handleTextConfigChange({ rotation: 0 })} className="hover:text-slate-700">0°</button>
                <button type="button" onClick={() => handleTextConfigChange({ rotation: -45 })} className="hover:text-slate-700">-45°</button>
                <button type="button" onClick={() => handleTextConfigChange({ rotation: 45 })} className="hover:text-slate-700">45°</button>
                <button type="button" onClick={() => handleTextConfigChange({ rotation: 90 })} className="hover:text-slate-700">90°</button>
              </div>
            </div>
          </div>

          {/* Mejoras de legibilidad (Sombra y Contorno) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Legibilidad en fondos claros y oscuros
            </span>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={config.textConfig.enableShadow}
                  onChange={(e) => handleTextConfigChange({ enableShadow: e.target.checked })}
                  className="rounded border-slate-300 text-brand focus:ring-brand h-4 w-4"
                />
                <span>Sombra sutil</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={config.textConfig.enableStroke}
                  onChange={(e) => handleTextConfigChange({ enableStroke: e.target.checked })}
                  className="rounded border-slate-300 text-brand focus:ring-brand h-4 w-4"
                />
                <span>Contorno / Trazo</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 4. Ajustes específicos de LOGOTIPO */}
      {config.type === "image" && (
        <div className="space-y-4">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoFileChange}
            className="hidden"
          />

          {!logoImg ? (
            <div
              onClick={() => logoInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand/70 bg-slate-50/50 hover:bg-brand-light/30 cursor-pointer transition-all text-center"
            >
              <Upload className="h-7 w-7 text-brand mb-2" />
              <span className="text-sm font-semibold text-slate-800">
                Cargar archivo de logotipo
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                PNG transparente, JPG o WebP
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoImg.src}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {config.imageConfig.logoFile?.name || "Logotipo cargado"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {logoImg.naturalWidth} × {logoImg.naturalHeight} px
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={onLogoRemove}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Quitar logo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Los logos en formato PNG o WebP conservan su transparencia natural intacta sin agregar fondos blancos.
          </p>

          {/* Escala del logo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-700">
              <span className="font-bold uppercase tracking-wider text-slate-600">Tamaño del logotipo</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                {config.imageConfig.scaleRel}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleImageConfigChange({
                    scaleRel: Math.max(8, config.imageConfig.scaleRel - 2),
                  })
                }
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition-all shadow-2xs"
                title="Reducir logo"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <input
                type="range"
                min="8"
                max="70"
                step="1"
                value={config.imageConfig.scaleRel}
                onChange={(e) => handleImageConfigChange({ scaleRel: parseInt(e.target.value, 10) })}
                onInput={(e: React.FormEvent<HTMLInputElement>) =>
                  handleImageConfigChange({ scaleRel: parseInt((e.target as HTMLInputElement).value, 10) })
                }
                className="w-full accent-brand cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                style={{ touchAction: "none" }}
              />

              <button
                type="button"
                onClick={() =>
                  handleImageConfigChange({
                    scaleRel: Math.min(70, config.imageConfig.scaleRel + 2),
                  })
                }
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition-all shadow-2xs"
                title="Aumentar logo"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Accesos rápidos de logo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400 mr-0.5">Rápidos:</span>
              {[
                { label: "Discreto", val: 14 },
                { label: "Normal", val: 24 },
                { label: "Medio", val: 36 },
                { label: "Prominente", val: 50 },
                { label: "Máx", val: 65 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleImageConfigChange({ scaleRel: p.val })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    Math.abs(config.imageConfig.scaleRel - p.val) < 2
                      ? "bg-brand text-white font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label} ({p.val}%)
                </button>
              ))}
            </div>
          </div>

          {/* Opacidad del logo */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Opacidad</span>
              <span className="font-mono text-slate-500">
                {Math.round(config.imageConfig.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.imageConfig.opacity}
              onChange={(e) => handleImageConfigChange({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-brand cursor-pointer"
            />
          </div>

          {/* Rotación del logo */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Rotación</span>
              <span className="font-mono text-slate-500">{config.imageConfig.rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={config.imageConfig.rotation}
              onChange={(e) => handleImageConfigChange({ rotation: parseInt(e.target.value, 10) })}
              className="w-full accent-brand cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="h-px bg-slate-100" />

      {/* 5. Posicionamiento en Marca Única */}
      {config.mode === "single" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ubicación predefinida (9 posiciones)
            </label>
            {config.position === "custom" && (
              <span className="text-[11px] font-medium text-brand bg-brand-light px-2 py-0.5 rounded-md">
                Posición arrastrada manual
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto p-1.5 bg-slate-100 rounded-xl">
            {(
              [
                "top-left", "top-center", "top-right",
                "middle-left", "center", "middle-right",
                "bottom-left", "bottom-center", "bottom-right",
              ] as PresetPosition[]
            ).map((pos) => {
              const isSelected = config.position === pos
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onChange({ position: pos })}
                  className={`h-9 rounded-lg text-[11px] font-medium transition-all ${
                    isSelected
                      ? "bg-brand text-white shadow-xs font-semibold scale-105"
                      : "bg-white text-slate-700 hover:bg-slate-200/80"
                  }`}
                  title={PRESET_POSITION_LABELS[pos]}
                >
                  {pos === "top-left" && "↖ Sup.I"}
                  {pos === "top-center" && "↑ Sup.C"}
                  {pos === "top-right" && "↗ Sup.D"}
                  {pos === "middle-left" && "← Med.I"}
                  {pos === "center" && "• Centro"}
                  {pos === "middle-right" && "Med.D →"}
                  {pos === "bottom-left" && "↙ Inf.I"}
                  {pos === "bottom-center" && "↓ Inf.C"}
                  {pos === "bottom-right" && "↘ Inf.D"}
                </button>
              )
            })}
          </div>

          {/* Margen */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Margen desde los bordes</span>
              <span className="font-mono text-slate-500">
                {config.type === "text" ? config.textConfig.margin : config.imageConfig.margin}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="16"
              step="0.5"
              value={config.type === "text" ? config.textConfig.margin : config.imageConfig.margin}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (config.type === "text") handleTextConfigChange({ margin: val })
                else handleImageConfigChange({ margin: val })
              }}
              className="w-full accent-brand cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 6. Configuración de Patrón Repetido */}
      {config.mode === "repeated" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Separación horizontal y vertical</span>
              <span className="font-mono text-slate-500">{config.repeatConfig.gapXRel}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="240"
              step="10"
              value={config.repeatConfig.gapXRel}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                handleRepeatConfigChange({ gapXRel: val, gapYRel: val })
              }}
              className="w-full accent-brand cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Inclinación del patrón</span>
              <span className="font-mono text-slate-500">{config.repeatConfig.angle}°</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="5"
              value={config.repeatConfig.angle}
              onChange={(e) => handleRepeatConfigChange({ angle: parseInt(e.target.value, 10) })}
              className="w-full accent-brand cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="h-px bg-slate-100" />

      {/* 7. Exportación y formato */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5 text-slate-500" />
          Formato de exportación
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: "original", label: "Original" },
              { id: "jpeg", label: "JPG" },
              { id: "png", label: "PNG" },
              { id: "webp", label: "WebP" },
            ] as { id: OutputFormat; label: string }[]
          ).map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => onChange({ outputFormat: fmt.id })}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                config.outputFormat === fmt.id
                  ? "border-brand bg-brand text-white font-semibold shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {(config.outputFormat === "jpeg" || config.outputFormat === "webp" || config.outputFormat === "original") && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Calidad de compresión</span>
              <span className="font-mono text-slate-500">{Math.round(config.quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.0"
              step="0.05"
              value={config.quality}
              onChange={(e) => onChange({ quality: parseFloat(e.target.value) })}
              className="w-full accent-brand cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  )
}
