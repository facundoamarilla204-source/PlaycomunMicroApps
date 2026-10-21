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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5 sticky top-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand block">
            Escandallo dinámico
          </span>
          <h2 className="text-base font-bold text-slate-900">
            Resumen de costos
          </h2>
        </div>

        {isDirty && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            Cambios sin guardar
          </span>
        )}
      </div>

      {/* Alerta de costo provisional si hay errores de conversión o subrecetas incompletas */}
      {(financials.hasConversionErrors || financials.hasProvisionalCosts) && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Costo provisional:</strong> {financials.invalidItemsCount} componente(s) poseen unidades no convertibles o requieren datos adicionales (ej. densidad). El costo total y el precio sugerido excluyen dichos valores hasta resolverlos.
          </div>
        </div>
      )}

      {/* Desglose de importes */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-700">Ingredientes directos:</span>
          <span className="font-bold text-slate-900 tabular-nums">
            {formatCurrency(financials.directIngredientsCost)}
          </span>
        </div>

        {hasSubrecipes && (
          <div className="flex items-center justify-between py-1 border-b border-slate-100 bg-purple-50/40 px-2 py-1 rounded-lg">
            <span className="text-purple-950 font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand" />
              <span>Subrecetas incorporadas:</span>
            </span>
            <span className="font-bold text-purple-900 tabular-nums">
              {formatCurrency(financials.subrecipesCost)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-700">Costos adicionales:</span>
          <span className="font-bold text-slate-900 tabular-nums">
            {formatCurrency(financials.additionalCosts)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
          <span className="font-bold text-slate-800">
            {financials.hasProvisionalCosts ? 'Costo total (provisorio):' : 'Costo total preparación:'}
          </span>
          <span className="font-extrabold text-sm text-slate-900 tabular-nums">
            {formatCurrency(financials.totalCost)}
            {financials.hasProvisionalCosts && '*'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 text-slate-700">
          <span>Rendimiento declarado:</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {recipe.yield_quantity} {recipe.yield_unit}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
          <span className="font-bold text-brand text-xs">
            Costo por {recipe.yield_unit || 'unidad'}:
          </span>
          <span className="font-extrabold text-brand text-sm tabular-nums">
            {formatCurrency(financials.unitCost)}
          </span>
        </div>
      </div>

      {/* Fijación de precio y ganancia */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-700">
            {recipe.pricing_mode === 'margin' ? 'Margen sobre venta:' : 'Recargo sobre costo:'}
          </span>
          <span className="font-bold text-slate-900">
            {recipe.pricing_mode === 'margin'
              ? `${recipe.target_margin}%`
              : `${recipe.target_markup}% (Margen real: ${financials.realMarginPct.toFixed(1)}%)`}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950">
              Precio venta sugerido
            </span>
            <span className="font-extrabold text-base text-emerald-900">
              {formatCurrency(financials.suggestedPrice)}
              {financials.hasConversionErrors && '*'}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900">
            <span>Ganancia unitaria:</span>
            <span className="font-bold">
              {formatCurrency(financials.profitPerUnit)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-900 mt-0.5">
            <span>Ganancia lote total:</span>
            <span className="font-bold">
              {formatCurrency(financials.totalProfit)}
            </span>
          </div>
        </div>

        {bakingLoss > 0 && (
          <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-slate-600 shrink-0" />
            <span>Pérdida por horneado declarada: <strong>{bakingLoss}%</strong></span>
          </div>
        )}
      </div>

      {/* Feedback de error o éxito */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors shadow-xs min-h-[44px] cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando receta...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar receta</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer disabled:opacity-60"
        >
          {isExportingPdf ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Descargar ficha técnica (PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
