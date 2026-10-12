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
            <span className="font-semibold">Servicio documental activo: </span>
            <span>LibreOffice headless conectado y listo para procesar documentos de oficina.</span>
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

  return (
    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2.5 text-xs sm:text-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <span>Servicio de conversión documental en espera</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              Infraestructura requerida
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed text-xs">
            Esta conversión requiere ejecutar un motor documental completo (LibreOffice headless). El código del microservicio se encuentra implementado en la carpeta{" "}
            <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900">
              services/conversion-worker
            </code>{" "}
            del repositorio con su Dockerfile listo para desplegar en Railway, Render o VPS propio.
          </p>
          <p className="text-amber-800 leading-relaxed text-xs">
            Para activar esta función en producción, configurá la variable{" "}
            <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900">
              NEXT_PUBLIC_CONVERSION_WORKER_URL
            </code>{" "}
            con la URL de tu worker. Mientras tanto, todas las conversiones de PDF e imágenes funcionan de manera 100% autónoma en tu navegador.
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
