import { describe, it, expect } from 'vitest'
import {
  calculateOrderLineTotals,
  calculateOrderFinancials,
  validateOrderStatusTransition,
  isDeliveryOverdue,
  groupOrdersByDeliveryDate,
  checkProductionOrderDivergence
} from '../orders'
import { KitchenOrder, ProductionPlan } from '../types'

describe('Motor Comercial de Pedidos Amasia (Fase 10)', () => {
  describe('calculateOrderLineTotals', () => {
    it('calcula correctamente el subtotal de una línea de producto', () => {
      const res = calculateOrderLineTotals({
        quantity: 3,
        unit_price: 1500,
        reference_cost_per_unit: 650
      })

      expect(res.subtotal).toBe(4500)
      expect(res.referenceTotalCost).toBe(1950)
    })

    it('maneja valores sin costo de referencia', () => {
      const res = calculateOrderLineTotals({
        quantity: 2,
        unit_price: 1200
      })

      expect(res.subtotal).toBe(2400)
      expect(res.referenceTotalCost).toBeNull()
    })
  })

  describe('calculateOrderFinancials', () => {
    it('calcula totales, seña, saldo restante y margen estimado', () => {
      const summary = calculateOrderFinancials({
        items: [
          { quantity: 2, unit_price: 2500, reference_cost_per_unit: 1000 },
          { quantity: 1, unit_price: 5000, reference_cost_per_unit: 2200 }
        ],
        discountAmount: 1000,
        deliveryFee: 500,
        depositAmount: 4000
      })

      // Subtotal: (2 * 2500) + (1 * 5000) = 10000
      expect(summary.subtotal).toBe(10000)
      // Total: 10000 - 1000 + 500 = 9500
      expect(summary.totalAmount).toBe(9500)
      // Seña / Anticipo: 4000
      expect(summary.depositAmount).toBe(4000)
      // Saldo restante: 9500 - 4000 = 5500
      expect(summary.balanceAmount).toBe(5500)
      // Costo total de referencia: (2 * 1000) + (1 * 2200) = 4200
      expect(summary.totalReferenceCost).toBe(4200)
      // Ganancia estimada: 9500 - 4200 = 5300
      expect(summary.estimatedProfit).toBe(5300)
      // Margen %: (5300 / 9500) * 100 = 55.8%
      expect(summary.estimatedMarginPct).toBe(55.8)
      expect(summary.hasMissingCosts).toBe(false)
    })

    it('identifica cuando faltan costos de referencia en algún producto', () => {
      const summary = calculateOrderFinancials({
        items: [
          { quantity: 1, unit_price: 3000, reference_cost_per_unit: null }
        ],
        depositAmount: 1000
      })

      expect(summary.subtotal).toBe(3000)
      expect(summary.totalAmount).toBe(3000)
      expect(summary.balanceAmount).toBe(2000)
      expect(summary.hasMissingCosts).toBe(true)
    })
  })

  describe('validateOrderStatusTransition', () => {
    it('permite transiciones secuenciales lógicas del ciclo de vida', () => {
      expect(validateOrderStatusTransition('recibido', 'confirmado').isValid).toBe(true)
      expect(validateOrderStatusTransition('confirmado', 'en_preparacion').isValid).toBe(true)
      expect(validateOrderStatusTransition('en_preparacion', 'listo').isValid).toBe(true)
      expect(validateOrderStatusTransition('listo', 'entregado').isValid).toBe(true)
    })

    it('permite cancelar desde estados no terminales', () => {
      expect(validateOrderStatusTransition('recibido', 'cancelado').isValid).toBe(true)
      expect(validateOrderStatusTransition('confirmado', 'cancelado').isValid).toBe(true)
      expect(validateOrderStatusTransition('en_preparacion', 'cancelado').isValid).toBe(true)
      expect(validateOrderStatusTransition('listo', 'cancelado').isValid).toBe(true)
    })

    it('rechaza transiciones inválidas y estados terminales', () => {
      const deliveredToPending = validateOrderStatusTransition('entregado', 'recibido')
      expect(deliveredToPending.isValid).toBe(false)
      expect(deliveredToPending.reason).toContain('No se puede cambiar el estado')

      const receivedToDelivered = validateOrderStatusTransition('recibido', 'entregado')
      expect(receivedToDelivered.isValid).toBe(false)
    })
  })

  describe('isDeliveryOverdue', () => {
    it('detecta pedidos vencidos respecto a la fecha de referencia', () => {
      expect(isDeliveryOverdue('2026-10-20', 'confirmado', '2026-10-22')).toBe(true)
      expect(isDeliveryOverdue('2026-10-25', 'confirmado', '2026-10-22')).toBe(false)
    })

    it('no marca como vencidos los pedidos ya entregados o cancelados', () => {
      expect(isDeliveryOverdue('2026-10-18', 'entregado', '2026-10-22')).toBe(false)
      expect(isDeliveryOverdue('2026-10-18', 'cancelado', '2026-10-22')).toBe(false)
    })
  })

  describe('groupOrdersByDeliveryDate', () => {
    it('agrupa y ordena pedidos por día y por horario de entrega', () => {
      const orders = [
        {
          id: '1',
          user_id: 'u1',
          order_code: 'PED-2026-0001',
          client_name_snapshot: 'Ana',
          order_date: '2026-10-20',
          delivery_date: '2026-10-24',
          delivery_time: '18:00',
          status: 'confirmado',
          status_updated_at: '2026-10-20T10:00:00Z',
          subtotal: 5000,
          discount_amount: 0,
          delivery_fee: 0,
          total_amount: 5000,
          deposit_amount: 0,
          balance_amount: 5000,
          status_history: [],
          created_at: '2026-10-20T10:00:00Z',
          updated_at: '2026-10-20T10:00:00Z'
        },
        {
          id: '2',
          user_id: 'u1',
          order_code: 'PED-2026-0002',
          client_name_snapshot: 'Bruno',
          order_date: '2026-10-20',
          delivery_date: '2026-10-24',
          delivery_time: '10:30',
          status: 'recibido',
          status_updated_at: '2026-10-20T10:00:00Z',
          subtotal: 3000,
          discount_amount: 0,
          delivery_fee: 0,
          total_amount: 3000,
          deposit_amount: 0,
          balance_amount: 3000,
          status_history: [],
          created_at: '2026-10-20T10:00:00Z',
          updated_at: '2026-10-20T10:00:00Z'
        },
        {
          id: '3',
          user_id: 'u1',
          order_code: 'PED-2026-0003',
          client_name_snapshot: 'Carla',
          order_date: '2026-10-20',
          delivery_date: '2026-10-25',
          delivery_time: null,
          status: 'confirmado',
          status_updated_at: '2026-10-20T10:00:00Z',
          subtotal: 4000,
          discount_amount: 0,
          delivery_fee: 0,
          total_amount: 4000,
          deposit_amount: 0,
          balance_amount: 4000,
          status_history: [],
          created_at: '2026-10-20T10:00:00Z',
          updated_at: '2026-10-20T10:00:00Z'
        }
      ] as KitchenOrder[]

      const grouped = groupOrdersByDeliveryDate(orders)
      expect(Object.keys(grouped)).toEqual(['2026-10-24', '2026-10-25'])
      // El día 24 debe tener 2 pedidos, primero el de las 10:30 y luego el de las 18:00
      expect(grouped['2026-10-24'][0].order_code).toBe('PED-2026-0002')
      expect(grouped['2026-10-24'][1].order_code).toBe('PED-2026-0001')
      expect(grouped['2026-10-25']).toHaveLength(1)
    })
  })

  describe('checkProductionOrderDivergence', () => {
    it('detecta si la producción se planificó para después de la fecha de entrega', () => {
      const order = {
        delivery_date: '2026-10-24',
        items: []
      } as unknown as KitchenOrder

      const plan = {
        production_date: '2026-10-26',
        items: []
      } as unknown as ProductionPlan

      const res = checkProductionOrderDivergence(order, plan)
      expect(res.hasDivergence).toBe(true)
      expect(res.warnings[0]).toContain('posterior a la fecha de entrega')
    })

    it('detecta productos faltantes o con cantidades menores en el plan vinculado', () => {
      const order = {
        delivery_date: '2026-10-24',
        items: [
          { recipe_id: 'r1', product_name: 'Torta Lemon Pie', quantity: 4, unit: 'unidades' },
          { recipe_id: 'r2', product_name: 'Cheesecake', quantity: 2, unit: 'unidades' }
        ]
      } as unknown as KitchenOrder

      const plan = {
        production_date: '2026-10-24',
        items: [
          { recipe_id: 'r1', target_quantity: 2 } // Solo 2 en lugar de 4
          // r2 no está
        ]
      } as unknown as ProductionPlan

      const res = checkProductionOrderDivergence(order, plan)
      expect(res.hasDivergence).toBe(true)
      expect(res.warnings).toHaveLength(2)
      expect(res.warnings.some(w => w.includes('es inferior a la solicitada'))).toBe(true)
      expect(res.warnings.some(w => w.includes('no está incluido en el plan'))).toBe(true)
    })

    it('pasa sin divergencia cuando el plan cubre adecuadamente el pedido', () => {
      const order = {
        delivery_date: '2026-10-24',
        items: [
          { recipe_id: 'r1', product_name: 'Torta Lemon Pie', quantity: 2, unit: 'unidades' }
        ]
      } as unknown as KitchenOrder

      const plan = {
        production_date: '2026-10-23',
        items: [
          { recipe_id: 'r1', target_quantity: 3 }
        ]
      } as unknown as ProductionPlan

      const res = checkProductionOrderDivergence(order, plan)
      expect(res.hasDivergence).toBe(false)
      expect(res.warnings).toHaveLength(0)
    })
  })
})
