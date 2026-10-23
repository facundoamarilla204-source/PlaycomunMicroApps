import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProductionPlansServer,
  getProductionPlanByIdServer,
  saveProductionPlanServer,
  deleteProductionPlanServer,
  togglePlanIngredientCheckedServer,
} from '../production-plans'
import { SaveProductionPlanInput } from '@/lib/gastronomia/types'

const mockGetUser = vi.fn()
const mockIsProUser = vi.fn()

let mockPlans: any[] = []
let mockPlanItems: any[] = []
let mockRecipes: any[] = []

vi.mock('@/lib/pro', () => ({
  isProUser: (id: string) => mockIsProUser(id),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === 'production_plans') {
        return {
          select: vi.fn((_cols?: string) => {
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              chain.currentFiltered = (chain.currentFiltered || mockPlans).filter(
                (p: any) => p[col] === val
              )
              return chain
            })
            chain.order = vi.fn(() => chain)
            chain.single = vi.fn(async () => {
              const item = chain.currentFiltered ? chain.currentFiltered[0] : mockPlans[0]
              if (!item) return { data: null, error: { message: 'Plan no encontrado' } }
              return {
                data: {
                  ...item,
                  items: mockPlanItems.filter((i) => i.plan_id === item.id),
                },
                error: null,
              }
            })
            chain.then = (resolve: any, reject?: any) => {
              const res = {
                data: (chain.currentFiltered !== undefined ? chain.currentFiltered : mockPlans).map(
                  (p: any) => ({
                    ...p,
                    items: mockPlanItems.filter((i) => i.plan_id === p.id),
                  })
                ),
                error: null,
              }
              return Promise.resolve(res).then(resolve, reject)
            }
            return chain
          }),
          insert: vi.fn((payload: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const newId = payload.id || 'plan-new-' + Math.random().toString(36).substring(7)
                const created = { ...payload, id: newId }
                mockPlans.push(created)
                return { data: created, error: null }
              }),
            })),
          })),
          update: vi.fn((payload: any) => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => {
                const idx = mockPlans.findIndex((p) => p[col1] === val1 && p[col2] === val2)
                if (idx !== -1) {
                  mockPlans[idx] = { ...mockPlans[idx], ...payload }
                }
                return Promise.resolve({ error: null })
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => {
                mockPlans = mockPlans.filter((p) => !(p[col1] === val1 && p[col2] === val2))
                mockPlanItems = mockPlanItems.filter((i) => i.plan_id !== val1)
                return Promise.resolve({ error: null })
              }),
            })),
          })),
        }
      }

      if (table === 'production_plan_items') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => {
              mockPlanItems = mockPlanItems.filter((i) => i[col] !== val)
              return Promise.resolve({ error: null })
            }),
          })),
          insert: vi.fn(async (items: any[]) => {
            mockPlanItems.push(...items)
            return { error: null }
          }),
        }
      }

      if (table === 'recipes') {
        return {
          select: vi.fn((_cols?: string) => ({
            eq: vi.fn((col: string, val: any) => ({
              in: vi.fn((inCol: string, inVals: any[]) => {
                const filtered = mockRecipes.filter(
                  (r) => r[col] === val && inVals.includes(r[inCol])
                )
                return Promise.resolve({ data: filtered, error: null })
              }),
            })),
          })),
        }
      }

      return {}
    }),
  })),
}))

describe('Acciones de Servidor: Planes de Producción', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlans = []
    mockPlanItems = []
    mockRecipes = [
      {
        id: 'rec-1',
        user_id: 'user-123',
        name: 'Torta Selva Negra',
        yield_quantity: 12,
        yield_unit: 'unidades',
        category: 'Tortas',
      },
      {
        id: 'rec-2',
        user_id: 'user-123',
        name: 'Alfajores de Maicena',
        yield_quantity: 24,
        yield_unit: 'unidades',
        category: 'Pastelería',
      },
    ]

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'pastelero@obrador.com' } },
    })
    mockIsProUser.mockResolvedValue(true)
  })

  it('rechaza consultas de planes si el usuario no tiene suscripción Pro', async () => {
    mockIsProUser.mockResolvedValue(false)
    const res = await getProductionPlansServer()
    expect(res.data).toBeNull()
    expect(res.isProRequired).toBe(true)
    expect(res.error).toBeDefined()
  })

  it('guarda un plan de producción nuevo con sus recetas e ítems de forma consistente', async () => {
    const input: SaveProductionPlanInput = {
      name: 'Producción Fin de Semana',
      production_date: '2026-10-25',
      status: 'planned',
      notes: 'Para retiro el domingo 10hs',
      items: [
        {
          recipe_id: 'rec-1',
          target_quantity: 24,
          target_unit: 'unidades',
          scaling_factor: 2,
        },
        {
          recipe_id: 'rec-2',
          target_quantity: 48,
          target_unit: 'unidades',
          scaling_factor: 2,
        },
      ],
    }

    const saveRes = await saveProductionPlanServer(input)
    expect(saveRes.error).toBeNull()
    expect(saveRes.data?.id).toBeDefined()

    // Comprobar que se guardó en mockPlans y mockPlanItems
    expect(mockPlans).toHaveLength(1)
    expect(mockPlans[0].name).toBe('Producción Fin de Semana')
    expect(mockPlanItems).toHaveLength(2)
    expect(mockPlanItems[0].snapshot_recipe_name).toBe('Torta Selva Negra')
    expect(mockPlanItems[1].snapshot_recipe_name).toBe('Alfajores de Maicena')
  })

  it('rechaza guardar un plan si incluye recetas que no pertenecen al usuario', async () => {
    const input: SaveProductionPlanInput = {
      name: 'Plan no autorizado',
      items: [
        {
          recipe_id: 'rec-ajena',
          target_quantity: 10,
          target_unit: 'unidades',
        },
      ],
    }

    const res = await saveProductionPlanServer(input)
    expect(res.data).toBeNull()
    expect(res.error).toContain('no pertenece a tu cuenta')
    expect(mockPlans).toHaveLength(0)
  })

  it('recupera un plan existente con sus recetas ordenadas', async () => {
    mockPlans.push({
      id: 'plan-existing-1',
      user_id: 'user-123',
      name: 'Lunes Festivo',
      production_date: '2026-10-26',
      status: 'draft',
      notes: null,
      checked_ingredients: ['free:harina:mass'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    mockPlanItems.push({
      id: 'item-1',
      plan_id: 'plan-existing-1',
      recipe_id: 'rec-1',
      target_quantity: 12,
      target_unit: 'unidades',
      scaling_factor: 1,
      position: 0,
      snapshot_recipe_name: 'Torta Selva Negra',
      snapshot_yield_quantity: 12,
      snapshot_yield_unit: 'unidades',
    })

    const res = await getProductionPlanByIdServer('plan-existing-1')
    expect(res.error).toBeNull()
    expect(res.data).toBeDefined()
    expect(res.data?.name).toBe('Lunes Festivo')
    expect(res.data?.items).toHaveLength(1)
    expect(res.data?.checked_ingredients).toContain('free:harina:mass')
  })

  it('permite alternar el estado marcado de un insumo de compra', async () => {
    mockPlans.push({
      id: 'plan-chk',
      user_id: 'user-123',
      name: 'Plan Checklist',
      checked_ingredients: [],
    })

    const checkRes = await togglePlanIngredientCheckedServer('plan-chk', 'lib:manteca', true)
    expect(checkRes.success).toBe(true)
    expect(checkRes.checkedIngredients).toContain('lib:manteca')

    const uncheckRes = await togglePlanIngredientCheckedServer('plan-chk', 'lib:manteca', false)
    expect(uncheckRes.success).toBe(true)
    expect(uncheckRes.checkedIngredients).not.toContain('lib:manteca')
  })

  it('elimina un plan de producción y sus ítems asociados', async () => {
    mockPlans.push({
      id: 'plan-to-del',
      user_id: 'user-123',
      name: 'Plan Cancelado',
    })
    mockPlanItems.push({
      id: 'item-del-1',
      plan_id: 'plan-to-del',
      recipe_id: 'rec-1',
    })

    const delRes = await deleteProductionPlanServer('plan-to-del')
    expect(delRes.success).toBe(true)
    expect(delRes.error).toBeNull()
    expect(mockPlans).toHaveLength(0)
    expect(mockPlanItems).toHaveLength(0)
  })
})
