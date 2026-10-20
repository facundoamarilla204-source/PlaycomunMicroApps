"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Copy, Check, Download, FileCode, FileJson, Image as ImageIcon, Sparkles } from "lucide-react"
import {
  exportCss,
  exportJson,
  exportTailwind,
  downloadPalettePng,
  downloadTextFile,
  copyToClipboard,
} from "@/lib/color-palette/palette-exporter"

interface PaletteExportModalProps {
  isOpen: boolean
  onClose: () => void
  colors: string[]
  paletteName?: string
}

type TabType = "css" | "json" | "tailwind" | "png"

export function PaletteExportModal({
  isOpen,
  onClose,
  colors,
  paletteName = "Paleta PlayComun",
}: PaletteExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("css")
  const [copied, setCopied] = useState<boolean>(false)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  if (!isOpen) return null

  const cssContent = exportCss(colors, paletteName)
  const jsonContent = exportJson(colors, paletteName)
  const tailwindContent = exportTailwind(colors, paletteName)

  const handleCopy = async (content: string) => {
    const success = await copyToClipboard(content)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = async () => {
    const safeName = paletteName.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "paleta"

    if (activeTab === "css") {
      downloadTextFile(cssContent, `${safeName}.css`, "text/css")
    } else if (activeTab === "json") {
      downloadTextFile(jsonContent, `${safeName}.json`, "application/json")
    } else if (activeTab === "tailwind") {
      downloadTextFile(tailwindContent, `tailwind-${safeName}.txt`, "text/plain")
    } else if (activeTab === "png") {
      setIsDownloading(true)
      try {
        await downloadPalettePng(colors, paletteName)
      } finally {
        setIsDownloading(false)
      }
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Encabezado del modal */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100">
            <div>
              <h2 id="export-modal-title" className="text-xl font-bold text-slate-900">
                Exportar paleta de colores
              </h2>
              <p className="text-xs text-slate-500">
                Seleccioná el formato ideal para tu código, diseño o presentación
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Cerrar modal de exportación"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Pestañas de formatos */}
          <div className="flex border-b border-slate-100 px-5 sm:px-6 gap-2 overflow-x-auto scrollbar-hide pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("css")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "css"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileCode className="w-4 h-4" aria-hidden="true" />
              <span>Variables CSS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "json"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileJson className="w-4 h-4" aria-hidden="true" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tailwind")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "tailwind"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Tailwind CSS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("png")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "png"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-4 h-4" aria-hidden="true" />
              <span>Imagen PNG</span>
            </button>
          </div>

          {/* Cuerpo de contenido según la pestaña */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {activeTab === "css" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Pegá estas variables en tu archivo <code>globals.css</code> o en la hoja de estilos de tu proyecto:
                </p>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  {cssContent}
                </pre>
              </div>
            )}

            {activeTab === "json" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Estructura JSON válida con valores HEX, RGB y HSL para APIs, tokens de diseño o scripts:
                </p>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-64">
                  {jsonContent}
                </pre>
              </div>
            )}

            {activeTab === "tailwind" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Configuración para Tailwind CSS v4 (mediante directiva <code>@theme</code>) y para Tailwind CSS v3 (<code>tailwind.config.js</code>):
                </p>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-64">
                  {tailwindContent}
                </pre>
              </div>
            )}

            {activeTab === "png" && (
              <div className="space-y-4 text-center py-4">
                <div className="flex h-24 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm mx-auto max-w-lg">
                  {colors.map((c, i) => (
                    <div
                      key={`preview-png-${c}-${i}`}
                      style={{ backgroundColor: c }}
                      className="flex-1 h-full"
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Genera una tarjeta gráfica nítida de 1200x630 px con cada muestra de color, códigos HEX y proporciones visuales para compartir en presentaciones o redes.
                </p>
              </div>
            )}
          </div>

          {/* Pie de acciones */}
          <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeTab !== "png" && (
                <button
                  type="button"
                  onClick={() => {
                    const content =
                      activeTab === "css"
                        ? cssContent
                        : activeTab === "json"
                        ? jsonContent
                        : tailwindContent
                    handleCopy(content)
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300/80 text-slate-800 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>Copiar código</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>
                  {activeTab === "png"
                    ? isDownloading
                      ? "Generando..."
                      : "Descargar PNG"
                    : "Descargar archivo"}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
