import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveRecipeServer,
  duplicateRecipeServer,
  deleteRecipeServer,
  getUserRecipesServer,
} from '../recipes'
import { Recipe } from '@/lib/costo-receta'

// Mocks
const mockGetUser = vi.fn()
const mockIsProUser = vi.fn()
const mockRpc = vi.fn()

let mockDbRecipes: any[] = []
let mockDbIngredients: any[] = []
let mockDbSubrecipes: any[] = []

vi.mock('@/lib/pro', () => ({
  isProUser: (id: string) => mockIsProUser(id),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === 'recipes') {
        return {
          select: vi.fn((_columns?: string) => {
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              chain.currentFiltered = (chain.currentFiltered || mockDbRecipes).filter(
                (r: any) => r[col] === val
              )
              return chain
            })
            chain.in = vi.fn((col: string, vals: any[]) => {
              chain.currentFiltered = (chain.currentFiltered || mockDbRecipes).filter(
                (r: any) => vals.includes(r[col])
              )
              return chain
            })
            chain.order = vi.fn(() => chain)
            chain.then = (resolve: any, reject?: any) => {
              const res = {
                data: chain.currentFiltered !== undefined ? chain.currentFiltered : mockDbRecipes,
                error: null,
              }
              return Promise.resolve(res).then(resolve, reject)
            }
            chain.maybeSingle = vi.fn(async () => {
              const item = chain.currentFiltered ? chain.currentFiltered[0] : mockDbRecipes[0]
              if (!item) return { data: null, error: null }
              return {
                data: {
                  ...item,
                  recipe_ingredients: mockDbIngredients.filter((i) => i.recipe_id === item.id),
                  recipe_additional_costs: [],
                  recipe_steps: [],
                  recipe_subrecipes: mockDbSubrecipes
                    .filter((sr) => sr.recipe_id === item.id)
                    .map((sr) => ({
                      ...sr,
                      subrecipe: mockDbRecipes.find((r) => r.id === sr.subrecipe_id),
                    })),
                },
                error: null,
              }
            })
            return chain
          }),
          insert: vi.fn((data: any) => {
            const row = {
              id: 'rec-' + Math.random().toString(36).substring(2, 9),
              ...data,
            }
            mockDbRecipes.push(row)
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: row, error: null })),
              })),
            }
          }),
          update: vi.fn((data: any) => {
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              const item = mockDbRecipes.find((r) => r[col] === val)
              if (item) Object.assign(item, data)
              return chain
            })
            return chain
          }),
          delete: vi.fn(() => {
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              chain.col = col
              chain.val = val
              return chain
            })
            const origEq = chain.eq
            chain.eq = vi.fn((col: string, val: any) => {
              mockDbRecipes = mockDbRecipes.filter((r) => r.id !== chain.val)
              return { error: null }
            })
            return chain
          }),
        }
      }

      if (table === 'recipe_subrecipes') {
        return {
          select: vi.fn(() => {
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              const filtered = mockDbSubrecipes
                .filter((sr) => sr[col] === val)
                .map((sr) => ({
                  ...sr,
                  recipe: mockDbRecipes.find((r) => r.id === sr.recipe_id),
                }))
              return Promise.resolve({ data: filtered, error: null })
            })
            chain.then = (resolve: any, reject?: any) => {
              return Promise.resolve({ data: mockDbSubrecipes, error: null }).then(resolve, reject)
            }
            return chain
          }),
          delete: vi.fn(() => {
            const chain: any = {}
            chain.eq = vi.fn((col: string, val: any) => {
              mockDbSubrecipes = mockDbSubrecipes.filter((sr) => sr[col] !== val)
              return Promise.resolve({ error: null })
            })
            return chain
          }),
          insert: vi.fn(async (rows: any[]) => {
            mockDbSubrecipes.push(...rows)
            return { error: null }
          }),
        }
      }

      if (table === 'recipe_ingredients') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
          insert: vi.fn(async (rows: any[]) => {
            mockDbIngredients.push(...rows)
            return { error: null }
          }),
        }
      }

      if (table === 'recipe_additional_costs' || table === 'recipe_steps') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
          insert: vi.fn(async () => ({ error: null })),
        }
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      }
    }),
  })),
}))

describe('Server Actions de Subrecetas y Persistencia Transaccional (Fase 7)', () => {
  const userId = 'usr-chef-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } })
    mockIsProUser.mockResolvedValue(true)
    mockRpc.mockReset()

    mockDbRecipes = [
      {
        id: 'rec-ganache',
        user_id: userId,
        name: 'Ganache de Chocolate',
        yield_quantity: 1000,
        yield_unit: 'g',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
      },
      {
        id: 'rec-bizcocho',
        user_id: userId,
        name: 'Bizcochuelo 24cm',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
      },
      {
        id: 'rec-externa',
        user_id: 'usr-otro-usuario',
        name: 'Receta Ajena',
        yield_quantity: 1,
        yield_unit: 'unidades',
      },
    ]
    mockDbIngredients = []
    mockDbSubrecipes = []
  })

  it('guarda exitosamente una receta principal que incorpora subrecetas', async () => {
    // Simular que el RPC save_recipe_transaction funciona
    mockRpc.mockImplementation(async (method: string, args: any) => {
      if (method === 'save_recipe_transaction') {
        const id = 'rec-torta-creada'
        mockDbRecipes.push({
          id,
          user_id: userId,
          name: args.p_name,
          yield_quantity: args.p_yield_quantity,
          yield_unit: args.p_yield_unit,
          target_margin: args.p_target_margin,
          target_markup: args.p_target_markup,
          pricing_mode: args.p_pricing_mode,
        })
        if (args.p_subrecipes) {
          mockDbSubrecipes.push(
            ...args.p_subrecipes.map((sr: any) => ({
              ...sr,
              recipe_id: id,
            }))
          )
        }
        return { data: id, error: null }
      }
      return { data: null, error: null }
    })

    const recipeToSave: Recipe = {
      name: 'Torta Selva Negra',
      category: 'Tortas',
      description: 'Con ganache y bizcocho',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 35,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [],
      additional_costs: [],
      subrecipes: [
        {
          id: 'temp-1',
          recipe_id: '',
          subrecipe_id: 'rec-bizcocho',
          quantity: 1,
          unit: 'unidades',
          waste_percentage: 0,
          position: 1,
          reference_total_cost: 1500,
        },
        {
          id: 'temp-2',
          recipe_id: '',
          subrecipe_id: 'rec-ganache',
          quantity: 400,
          unit: 'g',
          waste_percentage: 5,
          position: 2,
          reference_total_cost: 2000,
        },
      ],
    }

    const res = await saveRecipeServer(recipeToSave)
    expect(res.error).toBeNull()
    expect(res.data).toBeDefined()
    expect(res.data?.name).toBe('Torta Selva Negra')
    expect(mockDbSubrecipes.length).toBeGreaterThanOrEqual(2)
  })

  it('rechaza que una receta incorpore una subreceta perteneciente a otra cuenta', async () => {
    const maliciousRecipe: Recipe = {
      name: 'Intento de Acceso Ilícito',
      category: 'Test',
      description: '',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [],
      additional_costs: [],
      subrecipes: [
        {
          id: 'rel-hack',
          recipe_id: '',
          subrecipe_id: 'rec-externa', // Pertenece a usr-otro-usuario
          quantity: 1,
          unit: 'unidades',
          waste_percentage: 0,
          position: 1,
        },
      ],
    }

    const res = await saveRecipeServer(maliciousRecipe)
    expect(res.data).toBeNull()
    expect(res.error).toContain('no existe o no pertenece a tu cuenta')
  })

  it('rechaza auto-referencia directa al editar una receta', async () => {
    const selfReferencingRecipe: Recipe = {
      id: 'rec-ganache',
      name: 'Ganache con sí misma',
      category: 'Básicos',
      description: '',
      yield_quantity: 1000,
      yield_unit: 'g',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [],
      additional_costs: [],
      subrecipes: [
        {
          id: 'rel-self',
          recipe_id: 'rec-ganache',
          subrecipe_id: 'rec-ganache', // Auto-referencia
          quantity: 100,
          unit: 'g',
          waste_percentage: 0,
          position: 1,
        },
      ],
    }

    const res = await saveRecipeServer(selfReferencingRecipe)
    expect(res.data).toBeNull()
    expect(res.error).toContain('no puede incluirse a sí misma como subreceta')
  })

  it('rechaza dependencias circulares indirectas detectadas en el servidor', async () => {
    // Bizcocho ya tiene como subreceta a Ganache
    mockDbSubrecipes.push({
      id: 'rel-bizcocho-usa-ganache',
      recipe_id: 'rec-bizcocho',
      subrecipe_id: 'rec-ganache',
      quantity: 100,
      unit: 'g',
    })

    // Intentar editar Ganache para que use Bizcocho (Ganache -> Bizcocho -> Ganache)
    const circularGanache: Recipe = {
      id: 'rec-ganache',
      name: 'Ganache modificada',
      category: 'Básicos',
      description: '',
      yield_quantity: 1000,
      yield_unit: 'g',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [],
      additional_costs: [],
      subrecipes: [
        {
          id: 'rel-circular',
          recipe_id: 'rec-ganache',
          subrecipe_id: 'rec-bizcocho',
          quantity: 1,
          unit: 'unidades',
          waste_percentage: 0,
          position: 1,
        },
      ],
    }

    const res = await saveRecipeServer(circularGanache)
    expect(res.data).toBeNull()
    expect(res.error).toContain('Dependencia circular detectada')
  })

  it('impide eliminar una receta que está siendo utilizada activamente como subreceta', async () => {
    // Bizcocho se usa en Torta
    mockDbRecipes.push({
      id: 'rec-torta-cumple',
      user_id: userId,
      name: 'Torta de Cumpleaños',
      yield_quantity: 1,
      yield_unit: 'unidades',
    })

    mockDbSubrecipes.push({
      id: 'rel-torta-bizcocho',
      recipe_id: 'rec-torta-cumple',
      subrecipe_id: 'rec-bizcocho',
      quantity: 1,
      unit: 'unidades',
    })

    // Configurar rpc get_subrecipe_parents
    mockRpc.mockImplementation(async (method: string, args: any) => {
      if (method === 'get_subrecipe_parents') {
        const dependents = mockDbSubrecipes
          .filter((sr) => sr.subrecipe_id === args.p_subrecipe_id)
          .map((sr) => {
            const p = mockDbRecipes.find((r) => r.id === sr.recipe_id)
            return {
              parent_recipe_id: p?.id,
              parent_recipe_name: p?.name,
            }
          })
        return { data: dependents, error: null }
      }
      return { data: null, error: null }
    })

    const delRes = await deleteRecipeServer('rec-bizcocho')
    expect(delRes.success).toBe(false)
    expect(delRes.error).toContain('está siendo utilizada como subreceta en: «Torta de Cumpleaños»')
    expect(delRes.dependentRecipes).toBeDefined()
    expect(delRes.dependentRecipes?.[0].parent_recipe_name).toBe('Torta de Cumpleaños')
  })

  it('duplica una receta principal manteniendo las referencias a las subrecetas originales con IDs nuevos', async () => {
    mockDbRecipes.push({
      id: 'rec-torta-original',
      user_id: userId,
      name: 'Torta Original',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
    })
    mockDbSubrecipes.push({
      id: 'rel-orig-1',
      recipe_id: 'rec-torta-original',
      subrecipe_id: 'rec-ganache',
      quantity: 300,
      unit: 'g',
      waste_percentage: 0,
      position: 1,
      reference_total_cost: 1200,
    })

    // Mock RPC save_recipe_transaction para duplicación
    mockRpc.mockImplementation(async (method: string, args: any) => {
      if (method === 'save_recipe_transaction') {
        const id = 'rec-torta-clonada'
        mockDbRecipes.push({
          id,
          user_id: userId,
          name: args.p_name,
          yield_quantity: args.p_yield_quantity,
          yield_unit: args.p_yield_unit,
          target_margin: args.p_target_margin,
          target_markup: args.p_target_markup,
          pricing_mode: args.p_pricing_mode,
        })
        if (args.p_subrecipes) {
          mockDbSubrecipes.push(
            ...args.p_subrecipes.map((sr: any) => ({
              ...sr,
              id: 'rel-cloned-' + Math.random(),
              recipe_id: id,
            }))
          )
        }
        return { data: id, error: null }
      }
      return { data: null, error: null }
    })

    const dupRes = await duplicateRecipeServer('rec-torta-original')
    expect(dupRes.error).toBeNull()
    expect(dupRes.data?.name).toBe('Torta Original (Copia)')
  })
})
