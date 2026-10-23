'use client'

import { useState, useMemo } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Package,
  ShoppingBag,
  Layers,
  Filter,
} from 'lucide-react'
import {
  ConsolidatedIngredientItem,
  ProductionPlanSummary,
} from '@/lib/gastronomia/production-plan'
import { formatCurrency } from '@/lib/costo-receta'

export interface ConsolidatedShoppingListProps {
  summary: ProductionPlanSummary
  onToggleChecked: (key: string, isChecked: boolean) => void
  disabled?: boolean
}

export function ConsolidatedShoppingList({
  summary,
  onToggleChecked,
  disabled = false,
}: ConsolidatedShoppingListProps) {
  const [filterState, setFilterState] = useState<'all' | 'pending' | 'checked'>('all')
  const [costMode, setCostMode] = useState<'consumption' | 'packages'>('consumption')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allItems = useMemo(() => {
    return [...summary.consolidatedIngredients, ...summary.incompatibleIngredients]
  }, [summary])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filterState === 'pending') return !item.isChecked
      if (filterState === 'checked') return !!item.isChecked
      return true
    })
  }, [allItems, filterState])

  const totalPackageCost = useMemo(() => {
    return allItems.reduce((acc, item) => acc + (item.estimatedPackagePurchaseCost || item.estimatedConsumptionCost || 0), 0)
  }, [allItems])

  const checkedCount = allItems.filter((i) => i.isChecked).length
  const progressPct = allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0

  if (allItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center">
        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-brand flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Tu lista consolidada de compras está vacía
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          Añadí al menos una receta en la pestaña "Plan de elaboración" e indicá las cantidades deseadas para calcular automáticamente todos los ingredientes necesarios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Barra de progreso y resumen de costos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Progreso de compras
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {checkedCount} de {allItems.length} insumos listos ({progressPct}%)
              </span>
            </div>
            {/* Barra de barra progreso visual */}
            <div className="w-full sm:w-64 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Selector de modo de costo y montos */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setCostMode('consumption')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  costMode === 'consumption'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Costo de consumo
              </button>
              <button
                type="button"
                onClick={() => setCostMode('packages')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  costMode === 'packages'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cálculo aproximado redondeando a paquetes enteros según tu biblioteca de insumos"
              >
                Compra de paquetes
              </button>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {costMode === 'consumption' ? 'Consumo estimado' : 'Estimado en paquetes'}
              </div>
              <div className="text-lg font-extrabold text-slate-900 tabular-nums">
                {formatCurrency(costMode === 'consumption' ? summary.totalEstimatedCost : totalPackageCost)}
              </div>
            </div>
          </div>
        </div>

        {summary.hasProvisionalCalculations && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-bold">Cálculo provisional advertido:</strong> Algunas unidades o recetas tienen conversiones sin densidad o datos incompletos. Las cantidades se conservan de forma separada para no distorsionar tus compras.
            </div>
          </div>
        )}
      </div>

      {/* Filtros de la lista */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
              filterState === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
              filterState === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({allItems.length - checkedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('checked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
              filterState === 'checked'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comprados ({checkedCount})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tildá cada casilla al comprar o verificar en tu obrador
        </div>
      </div>

      {/* Lista de filas de ingredientes */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredItems.map((item) => {
          const isExpanded = expandedKeys.has(item.key)
          const hasWaste = item.totalGrossQuantity > item.totalNetQuantity
          const lib = item.libraryItem

          return (
            <div
              key={item.key}
              className={`transition-colors duration-150 ${
                item.isChecked ? 'bg-slate-50/70 opacity-75' : 'hover:bg-slate-50/40'
              }`}
            >
              <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                {/* Checkbox y Nombre */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggleChecked(item.key, !item.isChecked)}
                    className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      item.isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                    aria-label={`Marcar ${item.name} como comprado`}
                  >
                    {item.isChecked && <Check className="h-4 w-4 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold text-slate-900 truncate ${
                          item.isChecked ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {item.name}
                      </span>

                      {lib && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                          <Layers className="h-2.5 w-2.5" />
                          <span>Biblioteca</span>
                        </span>
                      )}

                      {item.isProvisional && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>Provisional</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span>{item.origins.length} {item.origins.length === 1 ? 'elaboración' : 'elaboraciones'}</span>
                      {hasWaste && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-medium">
                            Incluye merma (Neto: {item.totalNetQuantity} {item.unit})
                          </span>
                        </>
                      )}
                      {lib && costMode === 'packages' && item.packagesNeeded !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-purple-900 font-semibold">
                            {item.packagesNeeded} {item.packagesNeeded === 1 ? 'paquete' : 'paquetes'} ({lib.package_quantity} {lib.package_unit})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cantidad y costo */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                  <div>
                    <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                      {item.totalGrossQuantity.toLocaleString('es-AR', { maximumFractionDigits: 2 })}{' '}
                      <span className="text-xs font-bold text-slate-600">{item.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium tabular-nums">
                      {formatCurrency(
                        costMode === 'packages' && item.estimatedPackagePurchaseCost !== undefined
                          ? item.estimatedPackagePurchaseCost
                          : item.estimatedConsumptionCost
                      )}
                    </div>
                  </div>

                  {/* Botón desplegar desglose */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.key)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]"
                    aria-label={`Ver desglose de ${item.name}`}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Desglose de orígenes (Acordeón) */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 pt-1">
                    Orígenes de este insumo:
                  </div>

                  <div className="space-y-1.5 divide-y divide-slate-100/80">
                    {item.origins.map((orig, oIdx) => (
                      <div key={oIdx} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {orig.recipeName}
                          </span>
                          {orig.isSubrecipe && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/50">
                              Subreceta {orig.parentRecipeName ? `en ${orig.parentRecipeName}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="font-mono font-medium text-slate-700 tabular-nums">
                          {orig.grossQuantity.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {orig.unit}
                        </div>
                      </div>
                    ))}
                  </div>

                  {item.warnings.length > 0 && (
                    <div className="pt-2 text-amber-700 text-[11px] flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.warnings.join(' ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
