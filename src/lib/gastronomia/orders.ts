/**
 * Amasia - Motor Comercial de Pedidos, Clientes y Calendario Gastronómico
 * PlayComun Online Pro Architecture - Fase 10
 */

import {
  KitchenOrder,
  KitchenOrderStatus,
  OrderFinancialSummary,
  ProductionPlan
} from './types'

export interface OrderLineCalculationInput {
  quantity: number
  unit_price: number
  reference_cost_per_unit?: number | null
}

/**
 * Metadata visual y semántica para los estados del ciclo de vida del pedido.
 */
export const KITCHEN_ORDER_STATUS_METADATA: Record<
  KitchenOrderStatus,
  {
    label: string
    description: string
    color: string
    badgeClass: string
    borderClass: string
  }
> = {
  recibido: {
    label: 'Recibido',
    description: 'Pedido registrado por el cliente, pendiente de confirmación',
    color: 'violet',
    badgeClass: 'bg-violet-50 text-violet-900 border-violet-200/80',
    borderClass: 'border-l-[#7f22fe]'
  },
  confirmado: {
    label: 'Confirmado',
    description: 'Pedido acordado con el cliente, listo para programar producción',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200/80',
    borderClass: 'border-l-amber-500'
  },
  en_preparacion: {
    label: 'En preparación',
    description: 'Elaboración en curso en obrador o cocina',
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
    borderClass: 'border-l-indigo-500'
  },
  listo: {
    label: 'Listo para entregar',
    description: 'Productos elaborados y empaquetados, aguardando retiro o despacho',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    borderClass: 'border-l-emerald-500'
  },
  entregado: {
    label: 'Entregado',
    description: 'Pedido despachado y entregado con éxito al cliente',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    borderClass: 'border-l-slate-400'
  },
  cancelado: {
    label: 'Cancelado',
    description: 'Pedido anulado por el cliente o por el obrador',
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-200/80',
    borderClass: 'border-l-rose-500'
  }
}

/**
 * Calcula con precisión financiera los importes de una línea individual.
 */
export function calculateOrderLineTotals(item: OrderLineCalculationInput): {
  subtotal: number
  referenceTotalCost: number | null
} {
  const qty = Math.max(0, Number(item.quantity) || 0)
  const price = Math.max(0, Number(item.unit_price) || 0)
  const subtotal = Math.round(qty * price * 100) / 100

  let referenceTotalCost: number | null = null
  if (item.reference_cost_per_unit !== undefined && item.reference_cost_per_unit !== null) {
    const costPerUnit = Math.max(0, Number(item.reference_cost_per_unit) || 0)
    referenceTotalCost = Math.round(qty * costPerUnit * 100) / 100
  }

  return { subtotal, referenceTotalCost }
}

/**
 * Motor de cálculo financiero unificado para pedidos comerciales.
 * Garantiza consistencia matemática entre subtotales, anticipos, saldos y márgenes estimados.
 */
export function calculateOrderFinancials(params: {
  items: Array<{
    quantity: number
    unit_price: number
    reference_cost_per_unit?: number | null
    reference_total_cost?: number | null
  }>
  discountAmount?: number
  deliveryFee?: number
  depositAmount?: number
}): OrderFinancialSummary {
  const discount = Math.max(0, Number(params.discountAmount) || 0)
  const fee = Math.max(0, Number(params.deliveryFee) || 0)
  const deposit = Math.max(0, Number(params.depositAmount) || 0)

  let subtotal = 0
  let totalReferenceCost = 0
  let hasMissingCosts = false

  for (const item of params.items) {
    const lineTotals = calculateOrderLineTotals(item)
    subtotal += lineTotals.subtotal

    if (lineTotals.referenceTotalCost !== null) {
      totalReferenceCost += lineTotals.referenceTotalCost
    } else {
      hasMissingCosts = true
    }
  }

  subtotal = Math.round(subtotal * 100) / 100
  totalReferenceCost = Math.round(totalReferenceCost * 100) / 100

  const totalAmount = Math.max(0, Math.round((subtotal - discount + fee) * 100) / 100)
  const depositAmount = Math.min(totalAmount, Math.round(deposit * 100) / 100)
  const balanceAmount = Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100)

  const estimatedProfit = Math.round((totalAmount - totalReferenceCost) * 100) / 100
  const estimatedMarginPct =
    totalAmount > 0
      ? Math.round(((totalAmount - totalReferenceCost) / totalAmount) * 1000) / 10
      : 0

  return {
    subtotal,
    discountAmount: discount,
    deliveryFee: fee,
    totalAmount,
    depositAmount,
    balanceAmount,
    totalReferenceCost,
    estimatedProfit,
    estimatedMarginPct,
    hasMissingCosts
  }
}

/**
 * Matriz de transiciones permitidas en el ciclo de vida del pedido.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<KitchenOrderStatus, KitchenOrderStatus[]> = {
  recibido: ['confirmado', 'cancelado'],
  confirmado: ['en_preparacion', 'listo', 'cancelado'],
  en_preparacion: ['listo', 'confirmado', 'cancelado'],
  listo: ['entregado', 'en_preparacion', 'cancelado'],
  entregado: [], // Estado terminal
  cancelado: ['recibido'] // Reactivación explícita
}

/**
 * Valida si una transición de estado es válida según las reglas comerciales de Amasia.
 */
export function validateOrderStatusTransition(
  currentStatus: KitchenOrderStatus,
  targetStatus: KitchenOrderStatus
): { isValid: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { isValid: true }
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || []
  if (allowed.includes(targetStatus)) {
    return { isValid: true }
  }

  return {
    isValid: false,
    reason: `No se puede cambiar el estado de "${KITCHEN_ORDER_STATUS_METADATA[currentStatus].label}" a "${KITCHEN_ORDER_STATUS_METADATA[targetStatus].label}".`
  }
}

/**
 * Verifica si una fecha de entrega está vencida considerando el estado actual del pedido.
 */
export function isDeliveryOverdue(
  deliveryDateStr: string,
  status: KitchenOrderStatus,
  referenceDateStr?: string
): boolean {
  if (status === 'entregado' || status === 'cancelado') {
    return false
  }

  const today = referenceDateStr || new Date().toISOString().split('T')[0]
  return deliveryDateStr < today
}

/**
 * Agrupa pedidos por fecha de entrega ('YYYY-MM-DD') para visualización en calendario o agenda.
 */
export function groupOrdersByDeliveryDate(
  orders: KitchenOrder[]
): Record<string, KitchenOrder[]> {
  const grouped: Record<string, KitchenOrder[]> = {}

  for (const order of orders) {
    const dateKey = order.delivery_date
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(order)
  }

  // Ordenar los pedidos dentro de cada día: con horario primero, luego por código
  for (const dateKey in grouped) {
    grouped[dateKey].sort((a, b) => {
      if (a.delivery_time && b.delivery_time) {
        return a.delivery_time.localeCompare(b.delivery_time)
      }
      if (a.delivery_time) return -1
      if (b.delivery_time) return 1
      return a.order_code.localeCompare(b.order_code)
    })
  }

  return grouped
}

/**
 * Detecta divergencias entre los requerimientos de un pedido y su plan de producción vinculado.
 * Informa si cambian las fechas o si los productos solicitados no concuerdan con el plan.
 */
export function checkProductionOrderDivergence(
  order: KitchenOrder,
  plan: ProductionPlan
): {
  hasDivergence: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // 1. Verificar divergencia de fechas
  if (order.delivery_date < plan.production_date) {
    warnings.push(
      `La fecha de producción del plan (${plan.production_date}) es posterior a la fecha de entrega del pedido (${order.delivery_date}).`
    )
  }

  // 2. Verificar recetas solicitadas vs recetas en el plan
  const planItemsByRecipe = new Map<string, number>()
  if (plan.items) {
    for (const item of plan.items) {
      planItemsByRecipe.set(item.recipe_id, Number(item.target_quantity) || 0)
    }
  }

  if (order.items) {
    for (const line of order.items) {
      if (!line.recipe_id) continue

      const planQty = planItemsByRecipe.get(line.recipe_id)
      if (planQty === undefined) {
        warnings.push(
          `El producto "${line.product_name}" solicitado en el pedido no está incluido en el plan de producción vinculado.`
        )
      } else if (planQty < line.quantity) {
        warnings.push(
          `La cantidad en el plan (${planQty} ${line.unit}) es inferior a la solicitada en el pedido (${line.quantity} ${line.unit}) para "${line.product_name}".`
        )
      }
    }
  }

  return {
    hasDivergence: warnings.length > 0,
    warnings
  }
}
