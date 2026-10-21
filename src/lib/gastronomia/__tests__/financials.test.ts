import { describe, it, expect } from 'vitest'
import {
  calculateRecipeFinancials,
  formatCurrency,
  FinancialRecipe,
} from '../financials'

describe('Gastronomía: Motor financiero compartido (financials.ts)', () => {
  const baseRecipe: FinancialRecipe = {
    name: 'Torta de chocolate y dulce de leche',
    yield_quantity: 12,
    yield_unit: 'porciones',
    target_margin: 35,
    target_markup: 50,
    pricing_mode: 'margin',
    ingredients: [
      {
        id: '1',
        name: 'Harina leudante',
        quantity: 400,
        unit: 'g',
        reference_quantity: 1,
        reference_unit: 'kg',
        reference_price: 1200, // $1200 por kg -> 400g = $480
      },
      {
        id: '2',
        name: 'Dulce de leche repostero',
        quantity: 600,
        unit: 'g',
        reference_quantity: 1,
        reference_unit: 'kg',
        reference_price: 3500, // $3500 por kg -> 600g = $2100
      },
      {
        id: '3',
        name: 'Huevos',
        quantity: 4,
        unit: 'unidades',
        reference_quantity: 12,
        reference_unit: 'unidades',
        reference_price: 3600, // $300 c/u -> 4 unidades = $1200
      },
    ],
    additional_costs: [
      { id: 'c1', name: 'Bandeja y caja de presentación', amount: 600 },
      { id: 'c2', name: 'Gas y electricidad proporcional', amount: 400 },
    ],
  }

  describe('Cálculo de costos y precio en modo margen', () => {
    it('calcula costos directos, adicionales, costo unitario y margen sobre precio de venta', () => {
      // Costo ingredientes: 480 + 2100 + 1200 = 3780
      // Adicionales: 600 + 400 = 1000
      // Costo Total = 4780
      // Costo Unitario (rinde 12) = 4780 / 12 = 398.333...
      // Margen = 35% -> Precio sugerido = 398.333... / (1 - 0.35) = 398.333... / 0.65 = 612.82
      const res = calculateRecipeFinancials(baseRecipe)

      expect(res.totalIngredients).toBe(3780)
      expect(res.totalAdditional).toBe(1000)
      expect(res.totalCost).toBe(4780)
      expect(res.unitCost).toBeCloseTo(398.33, 2)
      expect(res.suggestedPrice).toBeCloseTo(612.82, 2)
      expect(res.profitPerUnit).toBeCloseTo(214.49, 2)
      expect(res.totalProfit).toBeCloseTo(2573.85, 1)
      expect(res.hasConversionErrors).toBe(false)
      expect(res.invalidIngredientsCount).toBe(0)
    })

    it('calcula porcentajes de incidencia de cada ingrediente sobre el costo total', () => {
      const res = calculateRecipeFinancials(baseRecipe)
      const ddl = res.ingredientsWithCost.find((i) => i.name.includes('Dulce de leche'))
      // 2100 / 4780 * 100 = 43.93%
      expect(ddl?.percentageOfTotal).toBeCloseTo(43.93, 1)
    })
  })

  describe('Cálculo en modo markup (recargo sobre el costo)', () => {
    it('calcula el precio sugerido agregando el markup objetivo', () => {
      const markupRecipe: FinancialRecipe = {
        ...baseRecipe,
        pricing_mode: 'markup',
        target_markup: 60, // 60% recargo
      }
      const res = calculateRecipeFinancials(markupRecipe)
      // Costo unitario = 398.333...
      // Precio sugerido = 398.333... * 1.60 = 637.33
      expect(res.suggestedPrice).toBeCloseTo(637.33, 2)
      expect(res.profitPerUnit).toBeCloseTo(239.0, 2)
      // Margen real sobre el precio de venta = (637.33 - 398.33) / 637.33 = 37.5%
      expect(res.realMarginPct).toBeCloseTo(37.5, 1)
    })
  })

  describe('Corrección del fallo de unidades incompatibles (sin fallback silencioso)', () => {
    it('detecta unidades incompatibles, evita costo distorsionado y reporta flags de error', () => {
      // Caso que antes fallaba silenciosamente:
      // Leche comprada a $1200 por litro (reference_unit: 'l'),
      // pero en la receta se usaban 500 gramos (unit: 'g') sin densidad especificada.
      // Anteriormente: unitConversion('l', 'g', 1) devolvía 1 (asumía 1 litro = 1 gramo!),
      // calculando 500 * $1200 = $600.000 por medio kilo de leche!
      const recipeWithBadUnit: FinancialRecipe = {
        name: 'Receta con unidad errónea',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'err1',
            name: 'Leche (error sin densidad)',
            quantity: 500,
            unit: 'g',
            reference_quantity: 1,
            reference_unit: 'l',
            reference_price: 1200,
          },
        ],
        additional_costs: [],
      }

      const res = calculateRecipeFinancials(recipeWithBadUnit)

      // El costo distorsionado no se calcula
      expect(res.hasConversionErrors).toBe(true)
      expect(res.invalidIngredientsCount).toBe(1)
      expect(res.totalIngredients).toBe(0)
      expect(res.totalCost).toBe(0)

      const badIng = res.ingredientsWithCost[0]
      expect(badIng.calculated_cost).toBe(0)
      expect(badIng.conversionError).toContain('requiere especificar la densidad')
    })

    it('calcula correctamente si se provee la densidad válida para conversión masa-volumen', () => {
      const recipeWithDensity: FinancialRecipe = {
        name: 'Receta con densidad',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          {
            id: 'ok1',
            name: 'Leche con densidad',
            quantity: 515, // 515 gramos de leche
            unit: 'g',
            reference_quantity: 1, // 1 litro comprado
            reference_unit: 'l',
            reference_price: 1000,
            density: 1.03, // 1 litro = 1000 ml = 1030 gramos -> 515g es exactamente medio litro = $500
          },
        ],
        additional_costs: [],
      }

      const res = calculateRecipeFinancials(recipeWithDensity)
      expect(res.hasConversionErrors).toBe(false)
      expect(res.totalIngredients).toBeCloseTo(500, 2)
      expect(res.ingredientsWithCost[0].calculated_cost).toBeCloseTo(500, 2)
      expect(res.ingredientsWithCost[0].conversionError).toBeNull()
    })
  })

  describe('formatCurrency', () => {
    it('formatea números en moneda argentina ARS correctamente', () => {
      expect(formatCurrency(1500)).toContain('1.500')
      expect(formatCurrency(0)).toContain('0')
      expect(formatCurrency(NaN)).toBe('$ 0,00')
      expect(formatCurrency(Infinity)).toBe('$ 0,00')
    })
  })
})
