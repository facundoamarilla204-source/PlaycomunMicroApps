import { describe, it, expect } from 'vitest'
import {
  calculateProductionPlan,
  calculateItemScalingFactor,
  normalizeIngredientName,
} from '../production-plan'
import { Recipe } from '../../costo-receta'
import { KitchenIngredient } from '../types'

describe('Motor Matemático de Planificación de Producción y Lista Consolidada', () => {
  it('normaliza nombres de ingredientes para agrupamiento conservador de insumos libres', () => {
    expect(normalizeIngredientName('  Harina 0000  ')).toBe('harina 0000')
    expect(normalizeIngredientName('Azúcar Blanco Común')).toBe('azucar blanco comun')
    expect(normalizeIngredientName('DULCE DE LECHE REPOSTERO')).toBe('dulce de leche repostero')
  })

  it('calcula factor de escala exacto por unidades y por peso compatible', () => {
    // 1. Unidades idénticas
    const scale1 = calculateItemScalingFactor(12, 'unidades', 36, 'unidades')
    expect(scale1.factor).toBe(3)
    expect(scale1.isProvisional).toBe(false)

    // 2. Peso convertible (500 g a 3 kg = 3000 g / 500 g = factor 6)
    const scale2 = calculateItemScalingFactor(500, 'g', 3, 'kg')
    expect(scale2.factor).toBe(6)
    expect(scale2.isProvisional).toBe(false)

    // 3. Multiplicador de recetas (ej. 2 preparaciones)
    const scale3 = calculateItemScalingFactor(1, 'receta', 2, 'preparaciones')
    expect(scale3.factor).toBe(2)
    expect(scale3.isProvisional).toBe(false)

    // 4. Incompatibles sin densidad (unidades a kg)
    const scale4 = calculateItemScalingFactor(12, 'unidades', 2, 'kg')
    expect(scale4.isProvisional).toBe(true)
    expect(scale4.warning).toBeDefined()
  })

  it('maneja un plan vacío sin errores ni costos residuales', () => {
    const summary = calculateProductionPlan([], () => undefined)
    expect(summary.items).toHaveLength(0)
    expect(summary.consolidatedIngredients).toHaveLength(0)
    expect(summary.totalEstimatedCost).toBe(0)
    expect(summary.hasProvisionalCalculations).toBe(false)
  })

  it('escala una receta simple y calcula cantidades brutas considerando mermas', () => {
    // Receta rinde 12 alfajores
    // Necesita:
    // - Maicena: 200 g (sin merma) -> para 24 u: 400 g
    // - Yemas de huevo: 60 g (con 10% merma) -> neto 120 g, bruto 120 / 0.9 = 133.33 g
    const alfajoresRecipe: Recipe = {
      id: 'rec-alfajores',
      name: 'Alfajores de Maicena',
      category: 'Pastelería',
      description: 'Alfajores tradicionales',
      yield_quantity: 12,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-1',
          name: 'Almidón de maíz',
          quantity: 200,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1000,
          calculated_cost: 200,
          waste_percentage: 0,
        },
        {
          id: 'ing-2',
          name: 'Yemas de huevo',
          quantity: 60,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 3000,
          calculated_cost: 180,
          waste_percentage: 10,
        },
      ],
      additional_costs: [{ id: 'c-1', name: 'Pirotines', amount: 50 }],
    }

    const resolver = (id: string) => (id === 'rec-alfajores' ? alfajoresRecipe : undefined)

    const summary = calculateProductionPlan(
      [{ recipeId: 'rec-alfajores', targetQuantity: 24, targetUnit: 'unidades' }],
      resolver
    )

    expect(summary.items).toHaveLength(1)
    expect(summary.items[0].scalingFactor).toBe(2)
    // Costo total = (200 + 180)*2 + 50*2 = 760 + 100 = 860
    expect(summary.totalEstimatedCost).toBe(860)

    // Lista consolidada
    expect(summary.consolidatedIngredients).toHaveLength(2)

    const maicena = summary.consolidatedIngredients.find((i) => i.name === 'Almidón de maíz')
    expect(maicena).toBeDefined()
    expect(maicena!.totalNetQuantity).toBe(400)
    expect(maicena!.totalGrossQuantity).toBe(400)
    expect(maicena!.unit).toBe('g')
    expect(maicena!.origins).toHaveLength(1)
    expect(maicena!.origins[0].grossQuantity).toBe(400)

    const yemas = summary.consolidatedIngredients.find((i) => i.name === 'Yemas de huevo')
    expect(yemas).toBeDefined()
    expect(yemas!.totalNetQuantity).toBe(120)
    // 120 / (1 - 0.10) = 133.33 g
    expect(yemas!.totalGrossQuantity).toBeCloseTo(133.33, 1)
  })

  it('consolida insumos comunes de múltiples recetas independientes sin sumar dos veces ni mezclar unidades incompatibles', () => {
    // Receta 1: Torta de Chocolate (rinde 1 torta)
    // Requiere: 500 g Harina 0000 (ingredient_id: 'lib-harina')
    // Receta 2: Alfajores (rinde 12 u)
    // Requiere: 250 g Harina 0000 (mismo ingredient_id: 'lib-harina')
    const tortaRecipe: Recipe = {
      id: 'rec-torta',
      name: 'Torta de Chocolate',
      category: 'Tortas',
      description: '',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-t1',
          name: 'Harina 0000 Chacabuco',
          quantity: 500,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1200,
          calculated_cost: 600,
          ingredient_id: 'lib-harina',
        },
      ],
      additional_costs: [],
    }

    const alfajoresRecipe: Recipe = {
      id: 'rec-alfa',
      name: 'Alfajores',
      category: 'Pastelería',
      description: '',
      yield_quantity: 12,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-a1',
          name: 'Harina 0000',
          quantity: 250,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1200,
          calculated_cost: 300,
          ingredient_id: 'lib-harina',
        },
      ],
      additional_costs: [],
    }

    const libraryMap = new Map<string, KitchenIngredient>([
      [
        'lib-harina',
        {
          id: 'lib-harina',
          user_id: 'u-1',
          name: 'Harina 0000 Pastelera',
          package_unit: 'kg',
          package_quantity: 1,
          current_price: 1200,
          price_updated_at: new Date().toISOString(),
          is_flour: true,
          is_water: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    ])

    const resolver = (id: string) => {
      if (id === 'rec-torta') return tortaRecipe
      if (id === 'rec-alfa') return alfajoresRecipe
      return undefined
    }

    // Producir: 2 Tortas y 24 Alfajores (factor 2 en ambas)
    // Torta: 500 * 2 = 1000 g
    // Alfajores: 250 * 2 = 500 g
    // Total Harina = 1500 g
    const summary = calculateProductionPlan(
      [
        { recipeId: 'rec-torta', targetQuantity: 2, targetUnit: 'unidades' },
        { recipeId: 'rec-alfa', targetQuantity: 24, targetUnit: 'unidades' },
      ],
      resolver,
      libraryMap
    )

    expect(summary.consolidatedIngredients).toHaveLength(1)
    const harina = summary.consolidatedIngredients[0]
    expect(harina.name).toBe('Harina 0000 Pastelera')
    expect(harina.totalGrossQuantity).toBe(1500)
    expect(harina.unit).toBe('g')
    expect(harina.origins).toHaveLength(2)

    // Costo de consumo: 1.5 kg * $1200 = $1800
    expect(harina.estimatedConsumptionCost).toBe(1800)
    // Paquetes necesarios: 1500 g en paquetes de 1 kg = ceil(1.5) = 2 paquetes
    expect(harina.packagesNeeded).toBe(2)
    // Costo de compra de paquetes enteros: 2 * $1200 = $2400
    expect(harina.estimatedPackagePurchaseCost).toBe(2400)
  })

  it('descompone recetas compuestas recursivamente hasta sus ingredientes base sin sumar dos veces', () => {
    // Subreceta: Bizcochuelo Vainilla (rinde 800 g de bizcochuelo)
    // Requiere:
    // - Harina 0000: 300 g
    // - Azúcar: 200 g
    // - Huevos: 6 unidades
    const bizcochueloRecipe: Recipe = {
      id: 'sub-bizcochuelo',
      name: 'Bizcochuelo de Vainilla',
      category: 'Bases',
      description: 'Bizcochuelo esponjoso',
      yield_quantity: 800,
      yield_unit: 'g',
      target_margin: 0,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'b-ing-1',
          name: 'Harina 0000',
          quantity: 300,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1000,
          calculated_cost: 300,
        },
        {
          id: 'b-ing-2',
          name: 'Azúcar Blanco',
          quantity: 200,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1500,
          calculated_cost: 300,
        },
      ],
      additional_costs: [],
    }

    // Receta Principal: Torta Armada (rinde 1 torta)
    // Requiere:
    // - 800 g de Bizcochuelo de Vainilla (subreceta)
    // - 400 g Dulce de Leche (ingrediente directo)
    const tortaArmadaRecipe: Recipe = {
      id: 'rec-torta-armada',
      name: 'Torta Armada de Cumpleaños',
      category: 'Tortas',
      description: '',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ta-ing-1',
          name: 'Dulce de Leche Repostero',
          quantity: 400,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 3000,
          calculated_cost: 1200,
        },
      ],
      additional_costs: [],
      subrecipes: [
        {
          id: 'rel-1',
          recipe_id: 'rec-torta-armada',
          subrecipe_id: 'sub-bizcochuelo',
          quantity: 800,
          unit: 'g',
          waste_percentage: 0,
          position: 1,
        },
      ],
    }

    const resolver = (id: string) => {
      if (id === 'rec-torta-armada') return tortaArmadaRecipe
      if (id === 'sub-bizcochuelo') return bizcochueloRecipe
      return undefined
    }

    // Producir 3 Tortas Armadas
    // Cada torta requiere 800 g de bizcochuelo -> 2400 g de bizcochuelo total.
    // Como el bizcochuelo rinde 800 g por receta, se escalará por factor 3.
    // Insumos base totales:
    // - Harina 0000: 300 g * 3 = 900 g (proveniente de Bizcochuelo)
    // - Azúcar Blanco: 200 g * 3 = 600 g (proveniente de Bizcochuelo)
    // - Dulce de Leche: 400 g * 3 = 1200 g (directo en Torta)
    const summary = calculateProductionPlan(
      [{ recipeId: 'rec-torta-armada', targetQuantity: 3, targetUnit: 'unidades' }],
      resolver
    )

    expect(summary.items).toHaveLength(1)
    expect(summary.items[0].expandedSubrecipes).toHaveLength(1)
    expect(summary.items[0].expandedSubrecipes[0].subrecipeName).toBe('Bizcochuelo de Vainilla')
    expect(summary.items[0].expandedSubrecipes[0].scalingFactor).toBe(3)

    // Lista consolidada de insumos base
    expect(summary.consolidatedIngredients).toHaveLength(3)

    const harina = summary.consolidatedIngredients.find((i) => i.name === 'Harina 0000')
    expect(harina).toBeDefined()
    expect(harina!.totalGrossQuantity).toBe(900)
    expect(harina!.origins[0].isSubrecipe).toBe(true)
    expect(harina!.origins[0].parentRecipeName).toBe('Torta Armada de Cumpleaños')

    const dulce = summary.consolidatedIngredients.find((i) => i.name === 'Dulce de Leche Repostero')
    expect(dulce).toBeDefined()
    expect(dulce!.totalGrossQuantity).toBe(1200)
    expect(dulce!.origins[0].isSubrecipe).toBe(false)
  })

  it('separa unidades incompatibles sin densidad y marca cálculo como provisional', () => {
    // Dos recetas con "Harina", una en gramos (500 g) y otra en tazas (2 tazas) sin densidad
    const recipeA: Recipe = {
      id: 'rec-a',
      name: 'Pan',
      category: '',
      description: '',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 0,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'i-1',
          name: 'Harina',
          quantity: 500,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1000,
          calculated_cost: 500,
        },
      ],
      additional_costs: [],
    }

    const recipeB: Recipe = {
      id: 'rec-b',
      name: 'Waffles',
      category: '',
      description: '',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 0,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'i-2',
          name: 'Harina',
          quantity: 2,
          unit: 'taza' as any,
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1000,
          calculated_cost: 0,
        },
      ],
      additional_costs: [],
    }

    const resolver = (id: string) => (id === 'rec-a' ? recipeA : id === 'rec-b' ? recipeB : undefined)

    const summary = calculateProductionPlan(
      [
        { recipeId: 'rec-a', targetQuantity: 1, targetUnit: 'unidades' },
        { recipeId: 'rec-b', targetQuantity: 1, targetUnit: 'unidades' },
      ],
      resolver
    )

    // No debe inventar conversiones ni colapsar todo a cero
    expect(summary.incompatibleIngredients.length).toBeGreaterThan(0)
    const incompatible = summary.incompatibleIngredients.find((i) => i.name === 'Harina')
    expect(incompatible).toBeDefined()
    expect(incompatible!.isProvisional).toBe(true)
    expect(incompatible!.warnings.length).toBeGreaterThan(0)
  })

  it('respeta las marcas de checkboxes de compras', () => {
    const simpleRecipe: Recipe = {
      id: 'r-1',
      name: 'Galletas',
      category: '',
      description: '',
      yield_quantity: 10,
      yield_unit: 'unidades',
      target_margin: 0,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-1',
          name: 'Manteca',
          quantity: 100,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 2000,
          calculated_cost: 200,
        },
      ],
      additional_costs: [],
    }

    const resolver = (id: string) => (id === 'r-1' ? simpleRecipe : undefined)
    const checkedKeys = new Set(['free:manteca:mass'])

    const summary = calculateProductionPlan(
      [{ recipeId: 'r-1', targetQuantity: 10, targetUnit: 'unidades' }],
      resolver,
      undefined,
      checkedKeys
    )

    expect(summary.consolidatedIngredients[0].isChecked).toBe(true)
  })
})
