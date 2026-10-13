"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Scissors,
  Archive,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Layers,
  Info,
} from "lucide-react"
import {
  DocumentPage,
  LoadedPdfFile,
  SplitMode,
  SplitResultItem,
} from "@/lib/pdf-editor/types"
import {
  splitPdfDocument,
  exportSplitZip,
  formatBytes,
} from "@/lib/pdf-editor/pdf-engine"

interface SplitModalProps {
  isOpen: boolean
  onClose: () => void
  pages: DocumentPage[]
  sourceFiles: LoadedPdfFile[]
}

export function SplitModal({
  isOpen,
  onClose,
  pages,
  sourceFiles,
}: SplitModalProps) {
  const [mode, setMode] = useState<SplitMode>("fixed_chunks")
  const [chunkSize, setChunkSize] = useState<number>(Math.min(10, Math.max(1, Math.ceil(pages.length / 2))))
  const [customRanges, setCustomRanges] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [splitResults, setSplitResults] = useState<SplitResultItem[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  // Calculate live preview
  let previewDescription = ""
  let estimatedFilesCount = 0

  if (mode === "single_pages") {
    estimatedFilesCount = pages.length
    previewDescription = `Se generarán ${pages.length} archivos PDF independientes (1 página por documento).`
  } else if (mode === "fixed_chunks") {
    const size = Math.max(1, chunkSize)
    estimatedFilesCount = Math.ceil(pages.length / size)
    previewDescription = `Se generarán ${estimatedFilesCount} documentos de hasta ${size} páginas cada uno.`
  } else if (mode === "ranges") {
    const count = customRanges.split(",").filter((r) => r.trim().length > 0).length
    estimatedFilesCount = count
    previewDescription = count > 0
      ? `Se generarán ${count} archivos según los rangos indicados.`
      : "Ingresá los rangos para calcular los documentos resultantes."
  }

  const handleExecuteSplit = async () => {
    try {
      setIsProcessing(true)
      setErrorMessage(null)

      const baseName = sourceFiles.length > 0 ? sourceFiles[0].name : "documento"
      const results = await splitPdfDocument(pages, sourceFiles, mode, {
        chunkSize,
        ranges: customRanges,
        baseName,
      })

      setSplitResults(results)
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocurrió un error al dividir el documento.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadSingle = (item: SplitResultItem) => {
    const url = URL.createObjectURL(item.blob)
    const a = document.createElement("a")
    a.href = url
    a.download = item.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadZip = async () => {
    if (!splitResults) return
    try {
      setIsProcessing(true)
      const baseName = sourceFiles.length > 0 ? sourceFiles[0].name.replace(/\.pdf$/i, "") : "documentos"
      const zipBlob = await exportSplitZip(splitResults, `${baseName}_dividido.zip`)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${baseName}_dividido.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al empaquetar el archivo ZIP.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setSplitResults(null)
    setErrorMessage(null)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Scissors className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Dividir documento PDF
                </h3>
                <p className="text-xs text-gray-500">
                  Total actual: {pages.length} {pages.length === 1 ? "página" : "páginas"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {!splitResults ? (
              <>
                {/* Selector de tipo de división */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Modalidad de separación
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMode("fixed_chunks")}
                      className={`p-3.5 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between gap-2 ${
                        mode === "fixed_chunks"
                          ? "border-violet-600 bg-violet-50/50 text-violet-900 font-semibold ring-1 ring-violet-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="font-bold">Partes iguales</span>
                      <span className="text-[11px] text-gray-500 font-normal">
                        Bloques de N páginas
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("ranges")}
                      className={`p-3.5 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between gap-2 ${
                        mode === "ranges"
                          ? "border-violet-600 bg-violet-50/50 text-violet-900 font-semibold ring-1 ring-violet-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="font-bold">Por rangos</span>
                      <span className="text-[11px] text-gray-500 font-normal">
                        Intervalos específicos
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("single_pages")}
                      className={`p-3.5 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between gap-2 ${
                        mode === "single_pages"
                          ? "border-violet-600 bg-violet-50/50 text-violet-900 font-semibold ring-1 ring-violet-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="font-bold">Individuales</span>
                      <span className="text-[11px] text-gray-500 font-normal">
                        Cada página un PDF
                      </span>
                    </button>
                  </div>
                </div>

                {/* Parámetros según modalidad */}
                {mode === "fixed_chunks" && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                    <label className="block text-xs font-semibold text-gray-800">
                      Cantidad de páginas por cada archivo
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={pages.length}
                        value={chunkSize}
                        onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 1)}
                        className="w-24 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <span className="text-xs text-gray-500">
                        páginas por documento (máx. {pages.length})
                      </span>
                    </div>
                  </div>
                )}

                {mode === "ranges" && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                    <label className="block text-xs font-semibold text-gray-800">
                      Definir intervalos de páginas
                    </label>
                    <input
                      type="text"
                      placeholder="Ejemplo: 1-5, 6-10, 11-12"
                      value={customRanges}
                      onChange={(e) => setCustomRanges(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400"
                    />
                    <p className="text-[11px] text-gray-500">
                      Separá cada documento por coma. Podés usar rangos como <code>1-3</code> o números individuales como <code>5</code>.
                    </p>
                  </div>
                )}

                {/* Vista previa explicativa */}
                <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-start gap-3">
                  <Info className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-violet-900 space-y-1">
                    <p className="font-semibold">{previewDescription}</p>
                    <p className="text-violet-700/80 text-[11px]">
                      Tus archivos originales no se modificarán. Podrás descargar cada PDF por separado o empaquetarlos en un archivo ZIP.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Resultados de la división */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Se generaron {splitResults.length} documentos con éxito</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-medium text-violet-600 hover:underline"
                  >
                    Nueva división
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {splitResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-violet-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {item.description} • {formatBytes(item.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:border-violet-500 hover:text-violet-700 transition-colors shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row gap-3 justify-end items-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-xs hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>

            {!splitResults ? (
              <button
                type="button"
                disabled={isProcessing || estimatedFilesCount === 0}
                onClick={handleExecuteSplit}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-xs hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-40"
              >
                {isProcessing ? "Dividiendo páginas..." : "Ejecutar división"}
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDownloadZip}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-xs hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Archive className="h-4 w-4" /> Descargar todo en ZIP
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
