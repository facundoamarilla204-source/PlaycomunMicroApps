'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  ShoppingCart,
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  PackageCheck,
  ChevronRight,
  Trash2,
  Eye,
} from 'lucide-react'
import type { PurchaseOrder } from '@/lib/gastronomia/types'
import { deletePurchaseOrderServer } from '@/app/actions/purchase-orders'
import { ReceiveOrderModal } from './ReceiveOrderModal'

interface PurchaseOrdersListProps {
  initialOrders: PurchaseOrder[]
}

export function PurchaseOrdersList({ initialOrders }: PurchaseOrdersListProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modal de recepción
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase().trim()) ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase().trim())

    if (!matchesSearch) return false

    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false
    }

    return true
  })

  // Estadísticas operativas
  const totalPurchases = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total || 0), 0)

  const pendingReceiptCount = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'partially_received'
  ).length

  const completedCount = orders.filter((o) => o.status === 'received').length

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>Borrador</span>
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Truck className="h-3 w-3 text-sky-600" />
            <span>Confirmada</span>
          </span>
        )
      case 'partially_received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Recepción parcial</span>
          </span>
        )
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Recibida</span>
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3 text-rose-500" />
            <span>Cancelada</span>
          </span>
        )
      default:
        return null
    }
  }

  const handleDelete = async (id: string, orderNum: string) => {
    if (!confirm(`¿Eliminar la orden de compra "${orderNum}"?`)) return
    setDeletingId(id)
    const res = await deletePurchaseOrderServer(id)
    setDeletingId(null)
    if (!res.error) {
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen Operativo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Total en órdenes de compra</span>
            <ShoppingCart className="h-4 w-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            ${totalPurchases.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {orders.length} órdenes registradas
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Pendientes de recepción</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-800 tabular-nums">
            {pendingReceiptCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Mercadería en tránsito o parcial
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Completadas e ingresadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {completedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Stock incorporado al inventario
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número de orden o proveedor..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px] shrink-0"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="confirmed">Confirmadas</option>
            <option value="partially_received">Recepción parcial</option>
            <option value="received">Recibidas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <Link
            href="/cocina-pro/compras/nueva"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-xs transition-colors shrink-0 min-h-[44px] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva orden</span>
          </Link>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-slate-800">
              No se encontraron órdenes de compra
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Probá modificando los filtros aplicados.'
                : 'Creá tu primera orden de compra para abastecer la producción con trazabilidad de costos y stock.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link
                href="/cocina-pro/compras/nueva"
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Crear orden de compra</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Vista Desktop: Tabla */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">N° Orden</th>
                  <th className="py-3 px-3">Proveedor</th>
                  <th className="py-3 px-3">Fecha emisión</th>
                  <th className="py-3 px-3">Entrega esperada</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrders.map((order) => {
                  const canReceive =
                    order.status === 'confirmed' || order.status === 'partially_received'
                  const canDelete =
                    order.status === 'draft' || order.status === 'cancelled'

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/cocina-pro/compras/${order.id}`}
                          className="hover:text-brand transition-colors"
                        >
                          {order.order_number}
                        </Link>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {order.supplier_name}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        {order.issue_date}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        {order.expected_delivery_date || 'Inmediata'}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        ${Number(order.total).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3.5 px-3">{getStatusBadge(order.status)}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canReceive && (
                            <button
                              type="button"
                              onClick={() => setReceivingOrderId(order.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors min-h-[36px]"
                              title="Registrar recepción de mercadería en almacén"
                            >
                              <PackageCheck className="h-3.5 w-3.5 text-emerald-700" />
                              <span>Recibir</span>
                            </button>
                          )}

                          <Link
                            href={`/cocina-pro/compras/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[36px]"
                            title="Ver o editar orden"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Detalle</span>
                          </Link>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(order.id, order.order_number)}
                              disabled={deletingId === order.id}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Eliminar orden"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

            {/* Vista Mobile: Tarjetas estructuradas */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const canReceive =
                  order.status === 'confirmed' || order.status === 'partially_received'
                const canDelete =
                  order.status === 'draft' || order.status === 'cancelled'

                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/cocina-pro/compras/${order.id}`}
                          className="font-mono font-bold text-slate-900 text-sm hover:text-brand block truncate"
                        >
                          {order.order_number}
                        </Link>
                        <span className="text-xs text-slate-600 font-semibold block mt-0.5 truncate">
                          {order.supplier_name}
                        </span>
                      </div>
                      <div className="shrink-0">{getStatusBadge(order.status)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Emisión / Entrega</span>
                        <span className="text-slate-700 font-medium block">
                          {order.issue_date}
                        </span>
                        <span className="text-slate-400 text-[10px] block">
                          {order.expected_delivery_date
                            ? `Entrega: ${order.expected_delivery_date}`
                            : 'Entrega inmediata'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500 text-[10px] block">Total orden</span>
                        <span className="font-mono font-bold text-slate-900 text-base">
                          ${Number(order.total).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {canReceive && (
                        <button
                          type="button"
                          onClick={() => setReceivingOrderId(order.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold transition-colors min-h-[44px] active:scale-95"
                        >
                          <PackageCheck className="h-4 w-4 text-emerald-700" />
                          <span>Recibir mercadería</span>
                        </button>
                      )}

                      <Link
                        href={`/cocina-pro/compras/${order.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[44px] active:scale-95"
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                        <span>Ver detalle</span>
                      </Link>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id, order.order_number)}
                          disabled={deletingId === order.id}
                          className="p-2.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Eliminar orden"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Recepción */}
      {receivingOrderId && (
        <ReceiveOrderModal
          orderId={receivingOrderId}
          onClose={() => setReceivingOrderId(null)}
          onSuccess={() => {
            setReceivingOrderId(null)
            // Recargar datos o actualizar estado local
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
