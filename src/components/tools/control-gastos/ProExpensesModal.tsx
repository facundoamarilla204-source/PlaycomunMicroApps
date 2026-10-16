'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Crown, X, ArrowRight, ShieldCheck, FileSpreadsheet, Cloud } from 'lucide-react'
import Link from 'next/link'

interface Props {
  isOpen: boolean
  onClose: () => void
  preservedCount?: number
  featureTitle?: string
}

export function ProExpensesModal({
  isOpen,
  onClose,
  preservedCount = 0,
  featureTitle = 'Sincronización en la Nube y Exportación a Excel',
}: Props) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Crown size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                PlayComun Pro
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-sora">{featureTitle}</h3>
            </div>
          </div>

          {preservedCount > 0 ? (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold mb-1 text-sm text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Tus datos están preservados intactos
              </div>
              <p className="leading-relaxed">
                Tenés <strong>{preservedCount} {preservedCount === 1 ? 'movimiento' : 'movimientos'}</strong> guardados en tu cuenta de Supabase. Al reactivar tu membresía Pro volverán a sincronizarse de inmediato en cualquier dispositivo.
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              La modalidad Gratuita te permite registrar ingresos y gastos libremente en este navegador. Con una cuenta Pro accedés a funciones avanzadas:
            </p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 mt-0.5">
                <Cloud size={14} />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="text-slate-900">Sincronización multi-dispositivo:</strong>
                <span className="text-slate-600 block text-xs">
                  Accedé a tus finanzas y registrá gastos desde tu celular, tablet o computadora en tiempo real.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 mt-0.5">
                <FileSpreadsheet size={14} />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="text-slate-900">Exportación a Excel (.xlsx):</strong>
                <span className="text-slate-600 block text-xs">
                  Descargá reportes completos con hojas de resumen, desglose de ingresos y detalle de gastos.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 mt-0.5">
                <ShieldCheck size={14} />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="text-slate-900">Conservación asegurada:</strong>
                <span className="text-slate-600 block text-xs">
                  Tus movimientos nunca se eliminan si pausás o vence el período; quedan resguardados en tu cuenta.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/precios"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-bold text-xs sm:text-sm text-white shadow-xs hover:bg-purple-700 active:bg-purple-800 transition-all text-center"
            >
              <span>Ver planes de suscripción</span>
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer"
            >
              Continuar gratis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
