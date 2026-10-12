import { describe, it, expect } from 'vitest'
import { unitConversion, calculateRecipeFinancials, formatCurrency, Recipe } from './costo-receta'

describe('costo-receta calculations', () => {
  describe('unitConversion', () => {
    it('should convert kg to g correctly', () => {
      expect(unitConversion('kg', 'g', 1)).toBe(1000)
      expect(unitConversion('kg', 'g', 2.5)).toBe(2500)
    })

    it('should convert g to kg correctly', () => {
      expect(unitConversion('g', 'kg', 1000)).toBe(1)
      expect(unitConversion('g', 'kg', 500)).toBe(0.5)
    })

    it('should convert l to ml correctly', () => {
      expect(unitConversion('l', 'ml', 1)).toBe(1000)
    })

    it('should convert ml to l correctly', () => {
      expect(unitConversion('ml', 'l', 250)).toBe(0.25)
    })

    it('should return same value when units match', () => {
      expect(unitConversion('unidades', 'unidades', 10)).toBe(10)
      expect(unitConversion('g', 'g', 350)).toBe(350)
    })
  })

  describe('calculateRecipeFinancials', () => {
    const sampleRecipe: Recipe = {
      name: 'Torta de chocolate',
      category: 'Pastelería',
      description: 'Receta de prueba',
      yield_quantity: 10,
      yield_unit: 'unidades',
      target_margin: 40,
      target_markup: 50,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: '1',
          name: 'Harina 0000',
          quantity: 500, // 500g
          unit: 'g',
          reference_quantity: 1, // 1 kg
          reference_unit: 'kg',
          reference_price: 1000, // $1000 por kg -> 500g sale $500
        },
        {
          id: '2',
          name: 'Huevos',
          quantity: 4,
          unit: 'unidades',
          reference_quantity: 12, // Maple o docena
          reference_unit: 'unidades',
          reference_price: 3600, // $300 c/u -> 4 huevos salen $1200
        },
      ],
      additional_costs: [
        { id: 'c1', name: 'Gas / Electricidad', amount: 300 },
        { id: 'c2', name: 'Packaging', amount: 500 },
      ],
    }

    it('should calculate total ingredient cost and additional costs properly', () => {
      const result = calculateRecipeFinancials(sampleRecipe)
      // Ingredientes: 500 + 1200 = 1700
      expect(result.totalIngredients).toBe(1700)
      // Adicionales: 300 + 500 = 800
      expect(result.totalAdditional).toBe(800)
      // Costo total: 1700 + 800 = 2500
      expect(result.totalCost).toBe(2500)
      // Costo unitario (rinde 10): 2500 / 10 = 250
      expect(result.unitCost).toBe(250)
    })

    it('should calculate suggested price by margin mode correctly', () => {
      const result = calculateRecipeFinancials(sampleRecipe)
      // Unit cost = 250. Margin = 40% (0.4). Price = 250 / (1 - 0.4) = 250 / 0.6 = 416.666...
      expect(result.suggestedPrice).toBeCloseTo(416.67, 1)
      expect(result.profitPerUnit).toBeCloseTo(166.67, 1)
      expect(result.totalProfit).toBeCloseTo(1666.67, 1)
    })

    it('should calculate suggested price by markup mode correctly', () => {
      const markupRecipe = { ...sampleRecipe, pricing_mode: 'markup' as const, target_markup: 50 }
      const result = calculateRecipeFinancials(markupRecipe)
      // Unit cost = 250. Markup = 50%. Price = 250 * 1.5 = 375
      expect(result.suggestedPrice).toBe(375)
      expect(result.profitPerUnit).toBe(125)
      // Real margin over selling price: (375 - 250) / 375 = 125 / 375 = 33.33%
      expect(result.realMarginPct).toBeCloseTo(33.33, 1)
    })

    it('should handle zero yield without dividing by zero', () => {
      const zeroYieldRecipe = { ...sampleRecipe, yield_quantity: 0 }
      const result = calculateRecipeFinancials(zeroYieldRecipe)
      expect(Number.isFinite(result.unitCost)).toBe(true)
      expect(Number.isFinite(result.suggestedPrice)).toBe(true)
    })
  })

  describe('formatCurrency', () => {
    it('should format numbers with Argentine style currency', () => {
      const formatted = formatCurrency(1250)
      expect(formatted).toContain('1.250')
    })
  })
})
