"use client"

import React from "react"
import {
  OperationType,
  OutputFormatChoice,
  ProcessingConfig,
  QualityPreset,
} from "@/lib/image-processor/types"
import {
  Sliders,
  Maximize2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Minimize2,
} from "lucide-react"

interface GlobalConfigPanelProps {
  config: ProcessingConfig
  onChange: (newConfig: ProcessingConfig) => void
  disabled?: boolean
  hasTransparentImagesInBatch?: boolean
}

export function GlobalConfigPanel({
  config,
  onChange,
  disabled = false,
  hasTransparentImagesInBatch = false,
}: GlobalConfigPanelProps) {
  const handleOperationChange = (op: OperationType) => {
    let nextTarget = config.targetFormat
    if (op === "compress") {
      nextTarget = "original"
    } else if (op === "convert" && nextTarget === "original") {
      nextTarget = "webp"
    }
    onChange({
      ...config,
      operation: op,
      targetFormat: nextTarget,
    })
  }

  const handleFormatChange = (fmt: OutputFormatChoice) => {
    onChange({
      ...config,
      targetFormat: fmt,
    })
  }

  const handlePresetChange = (preset: QualityPreset) => {
    let val = config.qualityValue
    if (preset === "max") val = 0.78
    if (preset === "balanced") val = 0.65
    if (preset === "min") val = 0.45

    onChange({
      ...config,
      qualityPreset: preset,
      qualityValue: val,
    })
  }

  const isConvertingToJpg =
    config.targetFormat === "jpeg" ||
    (config.operation !== "compress" && config.targetFormat === "jpeg")

  const showTransparencyWarning =
    isConvertingToJpg &&
    (hasTransparentImagesInBatch || config.operation !== "compress")

  const isPngOutput =
    config.targetFormat === "png" ||
    (config.targetFormat === "original" && config.operation === "compress")

  return (
    <div className="w-full bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Selector de Operación */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          ¿Qué operación querés realizar?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOperationChange("compress")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              config.operation === "compress"
                ? "border-brand bg-brand-light text-brand shadow-xs ring-1 ring-brand"
                : "border-border hover:border-brand/40 bg-white text-foreground hover:bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              <Minimize2 className="h-4 w-4 shrink-0" />
              <span>Solo Comprimir</span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Conserva el formato original de cada imagen y reduce su peso.
            </p>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOperationChange("convert")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              config.operation === "convert"
                ? "border-brand bg-brand-light text-brand shadow-xs ring-1 ring-brand"
                : "border-border hover:border-brand/40 bg-white text-foreground hover:bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              <ArrowRightLeft className="h-4 w-4 shrink-0" />
              <span>Solo Convertir</span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Transforma a otro formato manteniendo la máxima fidelidad visual.
            </p>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOperationChange("compress-and-convert")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              config.operation === "compress-and-convert"
                ? "border-brand bg-brand-light text-brand shadow-xs ring-1 ring-brand"
                : "border-border hover:border-brand/40 bg-white text-foreground hover:bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Comprimir y Convertir</span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Cambia de formato y optimiza el peso en un solo proceso.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Formato de Salida */}
      <div className="pt-2 border-t border-border/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <label className="text-sm font-semibold text-foreground">
            Formato de salida
          </label>
          <span className="text-xs text-foreground-subtle">
            {config.operation === "compress"
              ? "En modo compresión se conserva el formato de cada imagen"
              : "Seleccioná el formato final para todo el lote"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleFormatChange("original")}
            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer text-center ${
              config.targetFormat === "original"
                ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                : "border-border bg-white text-foreground hover:bg-neutral-50"
            }`}
          >
            Mantener original
          </button>

          <button
            type="button"
            disabled={disabled || config.operation === "compress"}
            onClick={() => handleFormatChange("jpeg")}
            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer text-center ${
              config.targetFormat === "jpeg"
                ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                : "border-border bg-white text-foreground hover:bg-neutral-50"
            } ${config.operation === "compress" ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            JPG / JPEG
          </button>

          <button
            type="button"
            disabled={disabled || config.operation === "compress"}
            onClick={() => handleFormatChange("webp")}
            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer text-center ${
              config.targetFormat === "webp"
                ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                : "border-border bg-white text-foreground hover:bg-neutral-50"
            } ${config.operation === "compress" ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            WebP (Recomendado)
          </button>

          <button
            type="button"
            disabled={disabled || config.operation === "compress"}
            onClick={() => handleFormatChange("png")}
            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer text-center ${
              config.targetFormat === "png"
                ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                : "border-border bg-white text-foreground hover:bg-neutral-50"
            } ${config.operation === "compress" ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            PNG
          </button>
        </div>
      </div>

      {/* Alerta de Transparencia a JPG */}
      {showTransparencyWarning && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-snug">
              <strong>Atención:</strong> El formato JPG no admite transparencias. Las zonas transparentes se rellenarán con un color de fondo.
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs font-medium text-amber-900">
              Color de fondo para reemplazo:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={disabled}
                value={config.backgroundColor}
                onChange={(e) =>
                  onChange({ ...config, backgroundColor: e.target.value })
                }
                className="h-8 w-10 cursor-pointer rounded border border-amber-300 p-0.5 bg-white"
                aria-label="Color de fondo para zonas transparentes"
              />
              <span className="text-xs font-mono text-amber-800 uppercase">
                {config.backgroundColor}
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...config, backgroundColor: "#ffffff" })}
                className="text-xs underline text-amber-800 hover:text-amber-950 ml-1 cursor-pointer"
              >
                Blanco
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, backgroundColor: "#000000" })}
                className="text-xs underline text-amber-800 hover:text-amber-950 ml-1 cursor-pointer"
              >
                Negro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Control de Calidad */}
      {config.operation !== "convert" && (
        <div className="pt-2 border-t border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-brand" />
              Nivel de calidad
            </label>
            <span className="text-xs font-semibold text-brand">
              {Math.round(config.qualityValue * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePresetChange("max")}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                config.qualityPreset === "max"
                  ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                  : "border-border bg-white text-foreground hover:bg-neutral-50"
              }`}
            >
              Máxima calidad (78%)
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePresetChange("balanced")}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                config.qualityPreset === "balanced"
                  ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                  : "border-border bg-white text-foreground hover:bg-neutral-50"
              }`}
            >
              Equilibrado (65%)
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePresetChange("min")}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                config.qualityPreset === "min"
                  ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                  : "border-border bg-white text-foreground hover:bg-neutral-50"
              }`}
            >
              Menor peso (45%)
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePresetChange("custom")}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                config.qualityPreset === "custom"
                  ? "border-brand bg-brand-light text-brand font-semibold ring-1 ring-brand"
                  : "border-border bg-white text-foreground hover:bg-neutral-50"
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Slider manual */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-foreground-subtle">
              <span>Mayor compresión (menor peso)</span>
              <span>Mayor fidelidad visual</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              disabled={disabled}
              value={Math.round(config.qualityValue * 100)}
              onChange={(e) =>
                onChange({
                  ...config,
                  qualityPreset: "custom",
                  qualityValue: Number(e.target.value) / 100,
                })
              }
              aria-label="Ajustar porcentaje de calidad visual"
              className="w-full accent-brand cursor-pointer h-2 bg-neutral-200 rounded-lg"
            />
          </div>

          {isPngOutput && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>¿Tus PNGs pesan mucho?</strong> PNG es un formato sin pérdida. Para reducir hasta un <strong>80% del peso</strong> conservando el fondo transparente, convertí tus imágenes a <strong>WebP</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFormatChange("webp")}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cambiar a WebP
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Redimensionamiento Opcional */}
      <div className="pt-2 border-t border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={disabled}
              checked={config.enableResize}
              onChange={(e) =>
                onChange({ ...config, enableResize: e.target.checked })
              }
              className="rounded border-border text-brand focus:ring-brand h-4 w-4 accent-brand cursor-pointer"
            />
            <span>Limitar dimensiones máximas (Opcional)</span>
          </label>
          <span className="text-xs text-foreground-subtle">
            {config.enableResize ? "Activo" : "Desactivado"}
          </span>
        </div>

        {config.enableResize && (
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">
                  Ancho máximo (píxeles)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    placeholder="Ej. 1920"
                    value={config.maxWidth ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        maxWidth: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <span className="absolute right-3 top-2 text-xs text-foreground-subtle">
                    px
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">
                  Alto máximo (píxeles)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    placeholder="Ej. 1080"
                    value={config.maxHeight ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        maxHeight: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <span className="absolute right-3 top-2 text-xs text-foreground-subtle">
                    px
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-foreground-subtle">
              Mantiene siempre la proporción original y nunca agranda imágenes que ya tengan menor tamaño.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
