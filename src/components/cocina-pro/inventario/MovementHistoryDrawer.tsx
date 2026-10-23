'use client'

import { useEffect, useState } from 'react'
import {
  X,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react'
import type { InventoryMovement } from '@/lib/gastronomia/types'
import { getIngredientMovementsServer } from '@/app/actions/inventory'

interface MovementHistoryDrawerProps {
  ingredientId: string
  ingredientName: string
  unit: string
  onClose: () => void
}

export function MovementHistoryDrawer({
  ingredientId,
  ingredientName,
  unit,
  onClose,
}: MovementHistoryDrawerProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchHistory() {
      setLoading(true)
      setError(null)
      const res = await getIngredientMovementsServer(ingredientId)
      if (isMounted) {
        if (res.error) {
          setError(res.error)
        } else {
          setMovements(res.data || [])
        }
        setLoading(false)
      }
    }
    fetchHistory()
    return () => {
      isMounted = false
    }
  }, [ingredientId])

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const getMovementLabel = (mov: InventoryMovement) => {
    switch (mov.movement_type) {
      case 'initial':
        return 'Saldo inicial'
      case 'in':
        return mov.reference_type === 'purchase_order' ? 'Recepción de compra' : 'Entrada de stock'
      case 'out':
        return mov.reference_type === 'production_plan' ? 'Consumo en producción' : 'Salida de stock'
      case 'adjustment':
        return 'Ajuste de inventario'
      case 'compensation':
        return 'Movimiento compensatorio'
      default:
        return 'Movimiento'
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-history-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Encabezado del Drawer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 id="drawer-history-title" className="text-sm font-bold text-slate-900">
                Historial de movimientos
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                {ingredientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar historial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
              <span>Cargando auditoría de movimientos...</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">Sin movimientos registrados</p>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                No se han registrado entradas, recepciones o ajustes para este insumo.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {movements.map((mov) => {
                const isIn = mov.direction === 'in'
                const label = getMovementLabel(mov)

                return (
                  <div
                    key={mov.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/60 transition-colors text-xs space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1 rounded-md ${
                            isIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="font-bold text-slate-900">{label}</span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(mov.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">Cantidad: </span>
                        <span
                          className={`font-mono font-bold ${
                            isIn ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isIn ? '+' : '-'}
                          {Number(mov.quantity).toLocaleString('es-AR', {
                            maximumFractionDigits: 3,
                          })}{' '}
                          {mov.unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">Saldo tras operación: </span>
                        <span className="font-mono font-bold text-slate-900">
                          {Number(mov.balance_after).toLocaleString('es-AR', {
                            maximumFractionDigits: 3,
                          })}{' '}
                          {unit}
                        </span>
                      </div>
                    </div>

                    {mov.reason && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">Motivo: </span>
                        {mov.reason}
                      </p>
                    )}

                    {(mov.lot_number || mov.expiration_date || mov.unit_cost) && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                        {mov.lot_number && (
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3 text-slate-400" />
                            <span>Lote: {mov.lot_number}</span>
                          </span>
                        )}
                        {mov.expiration_date && (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
                            <Calendar className="h-3 w-3 text-purple-500" />
                            <span>Vence: {mov.expiration_date}</span>
                          </span>
                        )}
                        {mov.unit_cost !== null && mov.unit_cost !== undefined && (
                          <span className="font-mono text-slate-600">
                            Costo reg.: ${Number(mov.unit_cost).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pie del Drawer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/75 shrink-0 text-center">
          <p className="text-[11px] text-slate-500">
            Registro cronológico inmutable con trazabilidad auditable.
          </p>
        </div>
      </div>
    </div>
  )
}
