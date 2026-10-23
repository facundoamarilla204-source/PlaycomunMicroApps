'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Search,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'
import { KitchenOrder } from '@/lib/gastronomia/types'
import {
  KITCHEN_ORDER_STATUS_METADATA,
  isDeliveryOverdue,
} from '@/lib/gastronomia/orders'

interface OrdersListProps {
  initialOrders: KitchenOrder[]
}

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders] = useState<KitchenOrder[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [dateFilter, setDateFilter] = useState<string>('todos')

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const filteredOrders = useMemo(() => {
    let result = orders

    if (statusFilter !== 'todos') {
      result = result.filter((o) => o.status === statusFilter)
    }

    if (dateFilter === 'hoy') {
      result = result.filter((o) => o.delivery_date === todayStr)
    } else if (dateFilter === 'semana') {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]
      result = result.filter(
        (o) => o.delivery_date >= todayStr && o.delivery_date <= nextWeekStr
      )
    } else if (dateFilter === 'vencidos') {
      result = result.filter((o) =>
        isDeliveryOverdue(o.delivery_date, o.status, todayStr)
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          o.client_name_snapshot.toLowerCase().includes(q) ||
          (o.notes && o.notes.toLowerCase().includes(q)) ||
          o.items?.some((it) => it.product_name.toLowerCase().includes(q))
      )
    }

    return result
  }, [orders, statusFilter, dateFilter, searchQuery, todayStr])

  const stats = useMemo(() => {
    const active = orders.filter(
      (o) => o.status !== 'entregado' && o.status !== 'cancelado'
    )
    const overdue = orders.filter((o) =>
      isDeliveryOverdue(o.delivery_date, o.status, todayStr)
    )
    const ready = orders.filter((o) => o.status === 'listo')
    const pendingBalance = active.reduce((acc, o) => acc + (o.balance_amount || 0), 0)

    return {
      pending: active.length,
      overdue: overdue.length,
      ready: ready.length,
      pendingBalance,
    }
  }, [orders, todayStr])

  return (
    <div className="space-y-6">
      {/* Encabezado con identidad de Amasia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              Operación comercial
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Amasia</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#7f22fe]" />
            Pedidos y Entregas ({orders.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Gestión de pedidos gastronómicos, precios acordados, fechas de entrega y coordinación directa con el planificador de producción.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/cocina-pro/calendario"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-all min-h-[44px] active:scale-[0.98]"
          >
            <CalendarDays className="w-4 h-4 text-[#7f22fe]" />
            <span>Ver calendario</span>
          </Link>
          <Link
            href="/cocina-pro/pedidos/nuevo"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] text-white font-semibold text-xs shadow-xs transition-all min-h-[44px] cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Nuevo pedido</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500">En gestión</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">
            {stats.pending}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recibidos o en tanda</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Listos p/ entrega</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-sans">
            {stats.ready}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Esperando despacho</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Entregas atrasadas</div>
          <div
            className={`text-2xl font-bold mt-1 font-sans ${
              stats.overdue > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {stats.overdue}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fecha vencida sin entregar</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Saldo por cobrar</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">
            ${stats.pendingBalance.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pendiente de cobro</div>
        </div>
      </div>

      {/* Barra de filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, cliente o producto..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] focus:bg-white transition-all min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="recibido">Recibido</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo">Listo p/ entregar</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Selector de fecha */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            aria-label="Filtrar por fecha de entrega"
          >
            <option value="todos">Cualquier fecha</option>
            <option value="hoy">Entrega hoy</option>
            <option value="semana">Próximos 7 días</option>
            <option value="vencidos">Atrasados / Vencidos</option>
          </select>
        </div>
      </div>

      {/* Contenido: listado de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 font-sans">
            {searchQuery || statusFilter !== 'todos' || dateFilter !== 'todos'
              ? 'Sin pedidos para los filtros seleccionados'
              : 'Aún no registraste pedidos comerciales'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery || statusFilter !== 'todos' || dateFilter !== 'todos'
              ? 'Probá restableciendo los filtros o modificando la búsqueda.'
              : 'Registrá los pedidos de tus clientes con precios acordados, fechas de entrega y vinculación al planificador.'}
          </p>
          {!searchQuery && statusFilter === 'todos' && dateFilter === 'todos' && (
            <Link
              href="/cocina-pro/pedidos/nuevo"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white transition-all shadow-xs min-h-[44px] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Crear primer pedido
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vista móvil: tarjetas estructuradas (md:hidden) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredOrders.map((o) => {
              const meta = KITCHEN_ORDER_STATUS_METADATA[o.status]
              const overdue = isDeliveryOverdue(o.delivery_date, o.status, todayStr)
              const hasPlan = o.linked_plans && o.linked_plans.length > 0

              return (
                <Link
                  key={o.id}
                  href={`/cocina-pro/pedidos/${o.id}`}
                  className="block p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-[#7f22fe]/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f22fe]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {o.order_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-sans mt-0.5">
                        {o.client_name_snapshot}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Resumen de productos */}
                  <div className="text-xs text-slate-600 mb-3 space-y-0.5">
                    {(o.items || []).slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="truncate pr-2">
                          {it.quantity} {it.unit} · {it.product_name}
                        </span>
                        <span className="font-mono text-slate-500">
                          ${it.subtotal.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                    {(o.items || []).length > 3 && (
                      <div className="text-[11px] text-slate-400 italic">
                        +{(o.items || []).length - 3} producto(s) más
                      </div>
                    )}
                  </div>

                  {/* Fechas y vinculación */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className={overdue ? 'text-rose-600 font-bold' : ''}>
                        {o.delivery_date}
                      </span>
                      {o.delivery_time && (
                        <span className="text-slate-400">({o.delivery_time} hs)</span>
                      )}
                      {overdue && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                          Atrasado
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        ${o.total_amount.toLocaleString('es-AR')}
                      </div>
                      {o.balance_amount > 0 && (
                        <div className="text-[10px] text-slate-700 font-semibold">
                          Resta: ${o.balance_amount.toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasPlan && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex items-center gap-1.5 text-[11px] text-violet-900 font-medium">
                      <Layers className="w-3.5 h-3.5 text-[#7f22fe]" />
                      <span>Plan de producción vinculado</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Vista escritorio: tabla compacta (hidden md:block) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Entrega prevista</th>
                  <th className="py-3 px-4">Productos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Importe total</th>
                  <th className="py-3 px-4 text-right">Saldo restante</th>
                  <th className="py-3 px-4 text-center">Producción</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => {
                  const meta = KITCHEN_ORDER_STATUS_METADATA[o.status]
                  const overdue = isDeliveryOverdue(o.delivery_date, o.status, todayStr)
                  const hasPlan = o.linked_plans && o.linked_plans.length > 0

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700">
                        {o.order_code}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {o.client_name_snapshot}
                        </div>
                        {o.client_contact_snapshot && (
                          <div className="text-xs text-slate-400">{o.client_contact_snapshot}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className={`font-medium ${overdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                          {o.delivery_date}
                        </div>
                        {o.delivery_time ? (
                          <div className="text-slate-400">{o.delivery_time} hs</div>
                        ) : (
                          <div className="text-slate-400">Sin hora pactada</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        {(o.items || []).slice(0, 2).map((it, idx) => (
                          <div key={idx} className="truncate">
                            {it.quantity} {it.unit} · {it.product_name}
                          </div>
                        ))}
                        {(o.items || []).length > 2 && (
                          <div className="text-[11px] text-slate-400">
                            +{(o.items || []).length - 2} más
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        ${o.total_amount.toLocaleString('es-AR')}
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {o.balance_amount > 0 ? (
                          <span className="font-semibold text-slate-800">
                            ${o.balance_amount.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saldado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasPlan ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
                            <Layers className="w-3 h-3 text-[#7f22fe]" /> Vinculado
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin plan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/cocina-pro/pedidos/${o.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-violet-50 hover:text-violet-900 hover:border-violet-200/60 transition-all border border-transparent active:scale-[0.98]"
                        >
                          Ver detalle
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
