import { describe, it, expect } from 'vitest'
import {
  calculateBakersPercentages,
  calculateWeightsFromFlour,
  calculateWeightsFromTotalDough,
  calculateHydration,
  deconstructPreferment,
  BakerIngredientInput,
  BakerPercentageSpec,
  PrefermentSpec,
} from '../bakers-percentage'

describe('Gastronomía: Porcentaje panadero e hidratación', () => {
  describe('calculateBakersPercentages con harina única', () => {
    it('calcula porcentajes panaderos e hidratación tradicional para baguette', () => {
      // 1000g Harina (100%)
      // 680g Agua (68%)
      // 20g Sal (2%)
      // 4g Levadura seca (0.4%)
      const ingredients: BakerIngredientInput[] = [
        { name: 'Harina de trigo 000', weightGrams: 1000, isFlour: true },
        { name: 'Agua', weightGrams: 680, isLiquid: true },
        { name: 'Sal fina', weightGrams: 20 },
        { name: 'Levadura seca instantánea', weightGrams: 4 },
      ]

      const result = calculateBakersPercentages(ingredients)
      expect(result.totalFlourWeightGrams).toBe(1000)
      expect(result.totalDoughWeightGrams).toBe(1704)
      expect(result.traditionalHydrationPercentage).toBe(68)
      expect(result.pureWaterGrams).toBe(680)
      expect(result.estimatedTotalWaterPercentage).toBe(68)

      const flour = result.ingredients.find((i) => i.name.includes('Harina'))
      expect(flour?.bakersPercentage).toBe(100)
      expect(flour?.shareOfTotalFlour).toBe(100)

      const salt = result.ingredients.find((i) => i.name.includes('Sal'))
      expect(salt?.bakersPercentage).toBe(2)

      const yeast = result.ingredients.find((i) => i.name.includes('Levadura'))
      expect(yeast?.bakersPercentage).toBe(0.4)
    })
  })

  describe('calculateBakersPercentages con múltiples harinas (Mix de harinas = 100%)', () => {
    it('considera que la suma de todas las harinas representa el 100% base', () => {
      // 700g Harina 000 + 300g Harina integral = 1000g Harina Total (100%)
      // Harina 000 = 70% del total de harinas
      // Harina integral = 30% del total de harinas
      // 750g Agua = 75% hidratación
      const ingredients: BakerIngredientInput[] = [
        { name: 'Harina 000', weightGrams: 700, isFlour: true },
        { name: 'Harina integral fina', weightGrams: 300, isFlour: true },
        { name: 'Agua', weightGrams: 750, isLiquid: true },
        { name: 'Sal', weightGrams: 20 },
      ]

      const result = calculateBakersPercentages(ingredients)
      expect(result.totalFlourWeightGrams).toBe(1000)
      expect(result.traditionalHydrationPercentage).toBe(75)

      const h000 = result.ingredients.find((i) => i.name === 'Harina 000')
      expect(h000?.bakersPercentage).toBe(70)
      expect(h000?.shareOfTotalFlour).toBe(70)

      const hInt = result.ingredients.find((i) => i.name === 'Harina integral fina')
      expect(hInt?.bakersPercentage).toBe(30)
      expect(hInt?.shareOfTotalFlour).toBe(30)

      expect((h000?.shareOfTotalFlour ?? 0) + (hInt?.shareOfTotalFlour ?? 0)).toBe(100)
    })
  })

  describe('Diferenciación: Hidratación Panadera Tradicional vs. Aporte Estimado de Agua', () => {
    it('distingue hidratación tradicional (0%) de aporte de agua estimado (52.5%) en masa enriquecida con leche y huevo', () => {
      // Masa de brioche: 1000g Harina, 500g Leche (90% agua -> 450g), 100g Huevos (75% agua -> 75g), 0g Agua pura.
      // Hidratación tradicional = 0% (no lleva agua pura).
      // Aporte de agua estimado = (450 + 75) / 1000 = 52.5%.
      const briocheIngredients: BakerIngredientInput[] = [
        { name: 'Harina 000', weightGrams: 1000, isFlour: true },
        { name: 'Leche entera', weightGrams: 500, isLiquid: true },
        { name: 'Huevos', weightGrams: 100, isLiquid: true },
        { name: 'Manteca', weightGrams: 200 },
      ]

      const result = calculateBakersPercentages(briocheIngredients)
      expect(result.totalFlourWeightGrams).toBe(1000)
      expect(result.pureWaterGrams).toBe(0)
      expect(result.traditionalHydrationPercentage).toBe(0)
      expect(result.estimatedWaterFromLiquidsGrams).toBeCloseTo(525, 1)
      expect(result.estimatedTotalWaterPercentage).toBeCloseTo(52.5, 1)
    })

    it('permite coeficientes de contenido de agua personalizados', () => {
      const customLiq: BakerIngredientInput[] = [
        { name: 'Harina', weightGrams: 1000, isFlour: true },
        { name: 'Puré de calabaza asada', weightGrams: 300, isLiquid: true, waterRatio: 0.82 },
      ]
      const result = calculateBakersPercentages(customLiq)
      // 300 * 0.82 = 246g agua estimada -> 24.6% aporte estimado
      expect(result.traditionalHydrationPercentage).toBe(0)
      expect(result.estimatedTotalWaterPercentage).toBeCloseTo(24.6, 1)
    })
  })

  describe('Prefermentos y Masa Madre (Evitar duplicación y balance exacto)', () => {
    it('descompone correctamente masa madre al 100% de hidratación (1:1)', () => {
      // 200g masa madre al 100% -> factor = 1 + 1.0 = 2.0 -> 100g harina y 100g agua
      const spec: PrefermentSpec = {
        name: 'Masa Madre Levain',
        totalWeightGrams: 200,
        hydrationPercentage: 100,
      }
      const dec = deconstructPreferment(spec)
      expect(dec.flourGrams).toBe(100)
      expect(dec.waterGrams).toBe(100)
      expect(dec.alreadyIncludedInBaseIngredients).toBe(false)
    })

    it('descompone correctamente biga al 50% de hidratación', () => {
      // 300g biga al 50% -> factor = 1 + 0.5 = 1.5 -> 200g harina y 100g agua
      const spec: PrefermentSpec = {
        name: 'Biga italiana',
        totalWeightGrams: 300,
        hydrationPercentage: 50,
      }
      const dec = deconstructPreferment(spec)
      expect(dec.flourGrams).toBe(200)
      expect(dec.waterGrams).toBe(100)
    })

    it('incorpora masa madre al balance sin que el usuario tenga que descomponerla a mano', () => {
      // Usuario ingresa 900g harina 000, 600g agua pura, 20g sal.
      // Y agrega 200g de masa madre (100% hidratación = 100g harina + 100g agua).
      // Total harina real = 900 + 100 = 1000g.
      // Total agua real = 600 + 100 = 700g.
      // Hidratación real = 70%.
      const baseIngredients: BakerIngredientInput[] = [
        { name: 'Harina 000', weightGrams: 900, isFlour: true },
        { name: 'Agua pura', weightGrams: 600 },
        { name: 'Sal', weightGrams: 20 },
      ]

      const result = calculateBakersPercentages(baseIngredients, {
        preferment: {
          name: 'Masa Madre',
          totalWeightGrams: 200,
          hydrationPercentage: 100,
          alreadyIncludedInBaseIngredients: false,
        },
      })

      expect(result.totalFlourWeightGrams).toBe(1000)
      expect(result.pureWaterGrams).toBe(700)
      expect(result.traditionalHydrationPercentage).toBe(70)
      expect(result.totalDoughWeightGrams).toBe(1720) // 900 + 600 + 20 + 200
      expect(result.prefermentContribution?.flourGrams).toBe(100)
      expect(result.prefermentContribution?.waterGrams).toBe(100)
    })

    it('no duplica harina ni agua cuando el usuario ya los incluyó en la lista principal', () => {
      // El usuario ya anotó 1000g de harina y 700g de agua en la lista.
      // Y marca alreadyIncludedInBaseIngredients: true para documentar los 200g de masa madre.
      const baseIngredients: BakerIngredientInput[] = [
        { name: 'Harina 000', weightGrams: 1000, isFlour: true },
        { name: 'Agua', weightGrams: 700 },
        { name: 'Sal', weightGrams: 20 },
      ]

      const result = calculateBakersPercentages(baseIngredients, {
        preferment: {
          name: 'Masa Madre',
          totalWeightGrams: 200,
          hydrationPercentage: 100,
          alreadyIncludedInBaseIngredients: true,
        },
      })

      // No se suman 100g adicionales; permanece en 1000g y 700g
      expect(result.totalFlourWeightGrams).toBe(1000)
      expect(result.pureWaterGrams).toBe(700)
      expect(result.traditionalHydrationPercentage).toBe(70)
      expect(result.prefermentContribution?.note).toContain('ya están computadas')
    })
  })

  describe('calculateWeightsFromFlour (Formulación a partir de harina objetivo)', () => {
    it('calcula los gramos de cada ingrediente a partir de 2.000g de harina', () => {
      const specs: BakerPercentageSpec[] = [
        { name: 'Harina 000', bakersPercentage: 100, isFlour: true },
        { name: 'Agua', bakersPercentage: 65, isLiquid: true },
        { name: 'Sal', bakersPercentage: 2 },
        { name: 'Levadura', bakersPercentage: 1 },
      ]

      const result = calculateWeightsFromFlour(2000, specs)
      expect(result.totalFlourWeightGrams).toBe(2000)

      const agua = result.ingredients.find((i) => i.name === 'Agua')
      expect(agua?.weightGrams).toBe(1300)

      const sal = result.ingredients.find((i) => i.name === 'Sal')
      expect(sal?.weightGrams).toBe(40)

      const levadura = result.ingredients.find((i) => i.name === 'Levadura')
      expect(levadura?.weightGrams).toBe(20)
    })
  })

  describe('calculateWeightsFromTotalDough (Formulación a partir de peso total de masa deseado)', () => {
    it('calcula la harina y demás ingredientes para producir exactamente 3.360g de masa', () => {
      // Fórmula: Harina 100%, Agua 65%, Sal 2%, Levadura 1%. Total fórmula = 168%.
      // Para 3360g de masa: Harina necesaria = 3360 / 1.68 = 2000g.
      const specs: BakerPercentageSpec[] = [
        { name: 'Harina 000', bakersPercentage: 100, isFlour: true },
        { name: 'Agua', bakersPercentage: 65, isLiquid: true },
        { name: 'Sal', bakersPercentage: 2 },
        { name: 'Levadura', bakersPercentage: 1 },
      ]

      const result = calculateWeightsFromTotalDough(3360, specs)
      expect(result.totalFlourWeightGrams).toBeCloseTo(2000, 1)
      expect(result.totalDoughWeightGrams).toBeCloseTo(3360, 1)

      const harina = result.ingredients.find((i) => i.name === 'Harina 000')
      expect(harina?.weightGrams).toBeCloseTo(2000, 1)

      const agua = result.ingredients.find((i) => i.name === 'Agua')
      expect(agua?.weightGrams).toBeCloseTo(1300, 1)
    })

    it('rechaza si las harinas no suman 100%', () => {
      const invalidSpecs: BakerPercentageSpec[] = [
        { name: 'Harina 000', bakersPercentage: 80, isFlour: true }, // suma 80 en vez de 100
        { name: 'Agua', bakersPercentage: 60, isLiquid: true },
      ]
      expect(() => calculateWeightsFromTotalDough(1000, invalidSpecs)).toThrow(/debe ser exactamente 100%/)
    })
  })

  describe('calculateHydration helper directo', () => {
    it('calcula tanto la hidratación tradicional como el aporte estimado total', () => {
      const res = calculateHydration(1000, [
        { name: 'agua', weightGrams: 400 }, // 400 agua pura
        { name: 'leche', weightGrams: 200 }, // 200 * 0.90 = 180 agua estimada
      ])
      expect(res.pureWaterGrams).toBe(400)
      expect(res.traditionalHydrationPercentage).toBe(40) // 40% agua pura
      expect(res.totalEffectiveWaterGrams).toBeCloseTo(580, 2)
      expect(res.estimatedTotalWaterPercentage).toBeCloseTo(58, 2) // 58% aporte estimado
    })
  })

  describe('Validación de errores y casos inválidos', () => {
    it('rechaza ingredientes sin harina', () => {
      const noFlour: BakerIngredientInput[] = [
        { name: 'Azúcar', weightGrams: 500 },
        { name: 'Agua', weightGrams: 500, isLiquid: true },
      ]
      expect(() => calculateBakersPercentages(noFlour)).toThrow(/al menos una harina/)
    })

    it('rechaza pesos negativos o no finitos', () => {
      const neg: BakerIngredientInput[] = [
        { name: 'Harina 000', weightGrams: -100, isFlour: true },
      ]
      expect(() => calculateBakersPercentages(neg)).toThrow(/no negativo/)
    })
  })
})
