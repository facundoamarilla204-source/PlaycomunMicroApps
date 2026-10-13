'use client'

import React, { useState } from 'react'
import { Save, RefreshCw, FileDown, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Recipe, RecipeFinancials, formatCurrency } from '@/lib/costo-receta'
import { exportSingleRecipePdf } from '@/lib/recipePdf'

interface RecipeSummarySidebarProps {
  recipe: Recipe
  setRecipe: React.Dispatch<React.SetStateAction<Recipe>>
  financials: RecipeFinancials
  loading: boolean
  onSave: () => void
}

export function RecipeSummarySidebar({
  recipe,
  setRecipe,
  financials,
  loading,
  onSave,
}: RecipeSummarySidebarProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      await exportSingleRecipePdf(recipe)
    } catch (err) {
      console.error('Error al generar PDF de la receta:', err)
      alert('Hubo un error al generar el PDF. Por favor intentá nuevamente.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-6">
        <div className="bg-white rounded-2xl shadow-xs border border-brand/20 overflow-hidden">
          {/* Header */}
          <div className="bg-brand/5 border-b border-brand/10 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900">
              Resumen y Rentabilidad
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Fijá tu precio de venta y asegurá tu ganancia
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Cost breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Ingredientes ({recipe.ingredients.length})</span>
                <span className="font-semibold text-neutral-800">
                  {formatCurrency(financials.totalIngredients)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Otros costos ({recipe.additional_costs.length})</span>
                <span className="font-semibold text-neutral-800">
                  {formatCurrency(financials.totalAdditional)}
                </span>
              </div>
              <div className="pt-2.5 border-t border-neutral-100 flex justify-between font-bold text-neutral-900">
                <span>Costo Total Elaboración</span>
                <span className="text-base">{formatCurrency(financials.totalCost)}</span>
              </div>
            </div>

            {/* Unit cost block */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/90 space-y-1">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Rendimiento:</span>
                <span className="font-medium text-neutral-700">
                  {recipe.yield_quantity} {recipe.yield_unit}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-bold text-brand-dark pt-1">
                <span className="text-sm">Costo Unitario:</span>
                <span className="text-lg text-brand font-black">
                  {formatCurrency(financials.unitCost)}
                </span>
              </div>
            </div>

            {/* Pricing Mode Selector */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">
                  Método para calcular precio de venta
                </label>
                <select
                  value={recipe.pricing_mode}
                  onChange={(e) =>
                    setRecipe({
                      ...recipe,
                      pricing_mode: e.target.value as 'margin' | 'markup',
                    })
                  }
                  className="block w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-hidden"
                >
                  <option value="margin">Por margen de ganancia (%)</option>
                  <option value="markup">Por recargo sobre costo (%)</option>
                </select>
              </div>

              {recipe.pricing_mode === 'margin' ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="font-bold text-brand-dark">Margen deseado (%)</label>
                    <span className="text-neutral-400 text-2xs">Recomendado: 30% a 60%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="any"
                      value={recipe.target_margin || ''}
                      onChange={(e) =>
                        setRecipe({ ...recipe, target_margin: Number(e.target.value) })
                      }
                      className="block w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-base font-bold outline-hidden"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <span className="text-neutral-400 font-bold text-sm">%</span>
                    </div>
                  </div>
                  {recipe.target_margin >= 100 && (
                    <p className="text-xs text-red-500">
                      El margen debe ser menor a 100% para calcular el precio.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="font-bold text-brand-dark">Recargo sobre costo (%)</label>
                    <span className="text-neutral-400 text-2xs">Ej. 50% = Costo × 1.5</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={recipe.target_markup || ''}
                      onChange={(e) =>
                        setRecipe({ ...recipe, target_markup: Number(e.target.value) })
                      }
                      className="block w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-base font-bold outline-hidden"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <span className="text-neutral-400 font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested selling price card */}
            <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200/90 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Precio de venta sugerido
                </span>
                <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Por {recipe.yield_unit === 'unidades' ? 'unidad' : recipe.yield_unit}
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                {formatCurrency(financials.suggestedPrice)}
              </div>

              <div className="pt-2 border-t border-emerald-200/60 space-y-1 text-xs">
                <div className="flex justify-between text-emerald-800">
                  <span>Ganancia por unidad:</span>
                  <span className="font-bold">{formatCurrency(financials.profitPerUnit)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Ganancia lote completo:</span>
                  <span className="font-bold">{formatCurrency(financials.totalProfit)}</span>
                </div>
                {recipe.pricing_mode === 'markup' && (
                  <div className="text-2xs text-emerald-700/90 pt-1">
                    * Equivale a un margen real del <strong>{financials.realMarginPct.toFixed(1)}%</strong> sobre el precio de venta.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 space-y-2.5">
            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 px-4 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{recipe.id ? 'Guardar Cambios' : 'Guardar Receta'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full flex justify-center items-center gap-2 bg-white border border-slate-300 text-slate-700 py-2.5 px-4 rounded-xl font-semibold hover:bg-slate-50 hover:text-purple-700 shadow-sm transition-colors disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              {downloadingPdf ? (
                <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
              ) : (
                <FileDown className="h-4 w-4 text-purple-600" />
              )}
              <span>Exportar Ficha en PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
