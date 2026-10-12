"use client"

import React, { useState } from "react"
import { ConvertedResultItem } from "@/lib/converter/types"
import { formatBytes, downloadBlob, createZipFromFiles } from "@/lib/converter/utils"
import {
  Download,
  Archive,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Loader2,
} from "lucide-react"

interface ResultsPanelProps {
  results: ConvertedResultItem[]
  originalName: string
  onReset: () => void
}

export function ResultsPanel({
  results,
  originalName,
  onReset,
}: ResultsPanelProps) {
  const [isZipping, setIsZipping] = useState(false)

  if (results.length === 0) return null

  const handleDownloadSingle = (item: ConvertedResultItem) => {
    downloadBlob(item.blob, item.name)
  }

  const handleDownloadZip = async () => {
    if (results.length === 0) return
    setIsZipping(true)
    try {
      const zipBlob = await createZipFromFiles(
        results.map((r) => ({ name: r.name, blob: r.blob }))
      )
      const zipName = `${originalName.replace(/\.[^/.]+$/, "")}_convertido.zip`
      downloadBlob(zipBlob, zipName)
    } catch (err) {
      console.error("Error creating ZIP:", err)
    } finally {
      setIsZipping(false)
    }
  }

  const totalBytes = results.reduce((acc, r) => acc + r.size, 0)
  const isMultiple = results.length > 1

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Conversión completada con éxito
            </h3>
            <p className="text-xs text-gray-500">
              {results.length} {results.length === 1 ? "archivo generado" : "archivos generados"} ({formatBytes(totalBytes)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMultiple && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isZipping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              <span>Descargar todo en ZIP</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Nueva conversión</span>
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
        {results.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-violet-600">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="uppercase font-mono font-semibold text-gray-700">
                    {item.format}
                  </span>
                  <span>· {formatBytes(item.size)}</span>
                  {item.pageNumber && (
                    <span>· Página {item.pageNumber}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadSingle(item)}
              aria-label={`Descargar ${item.name}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-violet-400 hover:text-violet-600 text-gray-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
