import { describe, it, expect } from 'vitest'
import {
  calculateIngredientLiveCost,
  prepareRecipeIngredientLink,
  prepareRecipeIngredientUnlink,
  previewRecipeLiveFinancials,
} from '../recipe-linking'
import { KitchenIngredient } from '../types'
import { Recipe, Ingredient } from '../../costo-receta'

describe('Cocina Pro: Persistencia, Vinculación Relacional y Recosteo Dinámico', () => {
  // Insumo de prueba en la biblioteca personal
  const mockHarinaLibrary: KitchenIngredient = {
    id: 'lib-harina-000',
    user_id: 'user-baker-1',
    name: 'Harina 000 Pureza',
    category: 'Harinas',
    package_unit: 'kg',
    package_quantity: 25, // Bolsa de 25 kg
    current_price: 20000, // $20.000 la bolsa ($800/kg)
    price_updated_at: '2026-10-21T00:00:00Z',
    density_g_ml: 0.55,
    density_source: 'Ficha técnica molino',
    is_flour: true,
    is_water: false,
    estimated_water_percentage: 14,
    water_percentage_source: 'Humedad máxima comercial',
    brand: 'Pureza',
    notes: 'Harina panadera fuerza media',
    created_at: '2026-10-21T00:00:00Z',
    updated_at: '2026-10-21T00:00:00Z',
  }

  const mockMantecaLibrary: KitchenIngredient = {
    id: 'lib-manteca-1',
    user_id: 'user-baker-1',
    name: 'Manteca Primera Calidad',
    category: 'Grasas',
    package_unit: 'kg',
    package_quantity: 5,
    current_price: 35000, // $35.000 el bloque de 5kg ($7000/kg)
    price_updated_at: '2026-10-21T00:00:00Z',
    density_g_ml: 0.91,
    is_flour: false,
    is_water: false,
    estimated_water_percentage: 16,
    created_at: '2026-10-21T00:00:00Z',
    updated_at: '2026-10-21T00:00:00Z',
  }

  describe('1. calculateIngredientLiveCost (Cálculo con precio de biblioteca y merma)', () => {
    it('calcula el costo exacto a partir de dosis en gramos y presentación en kilogramos', () => {
      // 500g de harina a partir de bolsa de 25kg a $20.000 ($800/kg) -> Costo = 0.5 * 800 = $400
      const result = calculateIngredientLiveCost(
        { quantity: 500, unit: 'g', waste_percentage: 0 },
        mockHarinaLibrary
      )

      expect(result.success).toBe(true)
      expect(result.liveCost).toBe(400)
      expect(result.grossQuantity).toBe(500)
    })

    it('aplica merma de materia prima cruda (waste_percentage) sobre la dosis requerida', () => {
      // Si se necesitan 900g netos de manzana y tiene 10% de merma (cáscara y corazón):
      // Cantidad bruta requerida = 900 / (1 - 0.10) = 1000g = 1kg
      const mockManzanaLibrary: KitchenIngredient = {
        id: 'lib-manzana-1',
        user_id: 'user-baker-1',
        name: 'Manzana Verde',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 1500,
        price_updated_at: '2026-10-21T00:00:00Z',
        is_flour: false,
        is_water: false,
        created_at: '2026-10-21T00:00:00Z',
        updated_at: '2026-10-21T00:00:00Z',
      }

      const result = calculateIngredientLiveCost(
        { quantity: 900, unit: 'g', waste_percentage: 10 },
        mockManzanaLibrary
      )

      expect(result.success).toBe(true)
      expect(result.grossQuantity).toBe(1000)
      expect(result.liveCost).toBe(1500)
    })

    it('utiliza la densidad del insumo de la biblioteca si hay conversión volumen a masa', () => {
      // 1000 ml de manteca (densidad 0.91 g/ml -> masa = 910g = 0.91 kg)
      // Bloque de 5kg a $35.000 ($7.000/kg) -> Costo = 0.91 * 7000 = $6.370
      const result = calculateIngredientLiveCost(
        { quantity: 1000, unit: 'ml', waste_percentage: 0 },
        mockMantecaLibrary
      )

      expect(result.success).toBe(true)
      expect(result.liveCost).toBe(6370)
    })

    it('rechaza conversión incompatible si no hay densidad disponible', () => {
      const mockInsumoSinDensidad: KitchenIngredient = {
        id: 'lib-sin-densidad',
        user_id: 'user-baker-1',
        name: 'Semillas Varias',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 3000,
        price_updated_at: '2026-10-21T00:00:00Z',
        is_flour: false,
        is_water: false,
        created_at: '2026-10-21T00:00:00Z',
        updated_at: '2026-10-21T00:00:00Z',
      }

      const result = calculateIngredientLiveCost(
        { quantity: 500, unit: 'ml', waste_percentage: 0 },
        mockInsumoSinDensidad
      )

      expect(result.success).toBe(false)
      expect(result.liveCost).toBe(0)
      expect(result.error).toContain('densidad')
    })
  })

  describe('2. prepareRecipeIngredientLink y prepareRecipeIngredientUnlink', () => {
    const originalIngredient: Ingredient = {
      id: 'ing-1',
      name: 'Harina 000',
      quantity: 1000,
      unit: 'g',
      reference_quantity: 1,
      reference_unit: 'kg',
      reference_price: 600, // Precio histórico viejo: $600/kg
      calculated_cost: 600,
    }

    it('conserva el precio histórico de referencia cuando se vincula con syncPrice: false (por defecto)', () => {
      const linked = prepareRecipeIngredientLink(originalIngredient, mockHarinaLibrary, { syncPrice: false })

      expect(linked.ingredient_id).toBe('lib-harina-000')
      expect(linked.reference_price).toBe(600) // No alteró el precio guardado
      expect(linked.calculated_cost).toBe(600) // No alteró el costo guardado
      expect(linked.density).toBe(0.55) // Adquirió la densidad de la biblioteca
    })

    it('actualiza el precio de referencia y recalcula el costo cuando syncPrice: true', () => {
      const linked = prepareRecipeIngredientLink(originalIngredient, mockHarinaLibrary, { syncPrice: true })

      expect(linked.ingredient_id).toBe('lib-harina-000')
      expect(linked.reference_price).toBe(20000) // Actualizó a $20.000
      expect(linked.reference_quantity).toBe(25) // Actualizó a presentación de 25 kg
      expect(linked.reference_unit).toBe('kg')
      expect(linked.calculated_cost).toBe(800) // 1kg a $800/kg = $800
    })

    it('desvincula el ingrediente conservando todos los datos de costeo intactos', () => {
      const linked: Ingredient = {
        ...originalIngredient,
        ingredient_id: 'lib-harina-000',
      }

      const unlinked = prepareRecipeIngredientUnlink(linked)

      expect(unlinked.ingredient_id).toBeNull()
      expect(unlinked.name).toBe('Harina 000')
      expect(unlinked.quantity).toBe(1000)
      expect(unlinked.reference_price).toBe(600)
      expect(unlinked.calculated_cost).toBe(600)
    })
  })

  describe('3. previewRecipeLiveFinancials (Comparativa guardado vs. en vivo)', () => {
    it('detecta divergencias de precio entre el costo guardado y el vigente de la biblioteca', () => {
      const mockRecipe: Recipe = {
        id: 'rec-pan-1',
        name: 'Pan Casero',
        category: 'Panadería',
        description: 'Receta de prueba',
        yield_quantity: 2,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ing-1',
            name: 'Harina 000',
            quantity: 1000,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'kg',
            reference_price: 600, // Guardado a $600
            calculated_cost: 600,
            ingredient_id: 'lib-harina-000', // En biblioteca está a $800/kg ($20.000 / 25kg)
          },
          {
            id: 'ing-2',
            name: 'Levadura fresca',
            quantity: 20,
            unit: 'g',
            reference_quantity: 50,
            reference_unit: 'g',
            reference_price: 500,
            calculated_cost: 200,
            ingredient_id: null, // No vinculado a biblioteca
          },
        ],
        additional_costs: [
          { id: 'add-1', name: 'Gas / Electricidad', amount: 300 },
        ],
      }

      const preview = previewRecipeLiveFinancials(mockRecipe, [mockHarinaLibrary])

      // Costo guardado: 600 + 200 + 300 = $1.100
      expect(preview.savedCostTotal).toBe(1100)

      // Costo en vivo:
      // Harina: 1kg * $800 = $800 (subió $200)
      // Levadura (no vinculada): conserva $200
      // Gas: $300
      // Total en vivo: 800 + 200 + 300 = $1.300
      expect(preview.liveCostTotal).toBe(1300)
      expect(preview.differenceAmount).toBe(200)
      expect(preview.percentageChange).toBe(18.18) // (200 / 1100) * 100
      expect(preview.hasPriceDivergences).toBe(true)
      expect(preview.linkedIngredientsCount).toBe(1)
      expect(preview.unlinkedIngredientsCount).toBe(1)

      const harinaItem = preview.items.find((i) => i.name === 'Harina 000')
      expect(harinaItem?.isLinked).toBe(true)
      expect(harinaItem?.savedCost).toBe(600)
      expect(harinaItem?.liveCost).toBe(800)
      expect(harinaItem?.difference).toBe(200)
    })
  })
})
