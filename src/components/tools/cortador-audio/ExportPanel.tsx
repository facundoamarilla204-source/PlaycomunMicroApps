"use client"

import React from "react"
import { OutputAudioFormat } from "@/lib/audio-cutter/types"
import { Scissors, FileAudio, Check, Sparkles } from "lucide-react"

interface ExportPanelProps {
  outputFormat: OutputAudioFormat
  onFormatChange: (format: OutputAudioFormat) => void
  onExport: () => void
  isProcessing: boolean
  duration: number
  selectedDuration: number
}

export function ExportPanel({
  outputFormat,
  onFormatChange,
  onExport,
  isProcessing,
  duration,
  selectedDuration,
}: ExportPanelProps) {
  const isValid = selectedDuration > 0 && selectedDuration <= duration

  return (
    <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
      {/* Format Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Formato de exportación
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* MP3 Option */}
          <div
            onClick={() => !isProcessing && onFormatChange("mp3")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onFormatChange("mp3")
            }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              outputFormat === "mp3"
                ? "border-brand bg-purple-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 border ${
                outputFormat === "mp3"
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {outputFormat === "mp3" && <Check className="h-3 w-3 stroke-[3]" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                <span>MP3</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                Comprimido a 192 kbps. Ligero y compatible con cualquier celular, WhatsApp y redes.
              </p>
            </div>
          </div>

          {/* WAV Option */}
          <div
            onClick={() => !isProcessing && onFormatChange("wav")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onFormatChange("wav")
            }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              outputFormat === "wav"
                ? "border-brand bg-purple-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 border ${
                outputFormat === "wav"
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {outputFormat === "wav" && <Check className="h-3 w-3 stroke-[3]" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                <span>WAV</span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md border border-purple-200">
                  Sin pérdida
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                PCM 16-bit sin compresión. Máxima fidelidad de audio para proyectos profesionales o edición.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>El archivo se generará al instante con FFmpeg</span>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={!isValid || isProcessing}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm sm:text-base font-extrabold shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Scissors className="h-4.5 w-4.5 stroke-[2.5]" />
          <span>Cortar y descargar audio</span>
        </button>
      </div>
    </div>
  )
}
