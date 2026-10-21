import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveRecipeServer,
  duplicateRecipeServer,
} from '../recipes'
import { calculateRecipeFinancials, FinancialRecipe } from '@/lib/gastronomia/financials'
import { Recipe } from '@/lib/costo-receta'
import { RecipeStepInput } from '@/lib/gastronomia/types'

// Mocks
const mockGetUser = vi.fn()
const mockIsProUser = vi.fn()
const mockRpc = vi.fn()

// Tablas mockeadas
let mockDbRecipes: any[] = []
let mockDbIngredients: any[] = []
let mockDbSteps: any[] = []
let mockDbKitchenIngredients: any[] = []

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
            chain.order = vi.fn(() => chain)
            chain.maybeSingle = vi.fn(async () => {
              const item = chain.currentFiltered ? chain.currentFiltered[0] : mockDbRecipes[0]
              if (!item) return { data: null, error: null }
              return {
                data: {
                  ...item,
                  recipe_ingredients: mockDbIngredients.filter((i) => i.recipe_id === item.id),
                  recipe_additional_costs: [],
                  recipe_steps: mockDbSteps.filter((s) => s.recipe_id === item.id),
                },
                error: null,
              }
            })
            return chain
          }),
          insert: vi.fn((data: any) => {
            const row = {
              id: 'rec-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data,
            }
            mockDbRecipes.push(row)
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: row, error: null })),
              })),
            }
          }),
          update: vi.fn((data: any) => ({
            eq: vi.fn((_col: string, idVal: string) => {
              const idx = mockDbRecipes.findIndex((r) => r.id === idVal)
              if (idx !== -1) {
                mockDbRecipes[idx] = { ...mockDbRecipes[idx], ...data }
              }
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: mockDbRecipes[idx], error: null })),
                })),
              }
            }),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn((col1: string, val1: string) => ({
              eq: vi.fn(async (col2: string, val2: string) => {
                mockDbRecipes = mockDbRecipes.filter(
                  (r) => !(r[col1] === val1 && r[col2] === val2)
                )
                return { error: null }
              }),
            })),
          })),
        }
      }

      if (table === 'kitchen_ingredients') {
        return {
          select: vi.fn((_cols?: string) => ({
            eq: vi.fn((_col1: string, userId: string) => ({
              in: vi.fn(async (_col2: string, ids: string[]) => {
                const filtered = mockDbKitchenIngredients.filter(
                  (ki) => ki.user_id === userId && ids.includes(ki.id)
                )
                return { data: filtered, error: null }
              }),
            })),
          })),
        }
      }

      if (table === 'recipe_ingredients') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(async (_col: string, recipeId: string) => {
              mockDbIngredients = mockDbIngredients.filter((i) => i.recipe_id !== recipeId)
              return { error: null }
            }),
          })),
          insert: vi.fn(async (data: any[]) => {
            const inserted = (Array.isArray(data) ? data : [data]).map((item) => ({
              id: 'ing-' + Math.random().toString(36).substring(2, 9),
              ...item,
            }))
            mockDbIngredients.push(...inserted)
            return { error: null }
          }),
        }
      }

      if (table === 'recipe_steps') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(async (_col: string, recipeId: string) => {
              mockDbSteps = mockDbSteps.filter((s) => s.recipe_id !== recipeId)
              return { error: null }
            }),
          })),
          insert: vi.fn(async (data: any[]) => {
            const inserted = (Array.isArray(data) ? data : [data]).map((item) => ({
              id: 'stp-' + Math.random().toString(36).substring(2, 9),
              ...item,
            }))
            mockDbSteps.push(...inserted)
            return { error: null }
          }),
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, recipeId: string) => ({
              order: vi.fn(async () => ({
                data: mockDbSteps.filter((s) => s.recipe_id === recipeId),
                error: null,
              })),
            })),
          })),
        }
      }

      if (table === 'recipe_additional_costs') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
          insert: vi.fn(async () => ({ error: null })),
        }
      }

      return {}
    }),
  })),
}))

describe('Cocina Pro - Fase 5: Editor profesional de recetas e integración', () => {
  const USER_ID = 'usr-chef-123'
  const OTHER_USER_ID = 'usr-other-456'

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID, email: 'chef@playcomun.com' } } })
    mockIsProUser.mockResolvedValue(true)

    mockDbRecipes = []
    mockDbIngredients = []
    mockDbSteps = []
    mockDbKitchenIngredients = [
      {
        id: 'ki-flour-1',
        user_id: USER_ID,
        name: 'Harina 0000',
        current_price: 1500,
        package_size: 1,
        package_unit: 'kg',
      },
      {
        id: 'ki-butter-1',
        user_id: USER_ID,
        name: 'Manteca pastelera',
        current_price: 3200,
        package_size: 500,
        package_unit: 'g',
      },
      {
        id: 'ki-stranger-1',
        user_id: OTHER_USER_ID,
        name: 'Insumo de otro usuario',
        current_price: 9999,
        package_size: 1,
        package_unit: 'kg',
      },
    ]
  })

  describe('1. Seguridad y validación de pertenencia de ingredientes de la biblioteca', () => {
    it('permite guardar receta si todos los ingredient_id pertenecen a la cuenta del usuario', async () => {
      const validRecipe: Recipe = {
        name: 'Torta Cuatro Cuartos',
        category: 'Tartas',
        description: 'Receta clásica de pastelería',
        yield_quantity: 8,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 42.8,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-1',
            name: 'Harina 0000',
            quantity: 250,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 1500,
            ingredient_id: 'ki-flour-1',
            waste_percentage: 0,
          },
        ],
        additional_costs: [],
      }

      const res = await saveRecipeServer(validRecipe)
      expect(res.error).toBeNull()
      expect(res.data).toBeDefined()
      expect(res.data?.name).toBe('Torta Cuatro Cuartos')
      expect(mockDbRecipes.length).toBe(1)
    })

    it('rechaza el guardado si se intenta vincular un ingredient_id que pertenece a otro usuario', async () => {
      const spoofedRecipe: Recipe = {
        name: 'Receta con ingrediente ajeno',
        category: 'Prueba',
        description: 'Intento de spoofing',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-2',
            name: 'Insumo ajeno',
            quantity: 100,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 100,
            ingredient_id: 'ki-stranger-1', // pertenece a OTHER_USER_ID
          },
        ],
        additional_costs: [],
      }

      const res = await saveRecipeServer(spoofedRecipe)
      expect(res.data).toBeNull()
      expect(res.error).toContain('no pertenece a tu biblioteca personal')
      // Verifica que no se haya guardado nada en recipes
      expect(mockDbRecipes.length).toBe(0)
    })

    it('permite guardar ingredientes libres sin ingredient_id sin requerir despensa previa', async () => {
      const freeRecipe: Recipe = {
        name: 'Masa rápida libre',
        category: 'Panadería',
        description: '',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 25,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-3',
            name: 'Esencia casera no catalogada',
            quantity: 10,
            unit: 'ml',
            reference_quantity: 100,
            reference_unit: 'ml',
            reference_price: 500,
            ingredient_id: null,
          },
        ],
        additional_costs: [],
      }

      const res = await saveRecipeServer(freeRecipe)
      expect(res.error).toBeNull()
      expect(res.data?.ingredients[0].ingredient_id).toBeNull()
    })
  })

  describe('2. Pasos de elaboración (recipe_steps)', () => {
    it('persiste y numera secuencialmente los pasos de elaboración', async () => {
      const recipeWithSteps: Recipe = {
        name: 'Pan brioche',
        category: 'Panadería',
        description: '',
        yield_quantity: 2,
        yield_unit: 'unidades',
        target_margin: 35,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [],
        additional_costs: [],
      }

      const stepsInput: RecipeStepInput[] = [
        { step_number: 1, instruction: 'Mezclar harina y levadura', duration_minutes: 10 },
        { step_number: 2, instruction: 'Incorporar manteca pomada lentamente', duration_minutes: 15 },
        { step_number: 3, instruction: 'Hornear a 180°C', duration_minutes: 30, temperature_celsius: 180 },
      ]

      const res = await saveRecipeServer(recipeWithSteps, stepsInput)
      expect(res.error).toBeNull()
      expect(mockDbSteps.length).toBe(3)
      expect(mockDbSteps[0].step_number).toBe(1)
      expect(mockDbSteps[1].step_number).toBe(2)
      expect(mockDbSteps[2].step_number).toBe(3)
      expect(mockDbSteps[2].temperature_celsius).toBe(180)
    })

    it('filtra pasos con instrucciones vacías sin romper el orden correlativo', async () => {
      const recipeWithSteps: Recipe = {
        name: 'Bizcochuelo',
        category: 'Pastelería',
        description: '',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [],
        additional_costs: [],
      }

      const stepsWithBlanks: RecipeStepInput[] = [
        { step_number: 1, instruction: 'Batir huevos con azúcar' },
        { step_number: 2, instruction: '   ' }, // vacío
        { step_number: 3, instruction: 'Tamizar harina y agregar con movimientos envolventes' },
      ]

      const res = await saveRecipeServer(recipeWithSteps, stepsWithBlanks)
      expect(res.error).toBeNull()
      expect(mockDbSteps.length).toBe(2)
      expect(mockDbSteps[0].step_number).toBe(1)
      expect(mockDbSteps[0].instruction).toBe('Batir huevos con azúcar')
      expect(mockDbSteps[1].step_number).toBe(2)
      expect(mockDbSteps[1].instruction).toContain('Tamizar harina')
    })

    it('rechaza duración negativa en pasos de elaboración', async () => {
      const recipeWithSteps: Recipe = {
        name: 'Receta con duración errónea',
        category: 'Test',
        description: '',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [],
        additional_costs: [],
      }

      const invalidSteps: RecipeStepInput[] = [
        { step_number: 1, instruction: 'Paso con tiempo inválido', duration_minutes: -15 },
      ]

      const res = await saveRecipeServer(recipeWithSteps, invalidSteps)
      expect(res.data).toBeNull()
      expect(res.error).toContain('no puede ser negativa')
    })
  })

  describe('3. Duplicación atómica de recetas', () => {
    it('duplica una receta preservando ingredientes, parámetros técnicos y pasos sin duplicaciones', async () => {
      // Guardar receta original con 2 pasos
      const original: Recipe = {
        name: 'Pasta Frola',
        category: 'Tartas',
        description: 'Tarta tradicional',
        yield_quantity: 8,
        yield_unit: 'unidades',
        target_margin: 40,
        target_markup: 66.6,
        pricing_mode: 'margin',
        prep_time_minutes: 25,
        cook_time_minutes: 35,
        baking_temperature_celsius: 175,
        ingredients: [
          {
            id: 'ing-pf-1',
            name: 'Harina 0000',
            quantity: 300,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 1500,
            ingredient_id: 'ki-flour-1',
          },
        ],
        additional_costs: [],
      }

      const originalSaved = await saveRecipeServer(original, [
        { step_number: 1, instruction: 'Hacer corona con la harina y colocar manteca' },
        { step_number: 2, instruction: 'Rellenar con dulce de membrillo y enrejar' },
      ])

      const originalId = originalSaved.data!.id!
      expect(mockDbSteps.filter((s) => s.recipe_id === originalId).length).toBe(2)

      // Duplicar
      const duplicated = await duplicateRecipeServer(originalId)
      expect(duplicated.error).toBeNull()
      expect(duplicated.data).toBeDefined()
      expect(duplicated.data?.id).not.toBe(originalId)
      expect(duplicated.data?.name).toBe('Pasta Frola (Copia)')
      expect(duplicated.data?.category).toBe('Tartas')
      expect(duplicated.data?.prep_time_minutes).toBe(25)
      expect(duplicated.data?.cook_time_minutes).toBe(35)
      expect(duplicated.data?.baking_temperature_celsius).toBe(175)

      // Verificar que los pasos de la copia existan y sean exactamente 2
      const clonedSteps = mockDbSteps.filter((s) => s.recipe_id === duplicated.data!.id)
      expect(clonedSteps.length).toBe(2)
      expect(clonedSteps[0].step_number).toBe(1)
      expect(clonedSteps[1].step_number).toBe(2)
    })
  })

  describe('4. Cálculo financiero con mermas de ingredientes crudos', () => {
    it('calcula la cantidad bruta a comprar según la merma del ingrediente sin alterar la cantidad neta', () => {
      // Manzanas para tarta:
      // Se necesitan 800g netos de manzana pelada y descorazonada (unit: 'g').
      // Merma: 20% (waste_percentage: 20).
      // Cantidad bruta necesaria = 800 / (1 - 0.20) = 800 / 0.80 = 1000g = 1 kg.
      // Precio referencia: $2000 por 1 kg.
      // Costo calculado = 1 kg * $2000 = $2000.
      const recipe: FinancialRecipe = {
        name: 'Tarta de manzana rústica',
        yield_quantity: 8,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-apple',
            name: 'Manzanas verdes',
            quantity: 800,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 2000,
            waste_percentage: 20,
          },
        ],
        additional_costs: [],
      }

      const res = calculateRecipeFinancials(recipe)
      expect(res.totalIngredients).toBeCloseTo(2000, 2)
      expect(res.ingredientsWithCost[0].calculated_cost).toBeCloseTo(2000, 2)
      expect(res.ingredientsWithCost[0].waste_percentage).toBe(20)
    })

    it('sin merma (0%), el costo corresponde estrictamente a la cantidad neta', () => {
      const recipe: FinancialRecipe = {
        name: 'Merengue francés',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-sugar',
            name: 'Azúcar común',
            quantity: 500,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 1000,
            waste_percentage: 0,
          },
        ],
        additional_costs: [],
      }

      const res = calculateRecipeFinancials(recipe)
      expect(res.totalIngredients).toBe(500)
    })
  })
})
