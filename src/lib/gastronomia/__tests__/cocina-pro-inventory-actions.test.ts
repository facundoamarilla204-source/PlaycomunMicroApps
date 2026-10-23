import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as proModule from '@/lib/pro'
import * as supabaseServerModule from '@/utils/supabase/server'
import {
  getIngredientStockSummariesServer,
  adjustIngredientStockServer,
  recordProductionConsumptionServer,
} from '@/app/actions/inventory'
import {
  saveSupplierServer,
  saveSupplierIngredientServer,
} from '@/app/actions/suppliers'
import {
  savePurchaseOrderServer,
  receivePurchaseOrderServer,
  deletePurchaseOrderServer,
} from '@/app/actions/purchase-orders'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'

// Mocks
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pro', () => ({
  isProUser: vi.fn(),
}))

describe('Cocina Pro - Fase 9: Auditoría de Server Actions de Inventario, Proveedores y Compras', () => {
  const mockUserPro = { id: 'user-chef-fase9', email: 'chef@amasia.com' }
  const mockUserNoPro = { id: 'user-free', email: 'free@amasia.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Seguridad, Autenticación y Pro Gate', () => {
    it('rechaza llamada anónima en getIngredientStockSummariesServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const result = await getIngredientStockSummariesServer()
      expect(result.data).toBeNull()
      expect(result.error).toContain('Debes iniciar sesión')
    })

    it('bloquea usuario sin plan Pro en adjustIngredientStockServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserNoPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const result = await adjustIngredientStockServer('ing-1', 500, 'g')
      expect(result.success).toBe(false)
      expect(result.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })
  })

  describe('2. Control de Existencias y Ajustes de Stock Trazables', () => {
    it('rechaza cantidades negativas en ajustes de inventario', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await adjustIngredientStockServer('ing-1', -50, 'g')
      expect(result.success).toBe(false)
      expect(result.error).toContain('no puede ser negativa')
    })

    it('registra un movimiento auditable con motivo al realizar un recuento físico', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: { success: true, new_balance: 1500, difference: 300 },
          error: null,
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await adjustIngredientStockServer(
        'ing-1',
        1500,
        'g',
        'Recuento físico de fin de mes'
      )

      expect(result.success).toBe(true)
      expect(result.newBalance).toBe(1500)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('adjust_ingredient_stock_tx', {
        p_ingredient_id: 'ing-1',
        p_new_quantity: 1500,
        p_unit: 'g',
        p_reason: 'Recuento físico de fin de mes',
      })
    })
  })

  describe('3. Gestión de Proveedores y Presentaciones Comerciales', () => {
    it('valida que el nombre de proveedor sea obligatorio', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await saveSupplierServer({ name: '   ' })
      expect(result.data).toBeNull()
      expect(result.error).toContain('nombre del proveedor es obligatorio')
    })

    it('rechaza presentaciones comerciales con tamaño de bulto menor o igual a cero', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await saveSupplierIngredientServer({
        supplier_id: 'sup-1',
        ingredient_id: 'ing-1',
        package_size: 0,
        package_unit: 'kg',
        price: 5000,
      })

      expect(result.data).toBeNull()
      expect(result.error).toContain('mayor a cero')
    })
  })

  describe('4. Órdenes de Compra y Recepción de Mercadería', () => {
    it('crear un borrador de compra no modifica las existencias en almacén', async () => {
      const createdOrder = {
        id: 'po-test-draft',
        order_number: 'OC-20261022-001',
        supplier_name: 'Molino Central',
        status: 'draft',
        total: 15000,
      }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'purchase_orders') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: createdOrder, error: null }),
                }),
              }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: createdOrder, error: null }),
                  }),
                }),
              }),
            }
          }
          if (table === 'purchase_order_items') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await savePurchaseOrderServer(
        {
          supplier_name: 'Molino Central',
          status: 'draft',
        },
        [
          {
            ingredient_name: 'Harina 000',
            ordered_quantity: 2,
            package_size: 5,
            package_unit: 'kg',
            unit_price: 6500,
          },
        ]
      )

      expect(res.data?.status).toBe('draft')
      // No debe llamar a inventory_movements
      expect(mockSupabase.from).not.toHaveBeenCalledWith('inventory_movements')
    })

    it('recepción transaccional invoca RPC receive_purchase_order_tx con clave de idempotencia', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: { success: true, status: 'received', movements_recorded: 2 },
          error: null,
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await receivePurchaseOrderServer(
        'po-123',
        [
          {
            item_id: 'poi-1',
            received_quantity: 2,
            unit_price: 6500,
            lot_number: 'L-2026-X',
            expiration_date: '2027-01-01',
          },
        ],
        'idemp_test_po_123'
      )

      expect(res.success).toBe(true)
      expect(res.status).toBe('received')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('receive_purchase_order_tx', {
        p_order_id: 'po-123',
        p_items: [
          {
            item_id: 'poi-1',
            received_quantity: 2,
            unit_price: 6500,
            lot_number: 'L-2026-X',
            expiration_date: '2027-01-01',
          },
        ],
        p_idempotency_key: 'idemp_test_po_123',
      })
    })

    it('no permite eliminar una orden que ya ha sido recibida físicamente', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { status: 'received' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await deletePurchaseOrderServer('po-received-1')
      expect(res.success).toBe(false)
      expect(res.error).toContain('No se puede eliminar una orden con mercadería recibida')
    })
  })

  describe('5. Consumo de Producción Vinculado a Planes', () => {
    it('registra el consumo real referenciando el plan de producción y completando el plan', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: { success: true, movements_recorded: 3 },
          error: null,
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await recordProductionConsumptionServer(
        'plan-fase9-1',
        [
          { ingredient_id: 'ing-1', quantity: 2000, unit: 'g' },
          { ingredient_id: 'ing-2', quantity: 500, unit: 'g' },
        ],
        'idemp_prod_consume_1'
      )

      expect(res.success).toBe(true)
      expect(res.movementsRecorded).toBe(3)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('record_production_consumption_tx', {
        p_plan_id: 'plan-fase9-1',
        p_items: [
          { ingredient_id: 'ing-1', quantity: 2000, unit: 'g' },
          { ingredient_id: 'ing-2', quantity: 500, unit: 'g' },
        ],
        p_idempotency_key: 'idemp_prod_consume_1',
      })
    })
  })
})
