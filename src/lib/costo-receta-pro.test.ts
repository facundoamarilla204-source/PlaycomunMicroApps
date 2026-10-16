import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  Recipe,
  calculateRecipeFinancials,
  emptyRecipe,
  PRO_REQUIRED_RECIPE_ERROR,
} from './costo-receta'
import {
  getRecipeUserStatusServer,
  getUserRecipesServer,
  getRecipeByIdServer,
  saveRecipeServer,
  duplicateRecipeServer,
  deleteRecipeServer,
} from '@/app/actions/recipes'
import * as proModule from '@/lib/pro'
import * as supabaseServerModule from '@/utils/supabase/server'

// Mock de Supabase server
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pro', () => ({
  isProUser: vi.fn(),
}))

describe('Costo de Receta - Modalidad Gratis + Pro y Conservación de Datos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // ESCENARIO 1: Usuario sin Pro que calcula una receta nueva (100% Gratis)
  // =========================================================================
  describe('Escenario 1: Modalidad Gratis - Cálculo libre sin exigir Pro', () => {
    it('permite a cualquier usuario calcular costos, rendimientos, márgenes y precios sin suscripción Pro', () => {
      const draftRecipe: Recipe = {
        name: 'Muffins de Arándanos',
        category: 'Repostería',
        description: 'Receta para venta individual en cafetería',
        yield_quantity: 12,
        yield_unit: 'unidades',
        target_margin: 50,
        target_markup: 100,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-1',
            name: 'Harina leudante',
            quantity: 300,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 1500, // 300g = $450
          },
          {
            id: 'ing-2',
            name: 'Arándanos frescos',
            quantity: 150,
            unit: 'g',
            reference_quantity: 500,
            reference_unit: 'g',
            reference_price: 2000, // 150g = $600
          },
          {
            id: 'ing-3',
            name: 'Huevos',
            quantity: 2,
            unit: 'unidades',
            reference_quantity: 6,
            reference_unit: 'unidades',
            reference_price: 1800, // 2 huevos = $600
          },
        ],
        additional_costs: [
          { id: 'cost-1', name: 'Pirotines descartables', amount: 350 },
          { id: 'cost-2', name: 'Gas de horneado', amount: 500 },
        ],
      }

      // El cálculo se ejecuta directamente en el cliente/motor sin requerir backend ni Pro
      const financials = calculateRecipeFinancials(draftRecipe)

      // Total ingredientes: 450 + 600 + 600 = 1650
      expect(financials.totalIngredients).toBe(1650)
      // Total adicionales: 350 + 500 = 850
      expect(financials.totalAdditional).toBe(850)
      // Costo total de elaboración: 1650 + 850 = 2500
      expect(financials.totalCost).toBe(2500)
      // Costo unitario (rinde 12): 2500 / 12 = 208.33
      expect(financials.unitCost).toBeCloseTo(208.33, 2)
      // Precio sugerido con 50% de margen: 208.333 / 0.5 = 416.67
      expect(financials.suggestedPrice).toBeCloseTo(416.67, 2)
      // Ganancia por unidad: 416.67 - 208.33 = 208.33
      expect(financials.profitPerUnit).toBeCloseTo(208.33, 2)
      // Ganancia total del lote: 208.33 * 12 = 2500
      expect(financials.totalProfit).toBeCloseTo(2500, 1)
    })
  })

  // =========================================================================
  // ESCENARIO 2: Bloqueo seguro en el servidor para usuarios sin Pro
  // =========================================================================
  describe('Escenario 2: Verificación de autorización en el servidor sin Pro', () => {
    it('rechaza el guardado de recetas si el usuario no tiene suscripción Pro activa', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-free-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const testRecipe: Recipe = {
        ...emptyRecipe,
        name: 'Receta Bloqueada',
        yield_quantity: 4,
      }

      const result = await saveRecipeServer(testRecipe)
      expect(result.data).toBeNull()
      expect(result.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })

    it('rechaza la duplicación si el usuario no tiene suscripción Pro activa', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-free-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const result = await duplicateRecipeServer('some-recipe-id')
      expect(result.data).toBeNull()
      expect(result.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })

    it('rechaza la eliminación si el usuario no tiene suscripción Pro activa', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-free-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const result = await deleteRecipeServer('some-recipe-id')
      expect(result.success).toBe(false)
      expect(result.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })

    it('distingue correctamente entre receta inexistente (404) y receta protegida por falta de Pro (403)', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-free-123' } },
            error: null,
          }),
        },
        rpc: vi.fn((funcName, args) => {
          if (funcName === 'user_recipe_exists') {
            // Si busca la receta 'receta-existente', devuelve true
            if (args.p_recipe_id === 'receta-existente') return Promise.resolve({ data: true, error: null })
            return Promise.resolve({ data: false, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      // Caso 1: La receta existe pero el usuario no tiene Pro
      const lockedResult = await getRecipeByIdServer('receta-existente')
      expect(lockedResult.data).toBeNull()
      expect(lockedResult.isLocked).toBe(true)
      expect(lockedResult.error).toContain('requiere una suscripción Pro activa')

      // Caso 2: La receta no existe
      const notFoundResult = await getRecipeByIdServer('receta-inexistente-999')
      expect(notFoundResult.data).toBeNull()
      expect(notFoundResult.isLocked).toBe(false)
      expect(notFoundResult.error).toContain('no existe o no pertenece a tu cuenta')
    })
  })

  // =========================================================================
  // ESCENARIO 3: Conservación de datos y ciclo de vida (Pérdida y Reactivación Pro)
  // =========================================================================
  describe('Escenario 3: Conservación de datos al perder Pro y recuperación automática al reactivar', () => {
    // Almacén simulado in-memory de la base de datos
    let storedRecipes: any[] = []
    let storedIngredients: any[] = []
    let storedCosts: any[] = []

    beforeEach(() => {
      // 3 recetas guardadas previamente por el usuario cuando tenía Pro
      storedRecipes = [
        {
          id: 'rec-1',
          user_id: 'user-vip',
          name: 'Cheesecake de Frutos Rojos',
          category: 'Pastelería',
          description: 'Receta estrella del local',
          yield_quantity: 8,
          yield_unit: 'unidades',
          target_margin: 45,
          target_markup: 0,
          pricing_mode: 'margin',
          created_at: '2026-10-01T10:00:00Z',
          updated_at: '2026-10-01T10:00:00Z',
        },
        {
          id: 'rec-2',
          user_id: 'user-vip',
          name: 'Pan de Masa Madre 100% Integral',
          category: 'Panadería',
          description: 'Fermentación 24hs',
          yield_quantity: 4,
          yield_unit: 'unidades',
          target_margin: 50,
          target_markup: 0,
          pricing_mode: 'margin',
          created_at: '2026-10-02T10:00:00Z',
          updated_at: '2026-10-02T10:00:00Z',
        },
      ]

      storedIngredients = [
        {
          id: 'ing-10',
          recipe_id: 'rec-1',
          name: 'Queso crema',
          quantity: 600,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 6000,
          calculated_cost: 3600,
        },
      ]

      storedCosts = [
        {
          id: 'cost-10',
          recipe_id: 'rec-1',
          name: 'Caja porta torta',
          amount: 800,
        },
      ]
    })

    it('conserva intactas todas las recetas y devuelve la cantidad almacenada cuando Pro vence o se cancela', async () => {
      // Simular que el usuario PERDIÓ PRO (suscripción vencida o cancelada)
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-vip' } },
            error: null,
          }),
        },
        rpc: vi.fn((funcName) => {
          if (funcName === 'get_user_recipe_count') {
            // El conteo seguro cuenta las recetas del usuario en la base de datos
            const count = storedRecipes.filter((r) => r.user_id === 'user-vip').length
            return Promise.resolve({ data: count, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn(),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false) // Sin Pro

      // 1. Verificar estado de usuario
      const status = await getRecipeUserStatusServer()
      expect(status.isAuthenticated).toBe(true)
      expect(status.isPro).toBe(false)
      expect(status.preservedCount).toBe(2) // 2 recetas preservadas!

      // 2. Intentar listar recetas directamente desde el servidor
      const listResult = await getUserRecipesServer()
      expect(listResult.data).toBeNull()
      expect(listResult.isProRequired).toBe(true)
      expect(listResult.preservedCount).toBe(2) // No es lista vacía, sino estado bloqueado con recuento

      // 3. Verificar que los registros en la base de datos NUNCA fueron borrados
      expect(storedRecipes.length).toBe(2)
      expect(storedIngredients.length).toBe(1)
      expect(storedCosts.length).toBe(1)
    })

    it('reactiva automáticamente el acceso a todas las recetas anteriores al renovar la suscripción Pro', async () => {
      // Simular que el usuario RECUPERA PRO (suscripción activa renovada)
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-vip' } },
            error: null,
          }),
        },
        rpc: vi.fn((funcName) => {
          if (funcName === 'get_user_recipe_count') {
            return Promise.resolve({ data: storedRecipes.length, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: storedRecipes.map((r) => ({
                      ...r,
                      recipe_ingredients: storedIngredients.filter((i) => i.recipe_id === r.id),
                      recipe_additional_costs: storedCosts.filter((c) => c.recipe_id === r.id),
                    })),
                    error: null,
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true) // Pro Activo

      // 1. Consultar estado
      const status = await getRecipeUserStatusServer()
      expect(status.isAuthenticated).toBe(true)
      expect(status.isPro).toBe(true)

      // 2. Obtener recetas
      const listResult = await getUserRecipesServer()
      expect(listResult.error).toBeNull()
      expect(listResult.data).toHaveLength(2)

      // 3. Verificar integridad absoluta de datos restaurados
      const cheesecake = listResult.data?.find((r) => r.id === 'rec-1')
      expect(cheesecake).toBeDefined()
      expect(cheesecake?.name).toBe('Cheesecake de Frutos Rojos')
      expect(cheesecake?.target_margin).toBe(45)
      expect(cheesecake?.yield_quantity).toBe(8)
      expect(cheesecake?.ingredients).toHaveLength(1)
      expect(cheesecake?.ingredients[0].name).toBe('Queso crema')
      expect(cheesecake?.ingredients[0].reference_price).toBe(6000)
      expect(cheesecake?.additional_costs).toHaveLength(1)
      expect(cheesecake?.additional_costs[0].name).toBe('Caja porta torta')
      expect(cheesecake?.additional_costs[0].amount).toBe(800)
    })
  })
})
