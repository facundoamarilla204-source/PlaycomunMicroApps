'use client'

import { useEffect, useState } from 'react'
import {
  X,
  PackageCheck,
  AlertCircle,
  Check,
  RefreshCw,
  Calendar,
  Tag,
  Info,
} from 'lucide-react'
import type { PurchaseOrder, PurchaseOrderItem } from '@/lib/gastronomia/types'
import {
  getPurchaseOrderByIdServer,
  receivePurchaseOrderServer,
} from '@/app/actions/purchase-orders'

interface ReceiveOrderModalProps {
  orderId: string
  onClose: () => void
  onSuccess: () => void
}

interface LineReceiptState {
  item_id: string
  received_quantity: number
  unit_price: number
  lot_number: string
  expiration_date: string
}

export function ReceiveOrderModal({
  orderId,
  onClose,
  onSuccess,
}: ReceiveOrderModalProps) {
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lineStates, setLineStates] = useState<Record<string, LineReceiptState>>({})

  useEffect(() => {
    let mounted = true
    async function loadOrder() {
      setLoading(true)
      const res = await getPurchaseOrderByIdServer(orderId)
      if (mounted) {
        if (res.data) {
          setOrder(res.data)
          // Inicializar líneas con el saldo pendiente
          const initialMap: Record<string, LineReceiptState> = {}
          for (const item of res.data.items || []) {
            const pending = Math.max(0, item.ordered_quantity - item.received_quantity)
            initialMap[item.id] = {
              item_id: item.id,
              received_quantity: pending,
              unit_price: item.unit_price,
              lot_number: item.lot_number || '',
              expiration_date: item.expiration_date || '',
            }
          }
          setLineStates(initialMap)
        } else {
          setError(res.error || 'No se pudo cargar la orden.')
        }
        setLoading(false)
      }
    }
    loadOrder()
    return () => {
      mounted = false
    }
  }, [orderId])

  const updateLine = (itemId: string, updates: Partial<LineReceiptState>) => {
    setLineStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...updates,
      },
    }))
  }

  const handleReceiveAll = () => {
    if (!order) return
    const updated: Record<string, LineReceiptState> = {}
    for (const item of order.items || []) {
      const pending = Math.max(0, item.ordered_quantity - item.received_quantity)
      updated[item.id] = {
        ...lineStates[item.id],
        received_quantity: pending,
      }
    }
    setLineStates(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    const itemsToSubmit = Object.values(lineStates).filter(
      (ls) => ls.received_quantity > 0
    )

    if (itemsToSubmit.length === 0) {
      setError('Debes ingresar al menos una cantidad a recibir mayor a cero.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const idempotencyKey = `po_receipt_${order.id}_${Date.now()}`

    const res = await receivePurchaseOrderServer(
      order.id,
      itemsToSubmit.map((ls) => ({
        item_id: ls.item_id,
        received_quantity: ls.received_quantity,
        unit_price: ls.unit_price,
        lot_number: ls.lot_number.trim() || undefined,
        expiration_date: ls.expiration_date || undefined,
      })),
      idempotencyKey
    )

    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      onSuccess()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-receive-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 id="modal-receive-title" className="text-sm font-bold text-slate-900">
                Recepción física de mercadería
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[340px]">
                {order?.order_number} &bull; {order?.supplier_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Efecto transaccional en almacén:</span> La confirmación de esta recepción generará movimientos de entrada inmutables, sumará el stock a cada insumo en su unidad de medida y actualizará los precios de referencia si el costo informado difiere del actual.
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
              <span>Cargando ítems de la orden...</span>
            </div>
          ) : !order ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No se pudo obtener la orden.
            </div>
          ) : (
            <form id="receive-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Ítems a recepcionar en almacén
                </span>
                <button
                  type="button"
                  onClick={handleReceiveAll}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Recibir todo lo pendiente
                </button>
              </div>

              <div className="space-y-3">
                {(order.items || []).map((item) => {
                  const state = lineStates[item.id] || {
                    item_id: item.id,
                    received_quantity: 0,
                    unit_price: item.unit_price,
                    lot_number: '',
                    expiration_date: '',
                  }

                  const pending = Math.max(0, item.ordered_quantity - item.received_quantity)
                  const isFullyReceived = pending === 0

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-colors space-y-3 text-xs ${
                        isFullyReceived
                          ? 'bg-slate-50 border-slate-200/60 opacity-60'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.ingredient_name}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Presentación: {item.package_size} {item.package_unit} &bull; Pedido original: {item.ordered_quantity} envases
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">
                            Ya recibido: {item.received_quantity} / {item.ordered_quantity}
                          </span>
                          <span className="font-semibold text-amber-800 text-xs">
                            Pendiente: {pending} envases
                          </span>
                        </div>
                      </div>

                      {!isFullyReceived && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Envases a recibir ahora *
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max={pending}
                              value={state.received_quantity}
                              onChange={(e) =>
                                updateLine(item.id, {
                                  received_quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs min-h-[38px]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Precio real pagado ($)
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={state.unit_price}
                              onChange={(e) =>
                                updateLine(item.id, {
                                  unit_price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs min-h-[38px]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              N° Lote (opcional)
                            </label>
                            <input
                              type="text"
                              value={state.lot_number}
                              onChange={(e) =>
                                updateLine(item.id, {
                                  lot_number: e.target.value,
                                })
                              }
                              placeholder="Ej. L-2026-X"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs min-h-[38px]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Vencimiento (opcional)
                            </label>
                            <input
                              type="date"
                              value={state.expiration_date}
                              onChange={(e) =>
                                updateLine(item.id, {
                                  expiration_date: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs min-h-[38px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </form>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/75 shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="receive-form"
            disabled={isSubmitting || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Procesando recepción...</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Confirmar ingreso al almacén</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
