'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, History, TrendingUp, TrendingDown, Minus, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { KitchenIngredient, KitchenIngredientPriceHistory } from '@/lib/gastronomia/types'
import { getIngredientPriceHistoryServer } from '@/app/actions/kitchen-ingredients'

export function PriceHistoryModal({
  isOpen,
  onClose,
  ingredient,
}: {
  isOpen: boolean
  onClose: () => void
  ingredient: KitchenIngredient | null
}) {
  const [history, setHistory] = useState<KitchenIngredientPriceHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && ingredient) {
      setIsLoading(true)
      setError(null)
      getIngredientPriceHistoryServer(ingredient.id)
        .then((res) => {
          if (res.error) {
            setError(res.error)
          } else {
            setHistory(res.data || [])
          }
        })
        .catch((err) => {
          setError(err.message || 'Error al cargar el historial')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, ingredient])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !ingredient) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl my-8 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-100 text-brand">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 id="history-modal-title" className="text-base font-bold text-slate-900">
                  Historial de precios
                </h2>
                <p className="text-xs text-slate-700">
                  {ingredient.name} {ingredient.brand ? `(${ingredient.brand})` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Precio vigente destacado */}
          <div className="p-5 bg-purple-50/40 border-b border-purple-100/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Precio de compra vigente
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ${Number(ingredient.current_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-slate-700 block">
                Por {ingredient.package_quantity} {ingredient.package_unit}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-700 block">Última actualización:</span>
              <span className="text-xs font-semibold text-slate-800">
                {new Date(ingredient.price_updated_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Contenido: Lista o tabla cronológica */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Registro inmutable: Cada variación de precio queda documentada por el servidor y no puede alterarse.
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-600 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                <span className="text-xs">Consultando registros históricos...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-600 text-xs">
                No hay movimientos registrados para este ingrediente.
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Evolución cronológica
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                  {history.map((record, idx) => {
                    const prev = Number(record.previous_price)
                    const curr = Number(record.new_price)
                    const diff = curr - prev
                    const percent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '0'

                    return (
                      <div key={record.id || idx} className="p-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700">
                            {new Date(record.recorded_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <div className="flex items-center gap-1 font-semibold text-xs">
                            {diff > 0 ? (
                              <span className="text-rose-600 inline-flex items-center gap-0.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                +{percent}% (+${diff.toFixed(2)})
                              </span>
                            ) : diff < 0 ? (
                              <span className="text-emerald-600 inline-flex items-center gap-0.5">
                                <TrendingDown className="h-3.5 w-3.5" />
                                {percent}% (-${Math.abs(diff).toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-slate-600 inline-flex items-center gap-0.5">
                                <Minus className="h-3.5 w-3.5" />
                                Sin variación
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs mt-1">
                          <div className="text-slate-600">
                            <span>Precio anterior: ${prev.toFixed(2)}</span>
                            <span className="mx-1.5">→</span>
                            <span className="font-bold text-slate-900">
                              Precio nuevo: ${curr.toFixed(2)}
                            </span>
                          </div>

                          {record.change_reason && (
                            <span className="text-[11px] text-slate-600 italic max-w-xs truncate" title={record.change_reason}>
                              &quot;{record.change_reason}&quot;
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-300 transition-colors min-h-[44px]"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
