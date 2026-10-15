"use client"

import React from "react"
import { ProcessingProgress } from "@/lib/audio-cutter/types"
import { Loader2, XCircle, Cpu, Scissors } from "lucide-react"

interface ProcessingStatusProps {
  progress: ProcessingProgress
  onCancel: () => void
}

export function ProcessingStatus({ progress, onCancel }: ProcessingStatusProps) {
  return (
    <div className="p-6 sm:p-8 bg-white rounded-2xl border border-purple-200/80 shadow-md space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-brand">
            {progress.phase === "loading-engine" ? (
              <Cpu className="h-5 w-5 animate-pulse" />
            ) : (
              <Scissors className="h-5 w-5 animate-bounce" />
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {progress.phase === "loading-engine"
                ? "Iniciando motor FFmpeg"
                : "Recortando tu audio"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {progress.message}
            </p>
          </div>
        </div>

        <span className="font-mono text-base sm:text-lg font-extrabold text-brand">
          {progress.percent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
        <div
          className="bg-brand h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, progress.percent)}%` }}
        />
      </div>

      {/* Helpful note and cancel button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <span>
          El procesamiento se ejecuta localmente en tu dispositivo para máxima privacidad.
        </span>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  )
}
