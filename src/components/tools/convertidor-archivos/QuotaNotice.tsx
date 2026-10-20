"use client"

import React from "react"
import Link from "next/link"
import { ConversionQuotaState, ExecutionEnvironment } from "@/lib/converter/types"
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Laptop } from "lucide-react"

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
      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
            <Laptop className="h-4 w-4" />
          </div>
          <span className="font-medium text-emerald-900">
            <strong className="font-semibold text-emerald-950">Conversión en tu navegador:</strong> Este formato se procesa directamente en tu equipo, de forma privada y sin límite diario de archivos.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5" />
          Sin límite de uso
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
      <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-amber-950">
                Alcanzaste el cupo diario de conversiones ({limit} de {limit})
              </h4>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-200/80 text-amber-900">
                {isPro ? "Plan Pro" : "Plan Básico"}
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Los documentos de Office (Word, Excel y PowerPoint) requieren procesamiento en servidor. Tu cupo se reinicia hoy a las <strong>00:00 hs (hora de Argentina)</strong>.
            </p>
            {!isPro && (
              <p className="text-xs text-amber-900 leading-relaxed">
                Con <strong>PlayComun Pro</strong> tenés <strong>100 conversiones diarias</strong> y podés subir archivos de hasta 50 MB.
              </p>
            )}
          </div>
        </div>

        <div className="pt-2.5 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-amber-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Las conversiones de imágenes y PDF siguen disponibles sin límite.</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onSwitchToLocal && (
              <button
                type="button"
                onClick={onSwitchToLocal}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer min-h-[40px] flex items-center"
              >
                Ver conversiones locales
              </button>
            )}
            {!isPro && (
              <Link
                href="/planes"
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <span>Ver planes Pro</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Active quota with remaining credits
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 shrink-0">
          <FileText className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-950 text-xs sm:text-sm">
              {isPro
                ? `Tenés ${remaining} de ${limit} conversiones disponibles hoy`
                : `Tenés ${remaining} de ${limit} conversiones de Office disponibles hoy`}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                isPro
                  ? "bg-violet-100 text-violet-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {isPro ? "Plan Pro" : "Plan Básico"}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Hasta {quota.max_file_size_mb} MB por archivo · Se reinicia hoy a las 00:00 hs (hora argentina)
          </p>
        </div>
      </div>

      {!isPro && (
        <Link
          href="/planes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>100 diarias en Pro</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}
