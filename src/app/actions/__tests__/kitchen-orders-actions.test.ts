import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getKitchenClientsServer,
  getKitchenClientByIdServer,
  saveKitchenClientServer,
  toggleKitchenClientActiveServer,
  deleteKitchenClientServer,
  getKitchenOrdersServer,
  getKitchenOrderByIdServer,
  saveKitchenOrderServer,
  updateKitchenOrderStatusServer,
  linkOrderToProductionPlanServer,
  createProductionPlanFromOrderServer,
} from '../kitchen-orders'
import { SaveKitchenClientInput, SaveKitchenOrderInput } from '@/lib/gastronomia/types'

const mockGetUser = vi.fn()
const mockIsProUser = vi.fn()
const mockRpc = vi.fn()

let mockClients: any[] = []
let mockOrders: any[] = []

vi.mock('@/lib/pro', () => ({
  isProUser: (id: string) => mockIsProUser(id),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === 'kitchen_clients') {
        return {
          select: vi.fn((_cols?: string, opts?: any) => {
            if (opts?.count === 'exact' && opts?.head) {
              const chain: any = {}
              chain.eq = vi.fn((col: string, val: any) => chain)
              chain.then = (resolve: any) => resolve({ count: 0, error: null })
              return chain
            }
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              chain.currentFiltered = (chain.currentFiltered || mockClients).filter(
                (c: any) => c[col] === val
              )
              return chain
            })
            chain.order = vi.fn(() => chain)
            chain.single = vi.fn(async () => {
              const item = chain.currentFiltered ? chain.currentFiltered[0] : mockClients[0]
              if (!item) return { data: null, error: { message: 'Cliente no encontrado' } }
              return { data: item, error: null }
            })
            chain.then = (resolve: any, reject?: any) => {
              const res = {
                data: chain.currentFiltered !== undefined ? chain.currentFiltered : mockClients,
                error: null,
              }
              return Promise.resolve(res).then(resolve, reject)
            }
            return chain
          }),
          insert: vi.fn((data: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const inserted = { id: 'client-new', ...data }
                mockClients.push(inserted)
                return { data: inserted, error: null }
              }),
            })),
          })),
          update: vi.fn((data: any) => {
            const filters: Record<string, any> = {}
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              filters[col] = val
              return chain
            })
            chain.select = vi.fn(() => ({
              single: vi.fn(async () => {
                const item = mockClients.find((c) => c.id === filters.id)
                if (item) Object.assign(item, data)
                return { data: item || { id: filters.id, ...data }, error: null }
              }),
            }))
            chain.then = (resolve: any) => {
              const item = mockClients.find((c) => c.id === filters.id)
              if (item) Object.assign(item, data)
              return Promise.resolve({ error: null }).then(resolve)
            }
            return chain
          }),
          delete: vi.fn(() => {
            const chain: any = {}
            chain.eq = vi.fn(() => chain)
            chain.then = (resolve: any) => {
              return Promise.resolve({ error: null }).then(resolve)
            }
            return chain
          }),
        }
      }

      if (table === 'kitchen_orders') {
        return {
          select: vi.fn((_cols?: string, opts?: any) => {
            if (opts?.count === 'exact' && opts?.head) {
              const chain: any = {}
              chain.eq = vi.fn(() => chain)
              chain.then = (resolve: any) => resolve({ count: 0, error: null })
              return chain
            }
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              chain.currentFiltered = (chain.currentFiltered || mockOrders).filter(
                (o: any) => o[col] === val
              )
              return chain
            })
            chain.order = vi.fn(() => chain)
            chain.single = vi.fn(async () => {
              const item = chain.currentFiltered ? chain.currentFiltered[0] : mockOrders[0]
              if (!item) return { data: null, error: { message: 'Pedido no encontrado' } }
              return { data: item, error: null }
            })
            chain.then = (resolve: any, reject?: any) => {
              const res = {
                data: chain.currentFiltered !== undefined ? chain.currentFiltered : mockOrders,
                error: null,
              }
              return Promise.resolve(res).then(resolve, reject)
            }
            return chain
          }),
          update: vi.fn((data: any) => {
            const filters: Record<string, any> = {}
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              filters[col] = val
              return chain
            })
            chain.then = (resolve: any) => {
              const item = mockOrders.find((o) => o.id === filters.id)
              if (item) Object.assign(item, data)
              return Promise.resolve({ error: null }).then(resolve)
            }
            return chain
          }),
        }
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            then: (r: any) => r({ data: [], error: null }),
          })),
        })),
      }
    }),
  })),
}))

describe('Kitchen Orders Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClients = []
    mockOrders = []
    mockGetUser.mockResolvedValue({ data: { user: { id: 'usr-123' } } })
    mockIsProUser.mockResolvedValue(true)
  })

  describe('Control de acceso Pro y autenticación', () => {
    it('debe rechazar consultas si no hay usuario autenticado', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const res = await getKitchenClientsServer()
      expect(res.data).toBeNull()
      expect(res.error).toContain('Debes iniciar sesión')
    })

    it('debe rechazar consultas si el usuario no es Pro', async () => {
      mockIsProUser.mockResolvedValueOnce(false)
      const res = await getKitchenClientsServer()
      expect(res.data).toBeNull()
      expect(res.error).toBeDefined()
    })
  })

  describe('Directorio de Clientes', () => {
    it('debe crear un nuevo cliente con datos válidos', async () => {
      const input: SaveKitchenClientInput = {
        name: 'Pastelería Bella',
        phone: '+54 11 4444-5555',
        email: 'info@bella.com',
        address: 'Av. Corrientes 1234',
        notes: 'Entrega por la mañana',
      }

      const res = await saveKitchenClientServer(input)
      expect(res.error).toBeNull()
      expect(res.data?.name).toBe('Pastelería Bella')
    })

    it('debe rechazar la creación de cliente si el nombre está vacío', async () => {
      const input: SaveKitchenClientInput = {
        name: '   ',
      }
      const res = await saveKitchenClientServer(input)
      expect(res.data).toBeNull()
      expect(res.error).toContain('El nombre del cliente es obligatorio')
    })

    it('debe permitir desactivar un cliente sin borrarlo', async () => {
      mockClients = [
        {
          id: 'c-1',
          user_id: 'usr-123',
          name: 'Cliente Activo',
          is_active: true,
        },
      ]

      const res = await toggleKitchenClientActiveServer('c-1', false)
      expect(res.success).toBe(true)
      expect(mockClients[0].is_active).toBe(false)
    })
  })

  describe('Pedidos Comerciales', () => {
    it('debe rechazar pedidos sin fecha de entrega o sin productos', async () => {
      const noDateInput: SaveKitchenOrderInput = {
        client_name_snapshot: 'Cliente Ok',
        delivery_date: '',
        items: [{ product_name: 'Pan', quantity: 1, unit: 'u', unit_price: 100 }],
      }

      const res = await saveKitchenOrderServer(noDateInput)
      expect(res.data).toBeNull()
      expect(res.error).toContain('La fecha de entrega es obligatoria')

      const noItemsInput: SaveKitchenOrderInput = {
        client_name_snapshot: 'Cliente Ok',
        delivery_date: '2026-11-01',
        items: [],
      }
      const res2 = await saveKitchenOrderServer(noItemsInput)
      expect(res2.data).toBeNull()
      expect(res2.error).toContain('El pedido debe contener al menos un producto')
    })

    it('debe llamar a la función RPC transaccional al guardar un pedido válido', async () => {
      mockRpc.mockResolvedValueOnce({
        data: 'ord-uuid-999',
        error: null,
      })

      const input: SaveKitchenOrderInput = {
        client_name_snapshot: 'Hotel Plaza',
        delivery_date: '2026-11-15',
        delivery_time: '14:30',
        items: [
          {
            product_name: 'Croissant Francés',
            quantity: 50,
            unit: 'unidades',
            unit_price: 1200,
            reference_cost_per_unit: 450,
            reference_total_cost: 22500,
          },
        ],
        deposit_amount: 20000,
      }

      const res = await saveKitchenOrderServer(input)
      expect(res.error).toBeNull()
      expect(res.data?.id).toBe('ord-uuid-999')
      expect(mockRpc).toHaveBeenCalledWith(
        'save_kitchen_order_transaction',
        expect.objectContaining({
          p_client_name_snapshot: 'Hotel Plaza',
          p_deposit_amount: 20000,
        })
      )
    })

    it('debe validar la transición de estados respetando las reglas de negocio', async () => {
      mockOrders = [
        {
          id: 'ord-1',
          user_id: 'usr-123',
          order_code: 'PED-001',
          status: 'recibido',
          status_history: [],
        },
      ]

      // Transición válida: recibido -> confirmado
      const validRes = await updateKitchenOrderStatusServer('ord-1', 'confirmado', 'Aprobado con seña')
      expect(validRes.success).toBe(true)

      // Transición inválida: de confirmado a entregado sin pasar por preparación y listo
      const invalidRes = await updateKitchenOrderStatusServer('ord-1', 'entregado', 'Entrega sin preparar')
      expect(invalidRes.success).toBe(false)
      expect(invalidRes.error).toContain('No se puede cambiar el estado de "Confirmado" a "Entregado"')
    })
  })

  describe('Integración con Producción', () => {
    it('debe invocar la RPC para crear un plan de producción desde el pedido', async () => {
      mockRpc.mockResolvedValueOnce({
        data: 'plan-uuid-created',
        error: null,
      })

      const res = await createProductionPlanFromOrderServer(
        'ord-1',
        'Plan Lote Fin de Semana',
        '2026-11-14'
      )

      expect(res.error).toBeNull()
      expect(res.data?.planId).toBe('plan-uuid-created')
      expect(mockRpc).toHaveBeenCalledWith('create_production_plan_from_order_transaction', {
        p_order_id: 'ord-1',
        p_plan_name: 'Plan Lote Fin de Semana',
        p_production_date: '2026-11-14',
      })
    })

    it('debe vincular un pedido a un plan existente con la RPC transaccional', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const res = await linkOrderToProductionPlanServer('ord-1', 'plan-existing-1', 'Tanda matutina')
      expect(res.success).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('link_order_production_plan_transaction', {
        p_order_id: 'ord-1',
        p_plan_id: 'plan-existing-1',
        p_notes: 'Tanda matutina',
      })
    })
  })
})
