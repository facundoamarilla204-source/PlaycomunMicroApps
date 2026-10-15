"use client"

import React, { useRef } from "react"
import { ExportResult } from "@/lib/audio-cutter/types"
import { formatFileSize, formatTime } from "@/lib/audio-cutter/format-utils"
import {
  Download,
  CheckCircle2,
  Sliders,
  Upload,
  FileAudio,
  Sparkles,
  Clock,
  HardDrive,
} from "lucide-react"

interface ResultViewProps {
  result: ExportResult
  onModify: () => void
  onNewFile: () => void
}

export function ResultView({ result, onModify, onNewFile }: ResultViewProps) {
  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = result.url
    a.download = result.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="w-full p-6 sm:p-8 bg-white rounded-2xl border border-emerald-200/90 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Success Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              ¡Audio recortado con éxito!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Tu archivo fue procesado con FFmpeg y está listo para descargar.
            </p>
          </div>
        </div>

        <span className="uppercase text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
          {result.format} listo
        </span>
      </div>

      {/* File Info Card */}
      <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileAudio className="h-5 w-5 text-brand shrink-0" />
            <span className="font-bold text-sm sm:text-base text-slate-900 truncate" title={result.fileName}>
              {result.fileName}
            </span>
          </div>

          <span className="font-mono text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
            {formatFileSize(result.size)}
          </span>
        </div>

        {/* Audio Verification Player */}
        <div className="pt-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
            Escuchar resultado exportado
          </label>
          <audio
            src={result.url}
            controls
            className="w-full h-10 accent-brand rounded-lg outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Duración: {formatTime(result.duration)}</span>
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            <span>Tamaño: {formatFileSize(result.size)}</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onModify}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Sliders className="h-4 w-4 text-slate-500" />
            <span>Modificar tiempos</span>
          </button>

          <button
            type="button"
            onClick={onNewFile}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Cortar otro audio</span>
          </button>
        </div>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
        >
          <Download className="h-5 w-5 stroke-[2.5]" />
          <span>Descargar audio</span>
        </button>
      </div>
    </div>
  )
}
