'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  Flame,
  RefreshCw,
  Package,
  Layers,
  Info,
} from 'lucide-react'
import type {
  ConsolidatedIngredientItem,
} from '@/lib/gastronomia/production-plan'
import type {
  IngredientStockSummary,
  SupplierIngredient,
  InventoryShortageComparison,
  ProductionPlanStatus,
} from '@/lib/gastronomia/types'
import { getIngredientStockSummariesServer } from '@/app/actions/inventory'
import { getSupplierIngredientsMapServer } from '@/app/actions/suppliers'
import { recordProductionConsumptionServer } from '@/app/actions/inventory'
import { calculateProductionShortages } from '@/lib/gastronomia/inventory'
import { formatCurrency } from '@/lib/costo-receta'

interface ProductionShortagesTabProps {
  planId?: string
  planName: string
  status: ProductionPlanStatus
  consolidatedIngredients: ConsolidatedIngredientItem[]
  onPlanStatusChanged?: (newStatus: ProductionPlanStatus) => void
}

export function ProductionShortagesTab({
  planId,
  planName,
  status,
  consolidatedIngredients,
  onPlanStatusChanged,
}: ProductionShortagesTabProps) {
  const router = useRouter()
  const [stockSummaries, setStockSummaries] = useState<IngredientStockSummary[]>([])
  const [supplierMap, setSupplierMap] = useState<Record<string, SupplierIngredient[]>>({})
  const [loading, setLoading] = useState(true)
  const [isRecordingConsumption, setIsRecordingConsumption] = useState(false)
  const [consumptionSuccess, setConsumptionSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadStockData() {
      setLoading(true)
      const [stockRes, supRes] = await Promise.all([
        getIngredientStockSummariesServer(),
        getSupplierIngredientsMapServer(),
      ])

      if (mounted) {
        if (stockRes.data) setStockSummaries(stockRes.data)
        if (supRes.data) setSupplierMap(supRes.data)
        setLoading(false)
      }
    }
    loadStockData()
    return () => {
      mounted = false
    }
  }, [])

  // Comparación matemática pura
  const comparisons: InventoryShortageComparison[] = useMemo(() => {
    if (stockSummaries.length === 0 || consolidatedIngredients.length === 0) {
      return []
    }
    return calculateProductionShortages(
      consolidatedIngredients,
      stockSummaries,
      supplierMap
    )
  }, [consolidatedIngredients, stockSummaries, supplierMap])

  const coveredCount = comparisons.filter((c) => c.isCovered).length
  const shortageCount = comparisons.filter((c) => !c.isCovered).length
  const totalPurchaseDisbursement = comparisons.reduce(
    (acc, c) => acc + (c.estimatedPurchaseCost || 0),
    0
  )

  const handleRecordConsumption = async () => {
    if (!planId) {
      setError('Debes guardar el plan de producción antes de registrar el consumo de insumos.')
      return
    }

    if (
      !confirm(
        '¿Confirmás el consumo real de estos insumos? Se registrarán las salidas en tu inventario y el plan pasará a estado completado.'
      )
    ) {
      return
    }

    setIsRecordingConsumption(true)
    setError(null)

    const itemsToConsume = comparisons
      .filter((c) => c.ingredientId)
      .map((c) => ({
        ingredient_id: c.ingredientId!,
        quantity: c.requiredGrossQuantity,
        unit: c.requiredUnit,
      }))

    const res = await recordProductionConsumptionServer(
      planId,
      itemsToConsume,
      `plan_consumption_${planId}`
    )

    setIsRecordingConsumption(false)

    if (res.error) {
      setError(res.error)
    } else {
      setConsumptionSuccess(true)
      if (onPlanStatusChanged) {
        onPlanStatusChanged('completed')
      }
      // Actualizar saldos locales de stock
      const stockRes = await getIngredientStockSummariesServer()
      if (stockRes.data) setStockSummaries(stockRes.data)
    }
  }

  const handleGeneratePurchaseDraft = () => {
    // Redirige al editor de compras con los faltantes pre-cargados
    if (planId) {
      router.push(`/cocina-pro/compras/nueva?from_plan_id=${planId}`)
    } else {
      router.push('/cocina-pro/compras/nueva')
    }
  }

  if (loading) {
    return (
      <div className="py-14 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
        <span>Comparando necesidades de producción contra existencias de almacén...</span>
      </div>
    )
  }

  if (consolidatedIngredients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs">
        <Boxes className="h-10 w-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
        <h3 className="text-sm font-bold text-slate-900">
          No hay ingredientes en este plan
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Añadí recetas a producir en la primera pestaña para calcular qué insumos tenés en almacén y qué compras necesitás hacer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Mensajes de error o éxito */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {consumptionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Consumo registrado exitosamente. Se descontaron los insumos del almacén y el plan se marcó como completado.
          </span>
        </div>
      )}

      {/* Tarjetas de Resumen de Cobertura */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Insumos cubiertos en stock</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {coveredCount} de {comparisons.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Disponibles en el obrador para producir
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Insumos con faltante</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-800 tabular-nums">
            {shortageCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Requieren compra previa a elaboración
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Desembolso estimado en compras</span>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-950 tabular-nums">
            ${totalPurchaseDisbursement.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Adquiriendo envases completos de reposición
          </p>
        </div>
      </div>

      {/* Barra de Acciones del Abastecimiento */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Circuito de abastecimiento y ejecución
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Prepará el pedido a proveedores con los faltantes o confirmá el consumo cuando el lote haya sido elaborado.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {shortageCount > 0 && (
            <button
              type="button"
              onClick={handleGeneratePurchaseDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Generar borrador de compra ({shortageCount})</span>
            </button>
          )}

          {status !== 'completed' && !consumptionSuccess && (
            <button
              type="button"
              onClick={handleRecordConsumption}
              disabled={isRecordingConsumption}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-xl shadow-xs transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
              title="Registrar consumos definitivos en almacén al terminar de producir"
            >
              <Flame className="h-4 w-4 text-amber-700" />
              <span>
                {isRecordingConsumption ? 'Registrando...' : 'Registrar consumo real'}
              </span>
            </button>
          )}

          {status === 'completed' && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Producción finalizada y stock consumido</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabla de Comparación Detallada */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Vista Desktop: Tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Insumo</th>
                <th className="py-3 px-3 text-right">Necesidad bruta</th>
                <th className="py-3 px-3 text-right">Stock disponible</th>
                <th className="py-3 px-3 text-right">Faltante</th>
                <th className="py-3 px-3">Compra sugerida</th>
                <th className="py-3 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisons.map((c, idx) => {
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      c.isCovered ? 'bg-white' : 'bg-rose-50/20'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        <span>{c.ingredientName}</span>
                        {c.preferredSupplierName && (
                          <span className="text-[11px] text-slate-500 block font-normal">
                            Proveedor habitual: {c.preferredSupplierName}
                          </span>
                        )}
                        {c.warnings.length > 0 && (
                          <span className="text-[10px] text-amber-700 block font-normal mt-0.5">
                            {c.warnings.join(' • ')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                      {c.requiredGrossQuantity.toLocaleString('es-AR', {
                        maximumFractionDigits: 3,
                      })}{' '}
                      <span className="font-normal text-slate-500 text-[11px]">
                        {c.requiredUnit}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-700">
                      {c.availableStock.toLocaleString('es-AR', {
                        maximumFractionDigits: 3,
                      })}{' '}
                      <span className="font-normal text-slate-500 text-[11px]">
                        {c.stockUnit}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                      {c.shortageQuantity > 0 ? (
                        <span className="text-rose-600">
                          {c.shortageQuantity.toLocaleString('es-AR', {
                            maximumFractionDigits: 3,
                          })}{' '}
                          <span className="font-normal text-slate-500 text-[11px]">
                            {c.requiredUnit}
                          </span>
                        </span>
                      ) : (
                        <span className="text-emerald-700">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {c.packagesToOrder > 0 ? (
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">
                            {c.packagesToOrder}{' '}
                            {c.packagesToOrder === 1 ? 'bulto' : 'bultos'} (
                            {c.suggestedPackageSize} {c.suggestedPackageUnit})
                          </span>
                          <span className="text-[11px] text-purple-700 block font-mono">
                            ~${c.estimatedPurchaseCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No requerida</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {c.isCovered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Cubierto</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertTriangle className="h-3 w-3 text-rose-600" />
                          <span>Faltante</span>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile: Tarjetas estructuradas */}
        <div className="md:hidden divide-y divide-slate-100">
          {comparisons.map((c, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {c.ingredientName}
                  </h4>
                  {c.preferredSupplierName && (
                    <span className="text-[11px] text-slate-500 block">
                      Proveedor: {c.preferredSupplierName}
                    </span>
                  )}
                  {c.warnings.length > 0 && (
                    <span className="text-[10px] text-amber-700 block font-normal mt-0.5">
                      {c.warnings.join(' • ')}
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  {c.isCovered ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Cubierto</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>Faltante</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Necesidad</span>
                  <span className="font-mono font-bold text-slate-900 text-xs tabular-nums block">
                    {c.requiredGrossQuantity.toLocaleString('es-AR', { maximumFractionDigits: 2 })}{' '}
                    <span className="font-normal text-[10px] text-slate-500">{c.requiredUnit}</span>
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">En stock</span>
                  <span className="font-mono font-semibold text-slate-700 text-xs tabular-nums block">
                    {c.availableStock.toLocaleString('es-AR', { maximumFractionDigits: 2 })}{' '}
                    <span className="font-normal text-[10px] text-slate-500">{c.stockUnit}</span>
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">Faltante</span>
                  <span
                    className={`font-mono font-bold text-xs tabular-nums block ${
                      c.shortageQuantity > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {c.shortageQuantity > 0
                      ? `${c.shortageQuantity.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${c.requiredUnit}`
                      : '0'}
                  </span>
                </div>
              </div>

              {c.packagesToOrder > 0 && (
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                      Compra sugerida
                    </span>
                    <span className="font-semibold text-slate-900">
                      {c.packagesToOrder} {c.packagesToOrder === 1 ? 'bulto' : 'bultos'} de {c.suggestedPackageSize} {c.suggestedPackageUnit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-purple-900 text-xs block">
                      ~${c.estimatedPurchaseCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
