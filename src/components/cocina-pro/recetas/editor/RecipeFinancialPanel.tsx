'use client'

import { useMemo, useState } from 'react'
import {
  DollarSign,
  AlertTriangle,
  Download,
  Save,
  Loader2,
  TrendingUp,
  Percent,
  CheckCircle2,
  Scale,
  Layers,
} from 'lucide-react'
import { Recipe, formatCurrency } from '@/lib/costo-receta'
import { exportSingleRecipePdf } from '@/lib/recipePdf'
import { calculateCompositeRecipeFinancials } from '@/lib/gastronomia'

export function RecipeFinancialPanel({
  recipe,
  availableRecipes = [],
  isSaving,
  isDirty,
  onSave,
  errorMessage,
  successMessage,
}: {
  recipe: Recipe
  availableRecipes?: Recipe[]
  isSaving: boolean
  isDirty: boolean
  onSave: () => void
  errorMessage: string | null
  successMessage: string | null
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // Mapa rápido de recetas disponibles para el cálculo recursivo de subrecetas
  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    availableRecipes.forEach((r) => {
      if (r.id) map.set(r.id, r)
    })
    return map
  }, [availableRecipes])

  // Cálculo financiero compuesto (ingredientes directos + subrecetas + adicionales)
  const financials = useMemo(() => {
    return calculateCompositeRecipeFinancials(recipe, (id) => recipeMap.get(id))
  }, [recipe, recipeMap])

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      await exportSingleRecipePdf(recipe, {
        steps: recipe.steps,
        subrecipesBreakdown: financials.subrecipesBreakdown,
      })
    } catch (err) {
      console.error('Error al exportar PDF:', err)
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Pérdida por horneado si existe
  const bakingLoss = recipe.baking_loss_percentage || 0
  const hasSubrecipes = (recipe.subrecipes || []).length > 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5 sticky top-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-100 shrink-0">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-purple-900 block leading-tight">
              Escandallo dinámico
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Resumen de costos
            </h2>
          </div>
        </div>

        {isDirty && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-950 border border-amber-300">
            Cambios sin guardar
          </span>
        )}
      </div>

      {/* Alerta de costo provisional si hay errores de conversión o subrecetas incompletas */}
      {(financials.hasConversionErrors || financials.hasProvisionalCosts) && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Costo provisional:</strong> {financials.invalidItemsCount} componente(s) poseen unidades no convertibles o requieren datos adicionales (ej. densidad). El costo total y el precio sugerido excluyen dichos valores hasta resolverlos.
          </div>
        </div>
      )}

      {/* Desglose de importes */}
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="font-medium text-slate-700">Ingredientes directos:</span>
          <span className="font-semibold text-slate-950 tabular-nums">
            {formatCurrency(financials.directIngredientsCost)}
          </span>
        </div>

        {hasSubrecipes && (
          <div className="flex items-center justify-between py-2 border-b border-purple-100 bg-purple-50/50 px-3 rounded-lg">
            <span className="text-purple-950 font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-700" />
              <span>Subrecetas incorporadas:</span>
            </span>
            <span className="font-bold text-purple-950 tabular-nums">
              {formatCurrency(financials.subrecipesCost)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="font-medium text-slate-700">Costos adicionales:</span>
          <span className="font-semibold text-slate-950 tabular-nums">
            {formatCurrency(financials.additionalCosts)}
          </span>
        </div>

        {/* Costo total de la preparación */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 my-1 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-900 text-xs block">
              {financials.hasProvisionalCosts ? 'Costo total (provisorio):' : 'Costo total de elaboración:'}
            </span>
            <span className="text-[11px] text-slate-600 block">Lote completo</span>
          </div>
          <span className="font-bold text-lg text-slate-950 tabular-nums">
            {formatCurrency(financials.totalCost)}
            {financials.hasProvisionalCosts && '*'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 text-slate-700">
          <span className="font-medium">Rendimiento declarado:</span>
          <span className="font-semibold text-slate-950 tabular-nums">
            {recipe.yield_quantity} {recipe.yield_unit}
          </span>
        </div>

        {/* Costo por porción/unidad */}
        <div className="flex items-center justify-between p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80">
          <div>
            <span className="font-semibold text-purple-950 text-xs block">
              Costo unitario ({recipe.yield_unit || 'unidad'}):
            </span>
            <span className="text-[11px] text-purple-800 font-medium">
              Porción estándar
            </span>
          </div>
          <span className="font-bold text-purple-950 text-lg tabular-nums">
            {formatCurrency(financials.unitCost)}
          </span>
        </div>
      </div>

      {/* Fijación de precio y ganancia */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-medium text-slate-700">
            {recipe.pricing_mode === 'margin' ? 'Margen sobre venta:' : 'Recargo sobre costo:'}
          </span>
          <span className="font-semibold text-slate-950">
            {recipe.pricing_mode === 'margin'
              ? `${recipe.target_margin}%`
              : `${recipe.target_markup}% (Margen real: ${financials.realMarginPct.toFixed(1)}%)`}
          </span>
        </div>

        {/* Tarjeta destacada de precio y ganancia */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                Precio de venta sugerido
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">
                Por {recipe.yield_unit || 'unidad'}
              </span>
            </div>
            <span className="font-extrabold text-2xl text-emerald-950 tabular-nums">
              {formatCurrency(financials.suggestedPrice)}
              {financials.hasConversionErrors && '*'}
            </span>
          </div>

          <div className="pt-2.5 border-t border-emerald-200/80 space-y-1.5 text-xs text-emerald-950">
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-900">Ganancia por unidad:</span>
              <span className="font-bold tabular-nums text-emerald-950">
                {formatCurrency(financials.profitPerUnit)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-900">Ganancia lote total:</span>
              <span className="font-bold tabular-nums text-emerald-950">
                {formatCurrency(financials.totalProfit)}
              </span>
            </div>
          </div>
        </div>

        {bakingLoss > 0 && (
          <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span>Pérdida por horneado declarada: <strong className="text-slate-950 font-semibold">{bakingLoss}%</strong></span>
          </div>
        )}
      </div>

      {/* Feedback de error o éxito */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-xs min-h-[44px] cursor-pointer disabled:opacity-60 active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span>Guardando receta...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 text-purple-300" />
              <span>Guardar receta</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-all min-h-[44px] cursor-pointer disabled:opacity-60 active:scale-[0.98]"
        >
          {isExportingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-slate-600" />
              <span>Descargar ficha técnica (PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
