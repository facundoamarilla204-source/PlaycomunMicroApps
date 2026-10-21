import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  scaleRecipeByYield,
  scaleRecipeByFactor,
  scaleRecipeByTargetWeight,
  formatCulinaryQuantity,
} from '@/lib/gastronomia/scaling'
import {
  calculateMoldScaleFactor,
  Mold,
} from '@/lib/gastronomia/mold-scaling'
import {
  calculateBakersPercentages,
  calculateWeightsFromFlour,
  calculateWeightsFromTotalDough,
  calculateHydration,
  deconstructPreferment,
  BakerIngredientInput,
  BakerPercentageSpec,
} from '@/lib/gastronomia/bakers-percentage'
import { saveRecipeServer } from '../recipes'
import { Recipe } from '@/lib/costo-receta'

// Mocks para pruebas de persistencia
const mockGetUser = vi.fn()
const mockIsProUser = vi.fn()
const mockRpc = vi.fn()

let mockDbRecipes: any[] = []
let mockDbIngredients: any[] = []
let mockDbSteps: any[] = []

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
        }
      }
      if (table === 'recipe_ingredients') {
        return {
          insert: vi.fn((data: any) => {
            const rows = Array.isArray(data) ? data : [data]
            mockDbIngredients.push(...rows)
            return Promise.resolve({ error: null })
          }),
        }
      }
      if (table === 'recipe_steps') {
        return {
          insert: vi.fn((data: any) => {
            const rows = Array.isArray(data) ? data : [data]
            mockDbSteps.push(...rows)
            return Promise.resolve({ error: null })
          }),
        }
      }
      return {
        insert: vi.fn(async () => ({ error: null })),
      }
    }),
  })),
}))

describe('Cocina Pro - Fase 6: Escalado, Moldes y Panadería', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbRecipes = []
    mockDbIngredients = []
    mockDbSteps = []
  })

  describe('1. Escalado inteligente de recetas', () => {
    const baseRecipe: Recipe = {
      id: 'rec-base',
      name: 'Torta de Vainilla Clásica',
      category: 'Pastelería',
      description: '',
      target_margin: 60,
      target_markup: 150,
      pricing_mode: 'margin',
      yield_quantity: 8,
      yield_unit: 'porciones' as any,
      ingredients: [
        { id: 'b1', name: 'Harina 0000', quantity: 400, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 1200 },
        { id: 'b2', name: 'Azúcar común', quantity: 200, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 1000 },
        { id: 'b3', name: 'Huevos', quantity: 4, unit: 'unidades', reference_quantity: 12, reference_unit: 'unidades', reference_price: 3600 },
        { id: 'b4', name: 'Manteca', quantity: 150, unit: 'g', reference_quantity: 200, reference_unit: 'g', reference_price: 2400 },
      ],
      additional_costs: [],
    }

    it('escala proporcionalmente por rendimiento sin modificar la receta original', () => {
      const originalQuantity = baseRecipe.ingredients[0].quantity
      const scaled = scaleRecipeByYield(baseRecipe as any, 16, baseRecipe.yield_unit, { calculatePracticalQuantities: true })

      expect(scaled.targetYield).toBe(16)
      expect(scaled.scaleFactor).toBe(2)

      // Harina: 400 * 2 = 800 g
      expect(scaled.scaledRecipe.ingredients[0].mathematical_quantity).toBe(800)
      // Azúcar: 200 * 2 = 400 g
      expect(scaled.scaledRecipe.ingredients[1].mathematical_quantity).toBe(400)
      // Huevos: 4 * 2 = 8 unidades
      expect(scaled.scaledRecipe.ingredients[2].mathematical_quantity).toBe(8)

      // La receta original permanece intacta
      expect(baseRecipe.ingredients[0].quantity).toBe(originalQuantity)
      expect(baseRecipe.yield_quantity).toBe(8)
    })

    it('escala por factor arbitrario (ej. 1.5x) con sugerencias de redondeo práctico', () => {
      const scaled = scaleRecipeByFactor(baseRecipe as any, 1.5, { calculatePracticalQuantities: true })
      expect(scaled.scaleFactor).toBe(1.5)
      expect(scaled.targetYield).toBe(12)

      // Huevos: 4 * 1.5 = 6 unidades exactas
      const eggs = scaled.scaledRecipe.ingredients.find((i) => i.name === 'Huevos')
      expect(eggs?.mathematical_quantity).toBe(6)

      // Harina: 400 * 1.5 = 600 g
      const flour = scaled.scaledRecipe.ingredients.find((i) => i.name === 'Harina 0000')
      expect(flour?.mathematical_quantity).toBe(600)
    })

    it('escala por peso objetivo de masa cuando todos los ingredientes son convertibles a masa', () => {
      const doughRecipe: Recipe = {
        name: 'Masa de Pan',
        category: 'Panadería',
        description: '',
        target_margin: 50,
        target_markup: 100,
        pricing_mode: 'margin',
        yield_quantity: 1,
        yield_unit: 'unidades',
        ingredients: [
          { id: 'd1', name: 'Harina', quantity: 500, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 1000 },
          { id: 'd2', name: 'Agua', quantity: 300, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 200 },
          { id: 'd3', name: 'Sal', quantity: 10, unit: 'g', reference_quantity: 500, reference_unit: 'g', reference_price: 500 },
        ],
        additional_costs: [],
      }

      // Peso base total: 500g + 300g + 10g = 810g. Escalar a 1620g (factor 2.0x)
      const scaled = scaleRecipeByTargetWeight(doughRecipe as any, 1620, 'g')
      expect(scaled.scaleFactor).toBeCloseTo(2.0, 2)
      expect(scaled.scaledRecipe.ingredients[0].mathematical_quantity).toBeCloseTo(1000, 1)
      expect(scaled.scaledRecipe.ingredients[1].mathematical_quantity).toBeCloseTo(600, 1)
    })

    it('falla con un error descriptivo si se intenta escalar por peso una receta con unidades incompatibles sin peso conocido', () => {
      const incompatibleRecipe: Recipe = {
        name: 'Receta con unidades abstractas',
        category: 'General',
        description: '',
        target_margin: 50,
        target_markup: 100,
        pricing_mode: 'margin',
        yield_quantity: 1,
        yield_unit: 'unidades',
        ingredients: [
          { id: 'inc1', name: 'Ingrediente Misterioso', quantity: 3, unit: 'cucharadas' as any, reference_quantity: 1, reference_unit: 'kg', reference_price: 1000 },
        ],
        additional_costs: [],
      }

      expect(() => {
        scaleRecipeByTargetWeight(incompatibleRecipe as any, 500, 'g')
      }).toThrow(/no es posible escalar por peso objetivo/i)
    })
  })

  describe('2. Adaptador de moldes para pastelería y repostería', () => {
    it('calcula factor de escala entre molde redondo y molde redondo por superficie', () => {
      const source: Mold = { shape: 'round', diameter: 20 } // Radio 10 -> Área = π * 100 ≈ 314.16
      const target: Mold = { shape: 'round', diameter: 28 } // Radio 14 -> Área = π * 196 ≈ 615.75
      const res = calculateMoldScaleFactor(source, target, { considerHeight: false })

      // Proporción de áreas: 196 / 100 = 1.96
      expect(res.scaleFactor).toBeCloseTo(1.96, 2)
      expect(res.calculationBasis).toBe('area')
      expect(res.bakingNote).toMatch(/(?:cocción|térmica|horneado)/i)
    })

    it('calcula factor de escala volumétrico cuando se especifican alturas diferentes', () => {
      const source: Mold = { shape: 'square', side: 20, height: 5 } // Volumen = 400 * 5 = 2000 cm³
      const target: Mold = { shape: 'square', side: 20, height: 7.5 } // Volumen = 400 * 7.5 = 3000 cm³
      const res = calculateMoldScaleFactor(source, target, { considerHeight: true })

      expect(res.scaleFactor).toBeCloseTo(1.5, 2)
      expect(res.calculationBasis).toBe('volume')
    })

    it('adapta de molde redondo a molde rectangular correctamente', () => {
      const sourceRound: Mold = { shape: 'round', diameter: 20 } // Área = π * 100 ≈ 314.16 cm²
      const targetRect: Mold = { shape: 'rectangular', length: 30, width: 20 } // Área = 600 cm²
      const res = calculateMoldScaleFactor(sourceRound, targetRect)

      // 600 / 314.159 ≈ 1.91
      expect(res.scaleFactor).toBeCloseTo(1.91, 2)
    })

    it('rechaza dimensiones negativas o nulas con mensajes claros', () => {
      const invalidMold: Mold = { shape: 'round', diameter: -10 }
      const validMold: Mold = { shape: 'round', diameter: 20 }

      expect(() => calculateMoldScaleFactor(invalidMold, validMold)).toThrow(/mayor a 0/i)
    })
  })

  describe('3. Calculadora profesional de porcentaje panadero', () => {
    it('calcula porcentaje panadero de fórmula clásica con una sola harina (base 100%)', () => {
      const ingredients: BakerIngredientInput[] = [
        { name: 'Harina 000', weightGrams: 1000, isFlour: true },
        { name: 'Agua', weightGrams: 650, isWater: true },
        { name: 'Sal', weightGrams: 20 },
        { name: 'Levadura fresca', weightGrams: 10 },
      ]

      const res = calculateBakersPercentages(ingredients)
      expect(res.totalFlourWeightGrams).toBe(1000)
      expect(res.totalDoughWeightGrams).toBe(1680)
      expect(res.traditionalHydrationPercentage).toBe(65)
      expect(res.estimatedTotalWaterPercentage).toBe(65)

      const flour = res.ingredients.find((i) => i.name === 'Harina 000')
      expect(flour?.bakersPercentage).toBe(100)

      const salt = res.ingredients.find((i) => i.name === 'Sal')
      expect(salt?.bakersPercentage).toBe(2)
    })

    it('soporta mezclas de harinas donde cada una muestra su cuota y la suma representa el 100%', () => {
      const ingredients: BakerIngredientInput[] = [
        { name: 'Harina de trigo 000', weightGrams: 700, isFlour: true },
        { name: 'Harina integral de centeno', weightGrams: 300, isFlour: true },
        { name: 'Agua', weightGrams: 720, isWater: true },
        { name: 'Sal', weightGrams: 22 },
      ]

      const res = calculateBakersPercentages(ingredients)
      expect(res.totalFlourWeightGrams).toBe(1000)

      const flour1 = res.ingredients.find((i) => i.name.includes('000'))
      const flour2 = res.ingredients.find((i) => i.name.includes('centeno'))

      expect(flour1?.bakersPercentage).toBe(70)
      expect(flour1?.shareOfTotalFlour).toBe(70)
      expect(flour2?.bakersPercentage).toBe(30)
      expect(flour2?.shareOfTotalFlour).toBe(30)
      expect(res.traditionalHydrationPercentage).toBe(72)
    })

    it('formula cantidades a partir de un peso objetivo de harina base', () => {
      const specs: BakerPercentageSpec[] = [
        { name: 'Harina de fuerza', bakersPercentage: 100, isFlour: true },
        { name: 'Agua', bakersPercentage: 68, isFlour: false },
        { name: 'Sal', bakersPercentage: 2, isFlour: false },
        { name: 'Levadura instantánea', bakersPercentage: 0.5, isFlour: false },
      ]

      // Queremos usar 2500 g de harina
      const res = calculateWeightsFromFlour(2500, specs)
      expect(res.totalFlourWeightGrams).toBe(2500)

      const water = res.ingredients.find((i) => i.name === 'Agua')
      expect(water?.weightGrams).toBe(1700) // 2500 * 0.68

      const salt = res.ingredients.find((i) => i.name === 'Sal')
      expect(salt?.weightGrams).toBe(50) // 2500 * 0.02
    })

    it('formula cantidades a partir del peso total deseado de masa', () => {
      const specs: BakerPercentageSpec[] = [
        { name: 'Harina', bakersPercentage: 100, isFlour: true },
        { name: 'Agua', bakersPercentage: 60, isFlour: false },
        { name: 'Sal', bakersPercentage: 2, isFlour: false },
      ]
      // Suma total fórmula = 162%. Peso total deseado = 1620 g. Harina necesaria = 1000 g
      const res = calculateWeightsFromTotalDough(1620, specs)
      expect(res.totalFlourWeightGrams).toBeCloseTo(1000, 1)
      expect(res.totalDoughWeightGrams).toBeCloseTo(1620, 1)

      const water = res.ingredients.find((i) => i.name === 'Agua')
      expect(water?.weightGrams).toBeCloseTo(600, 1)
    })

    it('distingue hidratación tradicional del aporte estimado de agua con lácteos y huevos', () => {
      const ingredients: BakerIngredientInput[] = [
        { name: 'Harina', weightGrams: 1000, isFlour: true },
        { name: 'Agua', weightGrams: 300, isWater: true },
        { name: 'Leche entera', weightGrams: 200, isLiquid: true }, // ~88-90% agua -> ~176-180g
        { name: 'Huevos', weightGrams: 100, isLiquid: true }, // ~75% agua -> ~75g
      ]

      const res = calculateBakersPercentages(ingredients)
      // Hidratación tradicional solo cuenta el agua pura: 300 / 1000 = 30%
      expect(res.traditionalHydrationPercentage).toBe(30)
      // El aporte total incluye agua de leche y huevos: 300 + ~176 + ~75 ≈ 551g -> ~55.1%
      expect(res.estimatedTotalWaterPercentage).toBeGreaterThan(50)
      expect(res.estimatedTotalWaterPercentage).toBeLessThan(60)
    })

    it('descompone prefermento (masa madre 1:1) y evita doble cómputo si ya estaba incluido', () => {
      const decomp1 = deconstructPreferment({
        name: 'Masa madre 1:1',
        totalWeightGrams: 200,
        hydrationPercentage: 100,
        alreadyIncludedInBaseIngredients: false,
      })
      expect(decomp1.flourGrams).toBe(100)
      expect(decomp1.waterGrams).toBe(100)
      expect(decomp1.alreadyIncludedInBaseIngredients).toBe(false)

      const decomp2 = deconstructPreferment({
        name: 'Biga al 50%',
        totalWeightGrams: 150,
        hydrationPercentage: 50,
      })
      // Factor: 1 + 0.5 = 1.5. Harina = 150 / 1.5 = 100g, Agua = 50g
      expect(decomp2.flourGrams).toBe(100)
      expect(decomp2.waterGrams).toBe(50)
    })
  })

  describe('4. Integridad transaccional y pre-validación de persistencia', () => {
    it('rechaza guardar una receta si algún paso tiene duración inválida antes de tocar la base de datos', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'usr-123' } }, error: null })
      mockIsProUser.mockResolvedValue(true)

      const recipe: Recipe = {
        name: 'Receta con paso corrupto',
        category: 'General',
        description: '',
        target_margin: 50,
        target_markup: 100,
        pricing_mode: 'margin',
        yield_quantity: 1,
        yield_unit: 'unidades',
        ingredients: [{ id: 'ing-1', name: 'Harina', quantity: 100, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 1000 }],
        additional_costs: [],
      }

      const invalidSteps = [
        {
          step_number: 1,
          instruction: 'Paso con duración negativa',
          duration_minutes: -15, // INVÁLIDO
        },
      ]

      const res = await saveRecipeServer(recipe, invalidSteps as any)
      expect(res.error).toMatch(/duración.*no puede ser negativa/i)
      // No se insertó nada en la BD
      expect(mockDbRecipes.length).toBe(0)
      expect(mockDbSteps.length).toBe(0)
    })
  })
})
