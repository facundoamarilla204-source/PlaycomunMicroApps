'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, X, AlertCircle, ArrowRight } from 'lucide-react'
import { Ingredient, formatCurrency } from '@/lib/costo-receta'
import { KitchenIngredient } from '@/lib/gastronomia/types'
import { calculateIngredientLiveCost } from '@/lib/gastronomia/recipe-linking'

export interface PriceDivergenceItem {
  ingredientIndex: number
  ingredient: Ingredient
  libraryIngredient: KitchenIngredient
  savedReferencePrice: number
  liveReferencePrice: number
  savedCost: number
  liveCost: number
  difference: number
}

export function SyncLibraryPricesModal({
  isOpen,
  onClose,
  divergences,
  onConfirmSync,
}: {
  isOpen: boolean
  onClose: () => void
  divergences: PriceDivergenceItem[]
  onConfirmSync: (selectedIndexes: number[]) => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const totalSavedCost = divergences.reduce((sum, d) => sum + d.savedCost, 0)
  const totalLiveCost = divergences.reduce((sum, d) => sum + d.liveCost, 0)
  const netDifference = totalLiveCost - totalSavedCost

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-prices-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 text-brand">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h2 id="sync-prices-title" className="text-base font-bold text-slate-900">
                  Actualizar precios con la biblioteca
                </h2>
                <p className="text-xs text-slate-700">
                  Se detectaron {divergences.length} insumo(s) con variaciones respecto a los precios guardados.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lista de divergencias */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Aviso de recosteo:</strong> Al confirmar, se actualizarán los precios de referencia de los ingredientes en este formulario. Esta acción no sobreescribe tus recetas hasta que presiones Guardar.
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {divergences.map((item) => {
                const diffPct = item.savedReferencePrice > 0
                  ? ((item.liveReferencePrice - item.savedReferencePrice) / item.savedReferencePrice) * 100
                  : 0
                const isHigher = item.difference > 0

                return (
                  <div key={item.ingredientIndex} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {item.ingredient.name}
                      </span>
                      <span className="text-slate-600 text-[11px]">
                        Uso: {item.ingredient.quantity} {item.ingredient.unit} | Paquete: {item.libraryIngredient.package_quantity} {item.libraryIngredient.package_unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Precio paquete</span>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-slate-600 line-through">
                            {formatCurrency(item.savedReferencePrice)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-600" />
                          <span className="font-bold text-slate-900">
                            {formatCurrency(item.liveReferencePrice)}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-[100px]">
                        <span className="text-[10px] text-slate-600 block">Costo en receta</span>
                        <div className="font-bold text-slate-900">
                          {formatCurrency(item.liveCost)}
                        </div>
                        <span className={`text-[10px] font-bold ${isHigher ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {isHigher ? '+' : ''}{diffPct.toFixed(1)}% ({formatCurrency(item.difference)})
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Resumen total de la variación */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-600 block">Impacto en el costo total de la receta</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {formatCurrency(totalLiveCost)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-600 block">Diferencia neta estimada</span>
                <span className={`font-extrabold text-base ${netDifference > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {netDifference > 0 ? '+' : ''}{formatCurrency(netDifference)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirmSync(divergences.map((d) => d.ingredientIndex))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Aplicar precios vigentes ({divergences.length})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
