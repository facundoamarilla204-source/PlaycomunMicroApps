'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react'

interface Props {
  preservedCount: number
  onUpgradeClick: () => void
}

export function PreservedDataNotice({ preservedCount, onUpgradeClick }: Props) {
  if (preservedCount <= 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <span>Datos preservados de forma segura</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/70 text-amber-900">
                {preservedCount} {preservedCount === 1 ? 'movimiento' : 'movimientos'}
              </span>
            </h4>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed max-w-xl">
              Tus movimientos anteriores en la nube están intactos y guardados en tu cuenta. Al no tener una suscripción Pro activa, la sincronización remota permanece en pausa, pero podés seguir usando la herramienta libremente en este dispositivo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUpgradeClick}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Reactivar Pro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
