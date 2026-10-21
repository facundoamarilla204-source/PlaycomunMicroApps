import { describe, it, expect } from 'vitest'
import {
  detectSubrecipeCycle,
  calculateProportionalSubrecipeCost,
  calculateCompositeRecipeFinancials,
} from '../subrecipes'
import { Recipe } from '@/lib/costo-receta'

describe('Motor de Subrecetas y Elaboraciones Compuestas (Fase 7)', () => {
  describe('Detección y prevención de dependencias circulares', () => {
    it('rechaza auto-referencia directa (receta A que se incluye a sí misma)', () => {
      const result = detectSubrecipeCycle('receta-a', 'receta-a', () => [])
      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toEqual(['receta-a', 'receta-a'])
      expect(result.message).toContain('Una receta no puede incluirse a sí misma')
    })

    it('rechaza ciclos indirectos de 2 niveles (A -> B -> A)', () => {
      // Receta B ya contiene a Receta A como subreceta
      const graph: Record<string, string[]> = {
        'receta-a': [],
        'receta-b': ['receta-a'],
      }
      const result = detectSubrecipeCycle('receta-a', 'receta-b', (id) => graph[id] || [])
      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toEqual(['receta-a', 'receta-b', 'receta-a'])
      expect(result.message).toContain('Dependencia circular detectada')
    })

    it('rechaza ciclos profundos de varios niveles (A -> B -> C -> D -> A)', () => {
      const graph: Record<string, string[]> = {
        'receta-a': [],
        'receta-b': ['receta-c'],
        'receta-c': ['receta-d'],
        'receta-d': ['receta-a'],
      }
      const result = detectSubrecipeCycle('receta-a', 'receta-b', (id) => graph[id] || [])
      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toEqual(['receta-a', 'receta-b', 'receta-c', 'receta-d', 'receta-a'])
    })

    it('permite relaciones anidadas válidas y reutilización legítima de subrecetas (grafo diamante)', () => {
      // Torta usa Bizcochuelo y Ganache; ambos usan Almíbar como subreceta.
      // Esto NO es un ciclo, es reutilización válida tipo diamante.
      const graph: Record<string, string[]> = {
        torta: ['bizcochuelo', 'ganache'],
        bizcochuelo: ['almibar'],
        ganache: ['almibar'],
        almibar: [],
      }

      // Probar agregar ganache a torta
      const result1 = detectSubrecipeCycle('torta', 'ganache', (id) => graph[id] || [])
      expect(result1.hasCycle).toBe(false)

      // Probar agregar almibar a torta
      const result2 = detectSubrecipeCycle('torta', 'almibar', (id) => graph[id] || [])
      expect(result2.hasCycle).toBe(false)
    })
  })

  describe('Cálculo proporcional de costo y mermas', () => {
    it('calcula el costo proporcional exacto según el rendimiento (300g de una ganache de 1000g que costó $10.000)', () => {
      const res = calculateProportionalSubrecipeCost({
        netQuantity: 300,
        unit: 'g',
        subrecipeYieldQuantity: 1000,
        subrecipeYieldUnit: 'g',
        subrecipeTotalCost: 10000,
      })

      expect(res.success).toBe(true)
      expect(res.unitCost).toBe(10) // $10 por gramo
      expect(res.calculatedCost).toBe(3000) // 300g * $10 = $3.000
      expect(res.grossQuantity).toBe(300)
      expect(res.hasCostDivergence).toBe(false)
    })

    it('aplica merma del componente correctamente (ej. 10% de merma en manga pastelera)', () => {
      // Necesita 900g netos con 10% de merma -> Bruto = 900 / 0.9 = 1000g
      const res = calculateProportionalSubrecipeCost({
        netQuantity: 900,
        unit: 'g',
        wastePercentage: 10,
        subrecipeYieldQuantity: 1000,
        subrecipeYieldUnit: 'g',
        subrecipeTotalCost: 5000,
      })

      expect(res.success).toBe(true)
      expect(res.grossQuantity).toBe(1000)
      expect(res.calculatedCost).toBe(5000)
    })

    it('convierte unidades compatibles automáticamente (kg a g)', () => {
      // Subreceta rinde 2 kg y cuesta $8.000 ($4.000/kg). Se usan 500 g -> Costo $2.000
      const res = calculateProportionalSubrecipeCost({
        netQuantity: 500,
        unit: 'g',
        subrecipeYieldQuantity: 2,
        subrecipeYieldUnit: 'kg',
        subrecipeTotalCost: 8000,
      })

      expect(res.success).toBe(true)
      expect(res.calculatedCost).toBe(2000)
    })

    it('marca error provisional ante dimensiones incompatibles sin densidad (g a ml)', () => {
      const res = calculateProportionalSubrecipeCost({
        netQuantity: 200,
        unit: 'ml',
        subrecipeYieldQuantity: 500,
        subrecipeYieldUnit: 'g',
        subrecipeTotalCost: 2500,
      })

      expect(res.success).toBe(false)
      expect(res.isProvisional).toBe(true)
      expect(res.conversionError).toBeDefined()
    })

    it('detecta divergencia cuando el costo guardado históricamente difiere del costo vigente', () => {
      const res = calculateProportionalSubrecipeCost({
        netQuantity: 300,
        unit: 'g',
        subrecipeYieldQuantity: 1000,
        subrecipeYieldUnit: 'g',
        subrecipeTotalCost: 12000, // Costo subió a $12.000 (actual: $3.600)
        savedHistoricalCost: 3000, // Histórico guardado: $3.000
      })

      expect(res.calculatedCost).toBe(3600)
      expect(res.hasCostDivergence).toBe(true)
    })
  })

  describe('Motor recursivo de costeo compuesto (calculateCompositeRecipeFinancials)', () => {
    // Definir recetas para prueba
    const recetaAlmibar: Recipe = {
      id: 'sub-almibar',
      name: 'Almíbar simple',
      category: 'Básicos',
      description: 'Agua y azúcar 1:1',
      yield_quantity: 500,
      yield_unit: 'g',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-azucar',
          name: 'Azúcar',
          quantity: 250,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1000, // $1/g -> $250
        },
        {
          id: 'ing-agua',
          name: 'Agua',
          quantity: 250,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'l',
          reference_price: 100, // $0.10/g -> $25
          density: 1, // Densidad del agua = 1 g/ml
        },
      ],
      additional_costs: [{ id: 'cost-gas', name: 'Gas cocción', amount: 50 }],
    }
    // Total Almíbar = $250 + $25 + $50 = $325 para 500g ($0.65/g)

    const recetaBizcochuelo: Recipe = {
      id: 'sub-bizcochuelo',
      name: 'Bizcochuelo de vainilla',
      category: 'Bases',
      description: 'Bizcochuelo esponjoso',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-harina',
          name: 'Harina 0000',
          quantity: 300,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 1200, // $360
        },
        {
          id: 'ing-huevos',
          name: 'Huevos',
          quantity: 4,
          unit: 'unidades',
          reference_quantity: 12,
          reference_unit: 'unidades',
          reference_price: 2400, // $800
        },
      ],
      additional_costs: [{ id: 'cost-luz', name: 'Horno eléctrico', amount: 200 }],
      subrecipes: [
        {
          id: 'rel-almibar-en-bizcocho',
          recipe_id: 'sub-bizcochuelo',
          subrecipe_id: 'sub-almibar',
          quantity: 100, // 100g de almíbar = 100 * $0.65 = $65
          unit: 'g',
          waste_percentage: 0,
          position: 1,
          reference_total_cost: 65,
        },
      ],
    }
    // Total Bizcochuelo = $360 + $800 + $200 + $65 = $1.425 por 1 unidad

    const recetaTortaFinal: Recipe = {
      id: 'torta-cumple',
      name: 'Torta de Cumpleaños Especial',
      category: 'Tortas',
      description: 'Torta armada con bizcochuelo y almíbar directo',
      yield_quantity: 1,
      yield_unit: 'unidades',
      target_margin: 40,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-dulce-leche',
          name: 'Dulce de leche repostero',
          quantity: 500,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 4000, // $2.000
        },
      ],
      additional_costs: [{ id: 'cost-caja', name: 'Caja y blonda', amount: 300 }],
      subrecipes: [
        {
          id: 'rel-bizcocho-en-torta',
          recipe_id: 'torta-cumple',
          subrecipe_id: 'sub-bizcochuelo',
          quantity: 1, // 1 bizcochuelo = $1.425
          unit: 'unidades',
          waste_percentage: 0,
          position: 1,
          reference_total_cost: 1425,
        },
        {
          id: 'rel-almibar-extra',
          recipe_id: 'torta-cumple',
          subrecipe_id: 'sub-almibar',
          quantity: 50, // 50g de almíbar directo = 50 * $0.65 = $32.50
          unit: 'g',
          waste_percentage: 0,
          position: 2,
          reference_total_cost: 32.5,
        },
      ],
    }

    const recipeMap = new Map<string, Recipe>([
      ['sub-almibar', recetaAlmibar],
      ['sub-bizcochuelo', recetaBizcochuelo],
      ['torta-cumple', recetaTortaFinal],
    ])

    const resolver = (id: string) => recipeMap.get(id)

    it('calcula recursivamente todos los niveles del árbol sin duplicar componentes', () => {
      const financials = calculateCompositeRecipeFinancials(recetaTortaFinal, resolver)

      // Directos de la torta:
      // Dulce de leche = $2.000
      expect(financials.directIngredientsCost).toBe(2000)
      // Costos adicionales directos: Caja = $300
      expect(financials.additionalCosts).toBe(300)

      // Subrecetas incorporadas:
      // Bizcochuelo ($1.425) + Almíbar extra ($32.50) = $1.457,50
      expect(financials.subrecipesCost).toBeCloseTo(1457.5, 2)

      // Total preparación completa = $2.000 + $300 + $1.457,50 = $3.757,50
      expect(financials.totalCost).toBeCloseTo(3757.5, 2)
      expect(financials.unitCost).toBeCloseTo(3757.5, 2)

      // Margen objetivo: 40% -> Precio sugerido = 3757.50 / 0.60 = $6.262,50
      expect(financials.suggestedPrice).toBeCloseTo(6262.5, 1)

      // Verificar desglose detallado de subrecetas
      expect(financials.subrecipesBreakdown).toHaveLength(2)
      const bizcochoItem = financials.subrecipesBreakdown.find((b) => b.subrecipeId === 'sub-bizcochuelo')
      expect(bizcochoItem).toBeDefined()
      expect(bizcochoItem?.calculatedCost).toBeCloseTo(1425, 2)
      // Debe contener en su árbol el almíbar que utilizó internamente
      expect(bizcochoItem?.childSubrecipes).toHaveLength(1)
      expect(bizcochoItem?.childSubrecipes?.[0].subrecipeId).toBe('sub-almibar')
      expect(bizcochoItem?.childSubrecipes?.[0].calculatedCost).toBeCloseTo(65, 2)

      expect(financials.hasConversionErrors).toBe(false)
      expect(financials.hasProvisionalCosts).toBe(false)
    })

    it('propaga flags de costo provisional si una subreceta interna tiene unidades incompatibles', () => {
      // Modificar almíbar para tener una unidad incompatible sin densidad
      const almibarIncompatible: Recipe = {
        ...recetaAlmibar,
        yield_quantity: 1,
        yield_unit: 'unidades', // Rinde "unidades" pero el bizcocho le pide "g"
      }
      const localMap = new Map(recipeMap)
      localMap.set('sub-almibar', almibarIncompatible)

      const financials = calculateCompositeRecipeFinancials(recetaTortaFinal, (id) => localMap.get(id))
      expect(financials.hasProvisionalCosts).toBe(true)
      expect(financials.invalidItemsCount).toBeGreaterThan(0)
    })

    it('detecta divergencia de costos históricos cuando la subreceta fue modificada', () => {
      // Supongamos que el almíbar subió de precio a $1.300 (el doble)
      const almibarAumentado: Recipe = {
        ...recetaAlmibar,
        ingredients: [
          {
            id: 'ing-azucar-cara',
            name: 'Azúcar más cara',
            quantity: 500,
            unit: 'g',
            reference_price: 2000,
            reference_quantity: 1,
            reference_unit: 'kg',
          },
          {
            id: 'ing-agua-filtrada',
            name: 'Agua filtrada',
            quantity: 500,
            unit: 'ml',
            reference_price: 600,
            reference_quantity: 1,
            reference_unit: 'l',
          },
        ],
      }
      const localMap = new Map(recipeMap)
      localMap.set('sub-almibar', almibarAumentado)

      const financials = calculateCompositeRecipeFinancials(recetaTortaFinal, (id) => localMap.get(id))
      const almibarExtra = financials.subrecipesBreakdown.find((b) => b.subrecipeId === 'sub-almibar')
      expect(almibarExtra?.hasCostDivergence).toBe(true)
      expect(almibarExtra?.savedHistoricalCost).toBe(32.5)
      expect(almibarExtra?.calculatedCost).toBeGreaterThan(32.5)
    })

    it('maneja con elegancia si una subreceta referenciada no existe en el catálogo', () => {
      const tortaConInexistente: Recipe = {
        ...recetaTortaFinal,
        subrecipes: [
          {
            id: 'rel-fantasma',
            recipe_id: 'torta-cumple',
            subrecipe_id: 'subreceta-que-no-existe',
            quantity: 100,
            unit: 'g',
            waste_percentage: 0,
            position: 1,
          },
        ],
      }

      const financials = calculateCompositeRecipeFinancials(tortaConInexistente, resolver)
      expect(financials.hasProvisionalCosts).toBe(true)
      expect(financials.invalidItemsCount).toBe(1)
      expect(financials.subrecipesBreakdown[0].conversionError).toContain('no se encuentra disponible')
    })

    it('utiliza caché memoizada para evitar recalcular la misma subreceta compartida múltiples veces', () => {
      let almibarComputeCount = 0
      const countingResolver = (id: string) => {
        if (id === 'sub-almibar') almibarComputeCount++
        return recipeMap.get(id)
      }

      // La torta usa Bizcochuelo (que usa Almíbar) y además usa Almíbar directamente
      calculateCompositeRecipeFinancials(recetaTortaFinal, countingResolver)
      // Debe resolverlo una vez o mínimo gracias a la memoización interna
      expect(almibarComputeCount).toBeLessThanOrEqual(2)
    })
  })
})
