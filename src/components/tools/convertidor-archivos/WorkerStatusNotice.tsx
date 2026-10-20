"use client"

import React from "react"
import { WorkerHealthState } from "@/lib/converter/types"
import { AlertCircle, CheckCircle2, RefreshCw, Cpu, Server } from "lucide-react"

interface WorkerStatusNoticeProps {
  workerState: WorkerHealthState | null
  isChecking: boolean
  onRecheck: () => void
}

export function WorkerStatusNotice({
  workerState,
  isChecking,
  onRecheck,
}: WorkerStatusNoticeProps) {
  if (!workerState) return null

  if (workerState.online && workerState.sofficeAvailable) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold">Servicio activo: </span>
            <span>Motor documental conectado y listo para procesar tus archivos de Office.</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRecheck}
          disabled={isChecking}
          className="text-emerald-700 hover:text-emerald-900 font-medium underline shrink-0 cursor-pointer text-xs"
        >
          {isChecking ? "Verificando..." : "Verificar"}
        </button>
      </div>
    )
  }

  if (workerState.configured && !workerState.online) {
    return (
      <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900 space-y-2.5 text-xs sm:text-sm">
        <div className="flex items-start gap-3">
          <RefreshCw className={`h-5 w-5 text-sky-600 shrink-0 mt-0.5 ${isChecking ? "animate-spin" : ""}`} />
          <div className="space-y-1 flex-1">
            <div className="font-bold text-sky-950 flex items-center gap-2">
              <span>Iniciando motor documental...</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
                Reactivando
              </span>
            </div>
            <p className="text-sky-800 leading-relaxed text-xs">
              El servidor de conversión documental se está reactivando tras un periodo de inactividad. Esto suele demorar unos instantes. El sistema se conectará automáticamente.
            </p>
          </div>

          <button
            type="button"
            onClick={onRecheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-900 font-medium hover:bg-sky-100/50 text-xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span>{isChecking ? "Conectando..." : "Reintentar"}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2.5 text-xs sm:text-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span>Conversión documental en mantenimiento</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              Temporal
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed text-xs">
            Esta conversión requiere nuestro motor documental dedicado (Word, Excel y PowerPoint a PDF), el cual se encuentra momentáneamente en mantenimiento.
          </p>
          <p className="text-amber-800 leading-relaxed text-xs">
            Mientras tanto, todas las conversiones de imágenes y PDF (imágenes a PDF, PDF a imágenes, etc.) funcionan de manera 100% autónoma en tu navegador.
          </p>
        </div>

        <button
          type="button"
          onClick={onRecheck}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-medium hover:bg-amber-100/50 text-xs shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Probando..." : "Reintentar conexión"}</span>
        </button>
      </div>
    </div>
  )
}
