'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  History,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import type { IngredientStockSummary } from '@/lib/gastronomia/types'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { MovementHistoryDrawer } from './MovementHistoryDrawer'

interface InventoryStockTableProps {
  initialSummaries: IngredientStockSummary[]
  categories: string[]
}

export function InventoryStockTable({
  initialSummaries,
  categories,
}: InventoryStockTableProps) {
  const [summaries, setSummaries] = useState<IngredientStockSummary[]>(initialSummaries)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'out' | 'expiring'>('all')

  // Modales
  const [adjustingIngredient, setAdjustingIngredient] = useState<IngredientStockSummary | null>(null)
  const [viewingHistoryIngredient, setViewingHistoryIngredient] = useState<IngredientStockSummary | null>(null)

  // Filtrado reactivo
  const filteredSummaries = summaries.filter((item) => {
    const matchesSearch = item.ingredient_name
      .toLowerCase()
      .includes(search.toLowerCase().trim())

    const matchesCategory =
      selectedCategory === 'all' ||
      (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase())

    if (!matchesSearch || !matchesCategory) return false

    if (filterMode === 'out') {
      return item.current_balance <= 0
    }
    if (filterMode === 'low') {
      // Menos de 1 presentación de referencia
      return item.current_balance > 0 && item.current_balance < item.reference_package_size
    }
    if (filterMode === 'expiring') {
      return (item.expiring_soon_count || 0) > 0
    }

    return true
  })

  // Totales de inventario valorizado
  const totalValuation = summaries.reduce((acc, it) => acc + (it.total_value || 0), 0)
  const totalOutOfStock = summaries.filter((it) => it.current_balance <= 0).length
  const totalExpiring = summaries.reduce((acc, it) => acc + (it.expiring_soon_count || 0), 0)

  const handleStockUpdated = (ingredientId: string, newBalance: number) => {
    setSummaries((prev) =>
      prev.map((item) => {
        if (item.ingredient_id === ingredientId) {
          const unitPrice =
            item.reference_package_size > 0
              ? item.current_price / item.reference_package_size
              : 0
          return {
            ...item,
            current_balance: newBalance,
            total_value: newBalance * unitPrice,
            last_movement_at: new Date().toISOString(),
          }
        }
        return item
      })
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de pulso del inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Valor total del inventario</span>
            <Layers className="h-4 w-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            ${totalValuation.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summaries.length} insumos en biblioteca
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Insumos sin stock</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {totalOutOfStock}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Requieren reposición para producir
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Lotes por vencer (30 días)</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {totalExpiring}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Prioridad de rotación FIFO
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar insumo por nombre..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px] shrink-0"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFilterMode(filterMode === 'out' ? 'all' : 'out')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 min-h-[44px] flex items-center gap-1.5 ${
                filterMode === 'out'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Agotados</span>
              {totalOutOfStock > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px]">
                  {totalOutOfStock}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterMode(filterMode === 'low' ? 'all' : 'low')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 min-h-[44px] flex items-center gap-1.5 ${
                filterMode === 'low'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Bajo stock</span>
            </button>

            {totalExpiring > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === 'expiring' ? 'all' : 'expiring')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 min-h-[44px] flex items-center gap-1.5 ${
                  filterMode === 'expiring'
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Por vencer</span>
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px]">
                  {totalExpiring}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de existencias */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredSummaries.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-slate-800">
              No se encontraron insumos
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== 'all' || filterMode !== 'all'
                ? 'Probá ajustando los términos de búsqueda o filtros aplicados.'
                : 'Tu biblioteca de ingredientes no tiene insumos registrados para gestionar inventario.'}
            </p>
          </div>
        ) : (
          <>
            {/* Vista Desktop: Tabla completa */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Insumo</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-right">Existencia real</th>
                    <th className="py-3 px-3 text-right">Precio ref.</th>
                    <th className="py-3 px-3 text-right">Valorización</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredSummaries.map((item) => {
                    const isOut = item.current_balance <= 0
                    const isLow =
                      !isOut && item.current_balance < item.reference_package_size
                    const hasExpiring = (item.expiring_soon_count || 0) > 0

                    return (
                      <tr
                        key={item.ingredient_id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{item.ingredient_name}</span>
                            {hasExpiring && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                                title={`${item.expiring_soon_count} lote(s) con vencimiento en los próximos 30 días`}
                              >
                                Vence pronto
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 capitalize text-slate-500">
                          {item.category || 'General'}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-slate-900'
                            }
                          >
                            {Number(item.current_balance).toLocaleString('es-AR', {
                              maximumFractionDigits: 3,
                            })}{' '}
                            <span className="font-normal text-slate-500 text-[11px]">
                              {item.package_unit}
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          ${Number(item.current_price).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                          })}
                          <span className="text-[10px] text-slate-400 block font-sans">
                            x {item.reference_package_size} {item.package_unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          ${Number(item.total_value).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3.5 px-3">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Agotado
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Bajo stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Óptimo
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAdjustingIngredient(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[36px]"
                              title="Registrar recuento físico o ajuste"
                            >
                              <ArrowUpDown className="h-3 w-3 text-slate-500" />
                              <span>Ajustar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewingHistoryIngredient(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[36px]"
                              title="Ver historial de movimientos"
                            >
                              <History className="h-3 w-3 text-slate-500" />
                              <span className="hidden sm:inline">Historial</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista Mobile: Tarjetas compactas táctiles */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredSummaries.map((item) => {
                const isOut = item.current_balance <= 0
                const isLow =
                  !isOut && item.current_balance < item.reference_package_size
                const hasExpiring = (item.expiring_soon_count || 0) > 0

                return (
                  <div key={item.ingredient_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {item.ingredient_name}
                          </h4>
                          {hasExpiring && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Vence pronto
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 capitalize block mt-0.5">
                          {item.category || 'General'}
                        </span>
                      </div>

                      {isOut ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          Agotado
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          Bajo stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Óptimo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Existencia física</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {Number(item.current_balance).toLocaleString('es-AR', {
                            maximumFractionDigits: 3,
                          })}{' '}
                          <span className="font-normal text-xs text-slate-600">
                            {item.package_unit}
                          </span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500 text-[10px] block">Valorización</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${Number(item.total_value).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAdjustingIngredient(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[44px] active:scale-95"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        <span>Ajustar recuento</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingHistoryIngredient(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[44px] active:scale-95"
                      >
                        <History className="h-3.5 w-3.5 text-slate-500" />
                        <span>Ver historial</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modales de Ajuste e Historial */}
      {adjustingIngredient && (
        <StockAdjustmentModal
          ingredient={adjustingIngredient}
          onClose={() => setAdjustingIngredient(null)}
          onSuccess={(newBalance) => {
            handleStockUpdated(adjustingIngredient.ingredient_id, newBalance)
            setAdjustingIngredient(null)
          }}
        />
      )}

      {viewingHistoryIngredient && (
        <MovementHistoryDrawer
          ingredientId={viewingHistoryIngredient.ingredient_id}
          ingredientName={viewingHistoryIngredient.ingredient_name}
          unit={viewingHistoryIngredient.package_unit}
          onClose={() => setViewingHistoryIngredient(null)}
        />
      )}
    </div>
  )
}
