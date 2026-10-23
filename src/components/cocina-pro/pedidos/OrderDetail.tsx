'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  DollarSign,
  Layers,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  Loader2,
  XCircle,
  Plus,
} from 'lucide-react'
import {
  KitchenOrder,
  KitchenOrderStatus,
  ProductionPlan,
} from '@/lib/gastronomia/types'
import {
  KITCHEN_ORDER_STATUS_METADATA,
  ALLOWED_STATUS_TRANSITIONS,
  checkProductionOrderDivergence,
} from '@/lib/gastronomia/orders'
import {
  updateKitchenOrderStatusServer,
  createProductionPlanFromOrderServer,
  linkOrderToProductionPlanServer,
} from '@/app/actions/kitchen-orders'

interface OrderDetailProps {
  order: KitchenOrder
  availablePlans?: ProductionPlan[]
}

export function OrderDetail({ order: initialOrder, availablePlans = [] }: OrderDetailProps) {
  const router = useRouter()
  const [order, setOrder] = useState<KitchenOrder>(initialOrder)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    text: string
    isError?: boolean
    isWarning?: boolean
  } | null>(null)

  // Vinculación a producción
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [selectedPlanToLink, setSelectedPlanToLink] = useState('')
  const [isLinkingPlan, setIsLinkingPlan] = useState(false)

  const meta = KITCHEN_ORDER_STATUS_METADATA[order.status]
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.status] || []

  // Divergencias con planes vinculados
  const divergenceAlerts = (order.linked_plans || [])
    .map((lp) => {
      const fullPlan = availablePlans.find((p) => p.id === lp.plan_id)
      if (!fullPlan) return null
      return {
        planName: lp.plan_name,
        ...checkProductionOrderDivergence(order, fullPlan),
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.hasDivergence)

  const handleStatusChange = async (newStatus: KitchenOrderStatus) => {
    setStatusMessage(null)

    if (newStatus === 'entregado') {
      const incompletePlans = (order.linked_plans || []).filter(
        (lp) => lp.status !== 'completed'
      )
      if (incompletePlans.length > 0) {
        if (
          !confirm(
            'Atención: El plan de producción vinculado aún no figura completado. ¿Confirmas la entrega del pedido de todas formas?'
          )
        ) {
          return
        }
      }
    }

    if (newStatus === 'cancelado') {
      if (!confirm('¿Seguro que deseas cancelar este pedido comercial?')) {
        return
      }
    }

    setIsUpdatingStatus(true)
    try {
      const res = await updateKitchenOrderStatusServer(order.id, newStatus)
      if (!res.success) {
        setStatusMessage({ text: res.error || 'Error al cambiar estado.', isError: true })
        setIsUpdatingStatus(false)
        return
      }

      setOrder((prev) => ({
        ...prev,
        status: newStatus,
        status_updated_at: new Date().toISOString(),
        status_history: [
          ...prev.status_history,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: `Estado actualizado a ${KITCHEN_ORDER_STATUS_METADATA[newStatus].label}`,
          },
        ],
      }))

      if (res.warning) {
        setStatusMessage({ text: res.warning, isWarning: true })
      } else {
        setStatusMessage({
          text: `Estado actualizado a "${KITCHEN_ORDER_STATUS_METADATA[newStatus].label}".`,
        })
        setTimeout(() => setStatusMessage(null), 3500)
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error inesperado.', isError: true })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleCreateProductionPlan = async () => {
    if (
      !confirm(
        `¿Crear un nuevo plan de producción en obrador para la fecha ${order.delivery_date} con las recetas de este pedido?`
      )
    ) {
      return
    }

    setIsCreatingPlan(true)
    setStatusMessage(null)

    try {
      const res = await createProductionPlanFromOrderServer(order.id)
      if (res.error || !res.data) {
        setStatusMessage({
          text: res.error || 'No se pudo generar el plan de producción.',
          isError: true,
        })
        setIsCreatingPlan(false)
        return
      }

      router.push(`/cocina-pro/produccion/${res.data.planId}`)
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error inesperado.', isError: true })
      setIsCreatingPlan(false)
    }
  }

  const handleLinkExistingPlan = async () => {
    if (!selectedPlanToLink) return

    setIsLinkingPlan(true)
    setStatusMessage(null)

    try {
      const res = await linkOrderToProductionPlanServer(order.id, selectedPlanToLink)
      if (!res.success) {
        setStatusMessage({
          text: res.error || 'No se pudo vincular el plan.',
          isError: true,
        })
        setIsLinkingPlan(false)
        return
      }

      const planLinked = availablePlans.find((p) => p.id === selectedPlanToLink)
      if (planLinked) {
        setOrder((prev) => ({
          ...prev,
          linked_plans: [
            ...(prev.linked_plans || []),
            {
              plan_id: planLinked.id,
              plan_name: planLinked.name,
              production_date: planLinked.production_date,
              status: planLinked.status,
            },
          ],
        }))
      }

      setSelectedPlanToLink('')
      setStatusMessage({ text: 'Plan de producción vinculado con éxito.' })
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error inesperado.', isError: true })
    } finally {
      setIsLinkingPlan(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Barra de navegación superior con identidad Amasia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              Detalle de pedido
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Amasia</span>
          </div>
          <Link
            href="/cocina-pro/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#7f22fe] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la lista de pedidos
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
              {order.order_code}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Cliente: <strong className="text-slate-900">{order.client_name_snapshot}</strong>
            {order.client_contact_snapshot && (
              <span className="text-xs text-slate-500 ml-2">({order.client_contact_snapshot})</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
            title="Imprimir comprobante comercial"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Imprimir
          </button>
          <Link
            href={`/cocina-pro/pedidos/${order.id}/editar`}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-violet-50 text-violet-900 hover:bg-violet-100 border border-violet-200/80 transition-all min-h-[44px] flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </Link>
        </div>
      </div>

      {/* Alertas y avisos de estado */}
      {statusMessage && (
        <div
          className={`p-4 text-xs sm:text-sm rounded-2xl border ${
            statusMessage.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : statusMessage.isWarning
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Alertas de divergencia con planes vinculados */}
      {divergenceAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Divergencias detectadas con la producción
          </div>
          {divergenceAlerts.map((d, idx) => (
            <div key={idx} className="text-xs space-y-0.5 pl-6">
              <div className="font-semibold">{d.planName}:</div>
              {d.warnings.map((w, wIdx) => (
                <div key={wIdx}>• {w}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Ciclo de vida y transiciones */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Transición de estado
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allowedTransitions.map((t) => {
            const tMeta = KITCHEN_ORDER_STATUS_METADATA[t]
            const isCancel = t === 'cancelado'
            return (
              <button
                key={t}
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange(t)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                  isCancel
                    ? 'border border-red-200 text-red-600 hover:bg-red-50'
                    : 'bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] text-white shadow-xs'
                }`}
              >
                {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Marcar como {tMeta.label}
              </button>
            )
          })}

          {allowedTransitions.length === 0 && (
            <div className="text-xs text-slate-500 italic">
              Este pedido se encuentra en estado terminal ({meta.label}). No admite transiciones automáticas.
            </div>
          )}
        </div>
      </div>

      {/* Ficha principal con datos de entrega y productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Fechas, productos y notas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de entrega y tiempos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 font-sans mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7f22fe]" />
              Programación de entrega
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400">Fecha de recepción</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {order.order_date}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200/60">
                <div className="text-violet-900 font-semibold">
                  Entrega pactada
                </div>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">
                  {order.delivery_date}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400">Horario acordado</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {order.delivery_time ? `${order.delivery_time} hs` : 'Sin horario fijo'}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de productos solicitados */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#7f22fe]" />
              Detalle de productos ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-slate-100">
              {(order.items || []).map((it) => (
                <div key={it.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {it.product_name}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {it.quantity} {it.unit} a ${it.unit_price.toLocaleString('es-AR')} c/u
                    </div>
                    {it.notes && (
                      <div className="text-[11px] text-slate-600 italic mt-0.5">
                        Nota: {it.notes}
                      </div>
                    )}
                    {it.recipe_id && (
                      <Link
                        href={`/cocina-pro/recetas/${it.recipe_id}/editar`}
                        className="text-[10px] text-[#7f22fe] hover:text-[#6c1ce0] font-semibold inline-block mt-1"
                      >
                        Ver receta en el recetario →
                      </Link>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-sm text-slate-900">
                      ${it.subtotal.toLocaleString('es-AR')}
                    </div>
                    {it.reference_cost_per_unit && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Costo ref: ${(it.quantity * it.reference_cost_per_unit).toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones generales */}
          {order.notes && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Instrucciones y observaciones
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha: Cobro, totales e integración con producción */}
        <div className="space-y-6">
          {/* Desglose de cobros y saldo */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#7f22fe]" />
              Liquidación comercial
            </h2>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between items-center py-1.5 text-slate-600">
                <span>Subtotal de productos</span>
                <span className="font-mono font-semibold">${order.subtotal.toLocaleString('es-AR')}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between items-center py-1.5 text-red-600 font-semibold">
                  <span>Descuento aplicado</span>
                  <span className="font-mono">-${order.discount_amount.toLocaleString('es-AR')}</span>
                </div>
              )}

              {order.delivery_fee > 0 && (
                <div className="flex justify-between items-center py-1.5 text-slate-600">
                  <span>Costo de envío</span>
                  <span className="font-mono font-semibold">+${order.delivery_fee.toLocaleString('es-AR')}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2.5 text-sm font-bold text-slate-900">
                <span>Total acordado</span>
                <span className="font-mono text-base">${order.total_amount.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-emerald-700 font-semibold">
                <span>Anticipo / Seña cobrada</span>
                <span className="font-mono">${order.deposit_amount.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm font-bold text-slate-900">
                <span>Saldo por cobrar</span>
                <span className="font-mono text-lg text-slate-900">${order.balance_amount.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Vinculación con Plan de Producción de Obrador */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7f22fe]" />
              Planificador de producción
            </h2>

            {order.linked_plans && order.linked_plans.length > 0 ? (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-500">
                  Planes de tanda asociados a este pedido:
                </div>
                {order.linked_plans.map((lp) => (
                  <div
                    key={lp.plan_id}
                    className="p-3 rounded-xl border border-violet-200 bg-violet-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-violet-900">
                        {lp.plan_name}
                      </div>
                      <div className="text-[11px] text-violet-700 mt-0.5">
                        Elaboración: {lp.production_date} · Estado: {lp.status}
                      </div>
                    </div>
                    <Link
                      href={`/cocina-pro/produccion/${lp.plan_id}`}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#7f22fe] text-white hover:bg-[#6c1ce0] transition-all active:scale-[0.98]"
                    >
                      Abrir plan
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Este pedido aún no tiene un plan de elaboración asignado en el obrador.
                </p>

                <button
                  type="button"
                  disabled={isCreatingPlan}
                  onClick={handleCreateProductionPlan}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer active:scale-[0.98] shadow-xs"
                >
                  {isCreatingPlan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Generar plan de producción
                </button>

                {/* Opción de vincular a plan existente */}
                {availablePlans.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      O vincular a un plan existente:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedPlanToLink}
                        onChange={(e) => setSelectedPlanToLink(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe]"
                      >
                        <option value="">Seleccionar plan...</option>
                        {availablePlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.production_date})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedPlanToLink || isLinkingPlan}
                        onClick={handleLinkExistingPlan}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#7f22fe] text-white hover:bg-[#6c1ce0] transition-all disabled:opacity-50 min-h-[38px] cursor-pointer active:scale-[0.98]"
                      >
                        {isLinkingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Vincular'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historial de estados (Trazabilidad y auditoría) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Historial de cambios
            </h3>
            <div className="space-y-2 text-xs">
              {(order.status_history || []).map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7f22fe] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {h.note || h.status}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(h.timestamp).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
