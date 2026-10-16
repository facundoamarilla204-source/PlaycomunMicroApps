"use client"

import React from "react"
import Link from "next/link"
import { ConversionQuotaState, ExecutionEnvironment } from "@/lib/converter/types"
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Laptop } from "lucide-react"

interface QuotaNoticeProps {
  quota: ConversionQuotaState | null
  environment: ExecutionEnvironment
  onSwitchToLocal?: () => void
}

export function QuotaNotice({
  quota,
  environment,
  onSwitchToLocal,
}: QuotaNoticeProps) {
  // If the operation runs locally in the browser, inform user that it has NO quota limits
  if (environment === "client") {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
            <Laptop className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">
            <strong>Operación 100% local:</strong> Esta conversión se ejecuta en tu navegador. Podés usarla de forma ilimitada sin consumir cupo diario de servidor.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md shrink-0">
          <ShieldCheck className="h-3 w-3" />
          Sin límite diario
        </span>
      </div>
    )
  }

  // If quota is loading or not available yet
  if (!quota) {
    return null
  }

  const isPro = quota.is_pro
  const limit = quota.limit
  const remaining = quota.remaining
  const isExhausted = remaining <= 0

  if (isExhausted) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-300 text-amber-950 space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-amber-950">
                Has alcanzado el límite diario de conversiones de documentos Office ({limit}/{limit})
              </h4>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-200 text-amber-900">
                {isPro ? "Límite Pro" : "Límite Gratis"}
              </span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Las conversiones con LibreOffice consumen capacidad de cómputo en nuestro servidor dedicado. Tu cupo se reiniciará automáticamente a las <strong>00:00 (hora de Argentina)</strong>.
            </p>
            {!isPro && (
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Con <strong>PlayComun Pro</strong> obtenés <strong>100 conversiones diarias</strong>, archivos de hasta 50 MB (frente a 10 MB en Gratis) y procesamiento preferencial.
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-amber-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Nuestras conversiones de PDF e imágenes continúan 100% disponibles sin límite.</span>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToLocal && (
              <button
                type="button"
                onClick={onSwitchToLocal}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
              >
                Ver conversiones locales
              </button>
            )}
            {!isPro && (
              <Link
                href="/pro"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                <span>Pasate a Pro</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Active quota with remaining credits
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-violet-50/70 border border-violet-200/80 text-xs text-violet-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-violet-950 text-xs sm:text-sm">
              {isPro
                ? `Plan Pro: Te quedan ${remaining} de ${limit} conversiones de hoy`
                : `Te quedan ${remaining} de ${limit} conversiones de documentos Office de hoy`}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isPro
                  ? "bg-violet-600 text-white"
                  : "bg-violet-200/70 text-violet-800"
              }`}
            >
              {isPro ? "Pro" : "Gratis"}
            </span>
          </div>
          <p className="text-[11px] text-violet-800 truncate">
            Tamaño máximo: {quota.max_file_size_mb} MB · Reinicio a las 00:00 (hora argentina)
          </p>
        </div>
      </div>

      {!isPro && (
        <Link
          href="/pro"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-violet-300 hover:border-violet-400 text-violet-800 hover:text-violet-950 font-bold text-xs transition-colors shrink-0 shadow-2xs"
        >
          <span>100 diarias en Pro</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
