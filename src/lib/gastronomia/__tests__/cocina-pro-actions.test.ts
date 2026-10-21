import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as proModule from '@/lib/pro'
import * as supabaseServerModule from '@/utils/supabase/server'
import {
  getKitchenIngredientsServer,
  createKitchenIngredientServer,
  updateKitchenIngredientServer,
  deleteKitchenIngredientServer,
  getIngredientPriceHistoryServer,
} from '@/app/actions/kitchen-ingredients'
import {
  getRecipeStepsServer,
  saveRecipeStepsServer,
  deleteRecipeStepServer,
} from '@/app/actions/recipe-steps'
import {
  linkRecipeIngredientServer,
  unlinkRecipeIngredientServer,
  syncRecipeIngredientWithLibraryPriceServer,
  previewRecipeWithLibraryPricesServer,
} from '@/app/actions/recipe-ingredient-links'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'

// Mocks
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pro', () => ({
  isProUser: vi.fn(),
}))

describe('Cocina Pro: Auditoría de Server Actions, Autorización Pro y Aislamiento RLS', () => {
  const mockUserPro = { id: 'user-chef-pro-1', email: 'pro@cocinapro.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Control de Autenticación y Pro Gate en Biblioteca de Ingredientes', () => {
    it('rechaza llamada anónima en getKitchenIngredientsServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const result = await getKitchenIngredientsServer()
      expect(result.data).toEqual([])
      expect(result.error).toContain('Debes iniciar sesión')
    })

    it('rechaza usuario autenticado sin plan Pro activo en createKitchenIngredientServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false) // No es Pro

      const result = await createKitchenIngredientServer({
        name: 'Harina 000',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 800,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })

    it('valida datos obligatorios y rechaza valores inválidos en createKitchenIngredientServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      // Nombre vacío
      const res1 = await createKitchenIngredientServer({
        name: '   ',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 800,
      })
      expect(res1.error).toContain('nombre del ingrediente es obligatorio')

      // Cantidad de paquete <= 0
      const res2 = await createKitchenIngredientServer({
        name: 'Manteca',
        package_unit: 'kg',
        package_quantity: 0,
        current_price: 1500,
      })
      expect(res2.error).toContain('mayor a 0')

      // Precio negativo
      const res3 = await createKitchenIngredientServer({
        name: 'Azúcar',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: -50,
      })
      expect(res3.error).toContain('precio vigente no puede ser negativo')

      // Densidad negativa o cero
      const res4 = await createKitchenIngredientServer({
        name: 'Aceite',
        package_unit: 'l',
        package_quantity: 1,
        current_price: 2000,
        density_g_ml: -0.92,
      })
      expect(res4.error).toContain('densidad')

      // Porcentaje de agua > 100%
      const res5 = await createKitchenIngredientServer({
        name: 'Crema',
        package_unit: 'l',
        package_quantity: 1,
        current_price: 3000,
        estimated_water_percentage: 150,
      })
      expect(res5.error).toContain('entre 0% y 100%')
    })

    it('valida datos en updateKitchenIngredientServer y rechaza cambios negativos', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await updateKitchenIngredientServer('ing-1', {
        current_price: -100,
      })
      expect(res.error).toContain('precio no puede ser negativo')
    })

    it('elimina un ingrediente de forma segura mediante deleteKitchenIngredientServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn(() => ({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        })),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await deleteKitchenIngredientServer('ing-1')
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('obtiene el historial de precios con getIngredientPriceHistoryServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { previous_price: 800, new_price: 1000, recorded_at: '2026-10-21T00:00:00Z' },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        })),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await getIngredientPriceHistoryServer('ing-1')
      expect(result.data.length).toBe(1)
      expect(result.data[0].new_price).toBe(1000)
    })
  })

  describe('2. Aislamiento Cross-Tenant y Seguridad en Vinculación de Ingredientes', () => {
    it('impide vincular un ingrediente si la receta pertenece a otro usuario', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn(() => ({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            }
          }
          return {}
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await linkRecipeIngredientServer('receta-ajena', 'ing-1', 'lib-ing-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('no encontrada o no autorizada')
    })

    it('impide vincular si el ingrediente de la biblioteca pertenece a otra cuenta', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'rec-propia', user_id: mockUserPro.id },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'kitchen_ingredients') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // No pertenece al usuario autenticado
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
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await linkRecipeIngredientServer('rec-propia', 'ing-1', 'lib-ing-ajeno')
      expect(result.success).toBe(false)
      expect(result.error).toContain('otra cuenta')
    })

    it('desvincula de forma segura un ingrediente con unlinkRecipeIngredientServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'rec-propia', user_id: mockUserPro.id },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'recipe_ingredients') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await unlinkRecipeIngredientServer('rec-propia', 'ing-1')
      expect(result.success).toBe(true)
    })

    it('sincroniza el precio de la biblioteca con syncRecipeIngredientWithLibraryPriceServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipe_ingredients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'ing-1',
                        recipe_id: 'rec-propia',
                        name: 'Harina',
                        quantity: 1000,
                        unit: 'g',
                        ingredient_id: 'lib-harina-1',
                        recipes: { user_id: mockUserPro.id },
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            }
          }
          if (table === 'kitchen_ingredients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'lib-harina-1',
                        user_id: mockUserPro.id,
                        package_quantity: 1,
                        package_unit: 'kg',
                        current_price: 900,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await syncRecipeIngredientWithLibraryPriceServer('rec-propia', 'ing-1')
      expect(result.success).toBe(true)
      expect(result.newCalculatedCost).toBe(900)
    })

    it('previsualiza la receta con precios de biblioteca mediante previewRecipeWithLibraryPricesServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'rec-propia',
                        name: 'Pan',
                        yield_quantity: 1,
                        yield_unit: 'unidades',
                        target_margin: 0,
                        target_markup: 0,
                        ingredients: [],
                        additional_costs: [],
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'kitchen_ingredients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }
          }
          return {}
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await previewRecipeWithLibraryPricesServer('rec-propia')
      expect(result.data).toBeDefined()
      expect(result.data?.recipeName).toBe('Pan')
    })
  })

  describe('3. Pasos de Elaboración (Recipe Steps)', () => {
    it('rechaza acceder a pasos de recetas de otro usuario', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await getRecipeStepsServer('receta-ajena')
      expect(result.data).toEqual([])
      expect(result.error).toContain('no tienes permisos')
    })

    it('valida que los pasos tengan instrucción obligatoria y duración no negativa', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'rec-propia', user_id: mockUserPro.id },
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
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      // Paso con instrucción vacía
      const res1 = await saveRecipeStepsServer('rec-propia', [
        { step_number: 1, instruction: '' },
      ])
      expect(res1.error).toContain('instrucción de elaboración')

      // Paso con duración negativa
      const res2 = await saveRecipeStepsServer('rec-propia', [
        { step_number: 1, instruction: 'Amasar', duration_minutes: -10 },
      ])
      expect(res2.error).toContain('duración del paso #1 no puede ser negativa')
    })

    it('elimina un paso con deleteRecipeStepServer', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUserPro } }),
        },
        from: vi.fn((table: string) => {
          if (table === 'recipes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'rec-propia', user_id: mockUserPro.id },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'recipe_steps') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
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

      const result = await deleteRecipeStepServer('rec-propia', 'step-1')
      expect(result.success).toBe(true)
    })
  })
})
