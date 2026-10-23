'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  ShoppingBag,
  Filter,
  Layers,
  CalendarDays,
  List,
  AlertTriangle,
} from 'lucide-react'
import { KitchenOrder, KitchenOrderStatus } from '@/lib/gastronomia/types'
import {
  KITCHEN_ORDER_STATUS_METADATA,
  groupOrdersByDeliveryDate,
  isDeliveryOverdue,
} from '@/lib/gastronomia/orders'

interface DeliveryCalendarProps {
  orders: KitchenOrder[]
}

type CalendarViewMode = 'mes' | 'semana' | 'agenda'

export function DeliveryCalendar({ orders }: DeliveryCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('agenda')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Filtrado de pedidos
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'todos') {
      return orders
    }
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  // Agrupados por fecha
  const ordersByDate = useMemo(() => {
    return groupOrdersByDeliveryDate(filteredOrders)
  }, [filteredOrders])

  // Navegación temporal
  const handlePrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'mes') {
      d.setMonth(d.getMonth() - 1)
    } else if (viewMode === 'semana') {
      d.setDate(d.getDate() - 7)
    } else {
      d.setDate(d.getDate() - 1)
    }
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'mes') {
      d.setMonth(d.getMonth() + 1)
    } else if (viewMode === 'semana') {
      d.setDate(d.getDate() + 7)
    } else {
      d.setDate(d.getDate() + 1)
    }
    setCurrentDate(d)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Título del período actual
  const periodTitle = useMemo(() => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]
    const year = currentDate.getFullYear()
    const month = months[currentDate.getMonth()]

    if (viewMode === 'mes') {
      return `${month} ${year}`
    } else if (viewMode === 'semana') {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Lunes
      startOfWeek.setDate(diff)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6) // Domingo

      return `${startOfWeek.getDate()} de ${months[startOfWeek.getMonth()]} al ${endOfWeek.getDate()} de ${months[endOfWeek.getMonth()]}, ${year}`
    } else {
      return `${currentDate.getDate()} de ${month} de ${year}`
    }
  }, [currentDate, viewMode])

  // Matriz de días para la vista mensual
  const monthDays = useMemo(() => {
    if (viewMode !== 'mes') return []

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1 // Lunes = 0

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells: Array<{
      dateStr: string
      dayNum: number
      isCurrentMonth: boolean
      isToday: boolean
      orders: KitchenOrder[]
    }> = []

    // Días del mes previo
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i
      const prevDate = new Date(year, month - 1, dNum)
      const dateStr = prevDate.toISOString().split('T')[0]
      cells.push({
        dateStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        orders: ordersByDate[dateStr] || [],
      })
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        orders: ordersByDate[dateStr] || [],
      })
    }

    // Días del mes siguiente para completar grilla de 35 o 42
    const totalCells = cells.length <= 35 ? 35 : 42
    const remaining = totalCells - cells.length
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i)
      const dateStr = nextDate.toISOString().split('T')[0]
      cells.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        orders: ordersByDate[dateStr] || [],
      })
    }

    return cells
  }, [currentDate, viewMode, ordersByDate, todayStr])

  // Días para la vista semanal (7 días)
  const weekDays = useMemo(() => {
    if (viewMode !== 'semana') return []

    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Lunes
    startOfWeek.setDate(diff)

    const days = []
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      days.push({
        name: dayNames[i],
        dayNum: d.getDate(),
        dateStr,
        isToday: dateStr === todayStr,
        orders: ordersByDate[dateStr] || [],
      })
    }

    return days
  }, [currentDate, viewMode, ordersByDate, todayStr])

  // Fechas con pedidos para la vista de agenda
  const agendaDates = useMemo(() => {
    return Object.keys(ordersByDate).sort()
  }, [ordersByDate])

  return (
    <div className="space-y-6">
      {/* Cabecera del calendario con identidad Amasia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              Planificación y logística
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Amasia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-[#7f22fe]" />
            Calendario de Entregas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Programación de pedidos, horarios acordados y coordinación con obrador.
          </p>
        </div>

        {/* Selector de vistas */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[38px] flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
              viewMode === 'agenda'
                ? 'bg-white text-violet-950 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Agenda
          </button>
          <button
            type="button"
            onClick={() => setViewMode('semana')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[38px] flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
              viewMode === 'semana'
                ? 'bg-white text-violet-950 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Semana
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[38px] flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
              viewMode === 'mes'
                ? 'bg-white text-violet-950 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Mes
          </button>
        </div>
      </div>

      {/* Controles de navegación y filtro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-[0.98]"
            aria-label="Período anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all min-h-[44px] cursor-pointer active:scale-[0.98]"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-[0.98]"
            aria-label="Siguiente período"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="text-sm sm:text-base font-bold text-slate-900 ml-2 font-sans">
            {periodTitle}
          </span>
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
          >
            <option value="todos">Todos los estados</option>
            <option value="recibido">Recibidos</option>
            <option value="confirmado">Confirmados</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo">Listos p/ entregar</option>
            <option value="entregado">Entregados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. VISTA AGENDA (Mobile first y operaciones diarias de obrador)     */}
      {/* ==================================================================== */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {agendaDates.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Sin pedidos programados
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                No hay entregas pendientes para los filtros seleccionados.
              </p>
            </div>
          ) : (
            agendaDates.map((dateKey) => {
              const dayOrders = ordersByDate[dateKey] || []
              const isToday = dateKey === todayStr
              const [y, m, d] = dateKey.split('-')
              const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
              const dayOfWeek = [
                'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
              ][dateObj.getDay()]
              const monthName = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
              ][dateObj.getMonth()]

              return (
                <div
                  key={dateKey}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  {/* Encabezado del día */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      isToday
                        ? 'bg-violet-50/80 border-violet-200'
                        : 'bg-slate-50/75 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isToday
                            ? 'bg-[#7f22fe] text-white shadow-xs'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {d}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 font-sans">
                          {dayOfWeek}, {d} de {monthName}
                          {isToday && (
                            <span className="ml-2 text-[11px] font-bold text-violet-900 uppercase tracking-wide">
                              Hoy
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dayOrders.length} pedido(s) programado(s)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Listado de pedidos del día */}
                  <div className="divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
                    {dayOrders.map((o) => {
                      const meta = KITCHEN_ORDER_STATUS_METADATA[o.status]
                      const overdue = isDeliveryOverdue(o.delivery_date, o.status, todayStr)

                      return (
                        <Link
                          key={o.id}
                          href={`/cocina-pro/pedidos/${o.id}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-violet-50/40 hover:border-violet-200 transition-all border border-slate-100 active:scale-[0.99]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 text-center shrink-0">
                              <span className="text-xs font-mono font-bold text-slate-700 block">
                                {o.delivery_time || '--:--'}
                              </span>
                              <span className="text-[10px] text-slate-400">hs</span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  {o.order_code}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {o.client_name_snapshot}
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 mt-0.5">
                                {(o.items || [])
                                  .map((it) => `${it.quantity} ${it.unit} ${it.product_name}`)
                                  .join(', ')}
                              </div>

                              {o.notes && (
                                <div className="text-[11px] text-slate-400 italic mt-0.5">
                                  Nota: {o.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>

                            <div className="text-right">
                              <div className="font-bold font-mono text-sm text-slate-900">
                                ${o.total_amount.toLocaleString('es-AR')}
                              </div>
                              {o.balance_amount > 0 && (
                                <div className="text-[10px] text-slate-700 font-semibold">
                                  Resta: ${o.balance_amount.toLocaleString('es-AR')}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. VISTA SEMANAL                                                    */}
      {/* ==================================================================== */}
      {viewMode === 'semana' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((wDay) => (
            <div
              key={wDay.dateStr}
              className={`rounded-2xl border p-3 flex flex-col min-h-[300px] shadow-xs ${
                wDay.isToday
                  ? 'bg-violet-50/40 border-violet-300'
                  : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    {wDay.name}
                  </span>
                  <div
                    className={`text-lg font-bold font-sans ${
                      wDay.isToday ? 'text-[#7f22fe]' : 'text-slate-900'
                    }`}
                  >
                    {wDay.dayNum}
                  </div>
                </div>
                {wDay.orders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-900 border border-violet-200/80">
                    {wDay.orders.length}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px]">
                {wDay.orders.map((o) => {
                  const meta = KITCHEN_ORDER_STATUS_METADATA[o.status]
                  return (
                    <Link
                      key={o.id}
                      href={`/cocina-pro/pedidos/${o.id}`}
                      className="block p-2 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-violet-50/60 transition-all text-xs active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 mb-0.5">
                        <span>{o.delivery_time || 'Sin hora'}</span>
                        <span className="font-bold text-slate-700">{o.order_code}</span>
                      </div>
                      <div className="font-bold text-slate-900 truncate">
                        {o.client_name_snapshot}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {(o.items || []).map((it) => it.product_name).join(', ')}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        <span className="font-bold font-mono text-[10px] text-slate-900">
                          ${o.total_amount.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. VISTA MENSUAL (Grilla calendario estándar)                       */}
      {/* ==================================================================== */}
      {viewMode === 'mes' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200/90 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Grilla de celdas */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {monthDays.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/40 opacity-40'
                    : cell.isToday
                    ? 'bg-violet-50/40'
                    : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-[#7f22fe] text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {cell.orders.length > 0 && (
                    <span className="text-[10px] font-bold text-violet-900 font-mono">
                      {cell.orders.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-hidden">
                  {cell.orders.slice(0, 2).map((o) => {
                    const meta = KITCHEN_ORDER_STATUS_METADATA[o.status]
                    return (
                      <Link
                        key={o.id}
                        href={`/cocina-pro/pedidos/${o.id}`}
                        className={`block px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${meta.badgeClass}`}
                        title={`${o.order_code} - ${o.client_name_snapshot} (${meta.label})`}
                      >
                        {o.delivery_time ? `${o.delivery_time} ` : ''}
                        {o.client_name_snapshot}
                      </Link>
                    )
                  })}
                  {cell.orders.length > 2 && (
                    <div className="text-[10px] text-slate-400 text-center font-medium">
                      +{cell.orders.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
