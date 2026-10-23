'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  ChefHat,
  Clock,
  Flame,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Info,
  Edit3,
  FileDown,
  ListOrdered,
  Wrench,
  Scale,
  CalendarCheck,
} from 'lucide-react'
import { Recipe, calculateRecipeFinancials } from '@/lib/costo-receta'
import { exportSingleRecipePdf } from '@/lib/recipePdf'
import Link from 'next/link'

export function RecipeDetailDrawer({
  isOpen,
  onClose,
  recipe,
  onScale,
}: {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe | null
  onScale?: (recipe: Recipe) => void
}) {
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

  if (!isOpen || !recipe) return null

  // Cálculos financieros en tiempo real basados en la lógica gastronómica
  const financials = calculateRecipeFinancials(recipe)

  const formatMoney = (val: number) => {
    return `$${val.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-detail-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-brand flex items-center justify-center font-bold shadow-xs">
                <ChefHat className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h2 id="recipe-detail-title" className="text-base sm:text-lg font-bold text-slate-900">
                  {recipe.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-700 mt-0.5">
                  <span className="capitalize">{recipe.category || 'Sin categoría'}</span>
                  <span>•</span>
                  <span className="tabular-nums">
                    Rinde {recipe.yield_quantity} {recipe.yield_unit}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand btn-tactile"
              aria-label="Cerrar ficha"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contenido con scroll */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {recipe.description && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                {recipe.description}
              </p>
            )}

            {/* Resumen financiero gastronómico */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Costos y precio de venta
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] text-slate-700 block">Costo insumos</span>
                  <span className="text-base font-extrabold text-slate-900 block mt-0.5 tabular-nums">
                    {formatMoney(financials.totalIngredients)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] text-slate-700 block">Costos adicionales</span>
                  <span className="text-base font-extrabold text-slate-900 block mt-0.5 tabular-nums">
                    {formatMoney(financials.totalAdditional)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60">
                  <span className="text-[11px] text-brand font-semibold block">Costo total</span>
                  <span className="text-base font-extrabold text-brand block mt-0.5 tabular-nums">
                    {formatMoney(financials.totalCost)}
                  </span>
                  <span className="text-[10px] text-slate-700 block tabular-nums">
                    {formatMoney(financials.unitCost)} / {recipe.yield_unit}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-[11px] text-emerald-800 font-semibold block">Precio sugerido</span>
                  <span className="text-base font-extrabold text-emerald-800 block mt-0.5 tabular-nums">
                    {formatMoney(financials.suggestedPrice)}
                  </span>
                  <span className="text-[10px] text-slate-700 block tabular-nums">
                    {recipe.pricing_mode === 'margin' ? `Margen: ${recipe.target_margin}%` : `Markup: ${recipe.target_markup}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Parámetros técnicos de cocina y horneado */}
            {(recipe.prep_time_minutes || recipe.cook_time_minutes || recipe.rest_time_minutes || recipe.baking_temperature_celsius || (recipe.baking_loss_percentage && recipe.baking_loss_percentage > 0)) && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Tiempos y cocción
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {recipe.prep_time_minutes && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <Clock className="h-4 w-4 text-slate-600" />
                      <div>
                        <span className="text-[10px] text-slate-700 block">Preparación</span>
                        <span className="font-bold text-slate-900">{recipe.prep_time_minutes} min</span>
                      </div>
                    </div>
                  )}

                  {recipe.cook_time_minutes && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <Flame className="h-4 w-4 text-amber-600" />
                      <div>
                        <span className="text-[10px] text-slate-700 block">Cocción / Horno</span>
                        <span className="font-bold text-slate-900">{recipe.cook_time_minutes} min</span>
                      </div>
                    </div>
                  )}

                  {recipe.rest_time_minutes && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-700 block">Reposo / Fermentación</span>
                        <span className="font-bold text-slate-900">{recipe.rest_time_minutes} min</span>
                      </div>
                    </div>
                  )}

                  {recipe.baking_temperature_celsius && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <Flame className="h-4 w-4 text-rose-600" />
                      <div>
                        <span className="text-[10px] text-slate-700 block">Temperatura</span>
                        <span className="font-bold text-slate-900">{recipe.baking_temperature_celsius} °C</span>
                      </div>
                    </div>
                  )}

                  {recipe.baking_loss_percentage ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 col-span-2">
                      <Info className="h-4 w-4 text-slate-600" />
                      <div>
                        <span className="text-[10px] text-slate-700 block">Merma por evaporación / horneado</span>
                        <span className="font-bold text-slate-900">{recipe.baking_loss_percentage}% de peso perdido</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Listado de ingredientes de la receta */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ingredientes ({recipe.ingredients.length})
                </h3>
                <span className="text-[11px] text-slate-700">
                  Desglose de formulación
                </span>
              </div>

              <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Ingrediente</th>
                      <th className="py-2.5 px-3 text-right">Cantidad neta</th>
                      <th className="py-2.5 px-3 text-right">Merma (%)</th>
                      <th className="py-2.5 px-3 text-right">Costo referencia</th>
                      <th className="py-2.5 px-3 text-right">Costo calculado</th>
                      <th className="py-2.5 px-3 text-center">Biblioteca</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipe.ingredients.map((ing, idx) => (
                      <tr key={ing.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {ing.name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                          {ing.quantity} {ing.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                          {ing.waste_percentage && ing.waste_percentage > 0 ? `${ing.waste_percentage}%` : '0%'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                          ${ing.reference_price} / {ing.reference_quantity} {ing.reference_unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                          {formatMoney(ing.calculated_cost || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {ing.ingredient_id ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full" title="Vinculado a tu biblioteca de ingredientes">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Vinculado</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                              Insumo libre
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subrecetas y elaboraciones compuestas */}
            {recipe.subrecipes && recipe.subrecipes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-brand" />
                    <span>Subrecetas incorporadas ({recipe.subrecipes.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-700">
                    Elaboraciones base
                  </span>
                </div>

                <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Subreceta</th>
                        <th className="py-2.5 px-3 text-right">Cantidad neta</th>
                        <th className="py-2.5 px-3 text-right">Merma (%)</th>
                        <th className="py-2.5 px-3 text-right">Rendimiento base</th>
                        <th className="py-2.5 px-3 text-right">Costo proporcional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recipe.subrecipes.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {sub.subrecipe_name || 'Subreceta'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                            {sub.quantity} {sub.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                            {sub.waste_percentage > 0 ? `${sub.waste_percentage}%` : '0%'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                            {sub.subrecipe_yield_quantity ? `${sub.subrecipe_yield_quantity} ${sub.subrecipe_yield_unit}` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                            {formatMoney(sub.reference_total_cost || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pasos de elaboración */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ListOrdered className="h-4 w-4 text-brand" />
                    <span>Procedimiento ({recipe.steps.length} pasos)</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {recipe.steps.map((st) => (
                    <div
                      key={st.id || st.step_number}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3 text-xs"
                    >
                      <div className="h-6 w-6 rounded-full bg-purple-100 text-brand font-bold flex items-center justify-center shrink-0 text-xs">
                        {st.step_number}
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <p className="text-slate-900 leading-relaxed font-normal whitespace-pre-wrap">
                          {st.instruction}
                        </p>

                        {(st.duration_minutes || st.temperature_celsius || st.equipment || st.notes) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-700">
                            {st.duration_minutes && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <Clock className="h-3 w-3 text-slate-600" />
                                <span>{st.duration_minutes} min</span>
                              </span>
                            )}

                            {st.temperature_celsius && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <Flame className="h-3 w-3 text-rose-600" />
                                <span>{st.temperature_celsius} °C</span>
                              </span>
                            )}

                            {st.equipment && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <Wrench className="h-3 w-3 text-slate-600" />
                                <span>{st.equipment}</span>
                              </span>
                            )}

                            {st.notes && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 italic">
                                <Info className="h-3 w-3 text-slate-600" />
                                <span>{st.notes}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Costos adicionales si existen */}
            {recipe.additional_costs && recipe.additional_costs.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Costos adicionales de elaboración
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden text-xs">
                  {recipe.additional_costs.map((add, idx) => (
                    <div key={add.id || idx} className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-800 font-medium">{add.name}</span>
                      <span className="font-bold text-slate-900 tabular-nums">{formatMoney(add.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/cocina-pro/recetas/${recipe.id}/editar`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white text-xs font-semibold transition-all shadow-xs min-h-[44px] active:scale-[0.98]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Editar receta</span>
              </Link>

              <Link
                href={`/cocina-pro/elaboracion/${recipe.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200/80 text-violet-900 text-xs font-semibold transition-all min-h-[44px] active:scale-[0.98]"
              >
                <Flame className="h-3.5 w-3.5 text-[#7f22fe]" />
                <span>Comenzar elaboración</span>
              </Link>

              {onScale && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onScale(recipe)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold transition-all min-h-[44px] active:scale-[0.98]"
                >
                  <Scale className="h-3.5 w-3.5 text-slate-500" />
                  <span>Escalar receta</span>
                </button>
              )}

              <Link
                href={`/cocina-pro/produccion/nuevo?addRecipeId=${recipe.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold transition-all min-h-[44px] active:scale-[0.98]"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>Planificar lote</span>
              </Link>

              <button
                type="button"
                onClick={() => exportSingleRecipePdf(recipe, { steps: recipe.steps })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors min-h-[44px] btn-tactile"
              >
                <FileDown className="h-3.5 w-3.5 text-slate-700" />
                <span>Ficha PDF</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/herramientas/costo-receta?id=${recipe.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand px-2 py-1 btn-tactile"
              >
                <span>Calculadora</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-300 transition-colors min-h-[44px] btn-tactile"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
