'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Crown, Check, X, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Props {
  isOpen: boolean
  onClose: () => void
  preservedCount?: number
  featureTitle?: string
}

export function ProUpgradeModal({
  isOpen,
  onClose,
  preservedCount = 0,
  featureTitle = 'Guardado en la nube y Biblioteca Pro'
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Función Pro</span>
            <h3 className="text-lg font-bold text-slate-900">{featureTitle}</h3>
          </div>
        </div>

        {preservedCount > 0 ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              Tus listas están conservadas
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Tenés <strong>{preservedCount} {preservedCount === 1 ? 'lista' : 'listas'}</strong> guardadas en tu cuenta. Están intactas en la base de datos. Reactivá tu suscripción Pro para editarlas, duplicarlas y descargarlas.
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
            La versión gratuita permite armar, editar y descargar tu lista actual en PDF sin límites. La cuenta Pro suma persistencia y gestión integral:
          </p>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <Check size={12} strokeWidth={3} />
            </div>
            <div className="text-xs sm:text-sm">
              <strong className="text-slate-900">Múltiples listas en la nube:</strong>
              <span className="text-slate-600 block text-xs">Administrá listas independientes para mayoristas, minoristas o temporadas.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <Check size={12} strokeWidth={3} />
            </div>
            <div className="text-xs sm:text-sm">
              <strong className="text-slate-900">Biblioteca y duplicación:</strong>
              <span className="text-slate-600 block text-xs">Consultá tus listas anteriores, duplicalas con un clic y descargá el PDF cuando lo necesites.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <Check size={12} strokeWidth={3} />
            </div>
            <div className="text-xs sm:text-sm">
              <strong className="text-slate-900">Identidad comercial y logo:</strong>
              <span className="text-slate-600 block text-xs">Vinculá tu logo, teléfono y datos comerciales en la cabecera de tus documentos.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <Check size={12} strokeWidth={3} />
            </div>
            <div className="text-xs sm:text-sm">
              <strong className="text-slate-900">Conservación asegurada:</strong>
              <span className="text-slate-600 block text-xs">Tus listas no se borran si pausás o vence el período; quedan listas para cuando regreses.</span>
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
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors text-center"
          >
            Continuar gratis
          </button>
        </div>
      </motion.div>
    </div>
  )
}
