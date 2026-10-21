import { describe, it, expect } from 'vitest'
import {
  scaleRecipeByFactor,
  scaleRecipeByYield,
  scaleRecipeByUnits,
  scaleRecipeByTargetWeight,
  calculatePracticalQuantity,
  formatCulinaryQuantity,
  ScalableRecipe,
} from '../scaling'

describe('Gastronomía: Escalado de recetas', () => {
  const baseRecipe: ScalableRecipe = {
    name: 'Budín de limón clásico',
    yield_quantity: 8,
    yield_unit: 'porciones',
    ingredients: [
      { id: '1', name: 'Harina 0000', quantity: 240, unit: 'g' },
      { id: '2', name: 'Azúcar común', quantity: 200, unit: 'g' },
      { id: '3', name: 'Huevos', quantity: 3, unit: 'unidades', pieceWeightGrams: 55 },
      { id: '4', name: 'Manteca', quantity: 120, unit: 'g' },
      { id: '5', name: 'Leche entera', quantity: 80, unit: 'ml', density: 1.03 },
    ],
    additional_costs: [
      { id: 'c1', name: 'Pirotines / Molde descartable', amount: 300, isScalable: true },
      { id: 'c2', name: 'Mano de obra fija horneado', amount: 1500, isScalable: false },
    ],
  }

  describe('Conservación e inmutabilidad de la receta original', () => {
    it('no muta el objeto de receta original ni sus arrays de ingredientes al escalar', () => {
      const copyOfOriginal = JSON.parse(JSON.stringify(baseRecipe))
      const result = scaleRecipeByFactor(baseRecipe, 2.5)

      expect(baseRecipe).toEqual(copyOfOriginal)
      expect(baseRecipe.yield_quantity).toBe(8)
      expect(baseRecipe.ingredients[0].quantity).toBe(240)
      expect(result.scaledRecipe).not.toBe(baseRecipe)
    })
  })

  describe('scaleRecipeByFactor (Factor directo)', () => {
    it('escala linealmente todos los ingredientes según factor 2x', () => {
      const result = scaleRecipeByFactor(baseRecipe, 2)
      expect(result.scaleFactor).toBe(2)
      expect(result.targetYield).toBe(16)

      const ings = result.scaledRecipe.ingredients
      expect(ings.find((i) => i.name === 'Harina 0000')?.quantity).toBe(480)
      expect(ings.find((i) => i.name === 'Azúcar común')?.quantity).toBe(400)
      expect(ings.find((i) => i.name === 'Huevos')?.quantity).toBe(6)
      expect(ings.find((i) => i.name === 'Manteca')?.quantity).toBe(240)
      expect(ings.find((i) => i.name === 'Leche entera')?.quantity).toBe(160)
    })

    it('respeta ingredientes con isScalable: false', () => {
      const recipeWithFixedItem: ScalableRecipe = {
        ...baseRecipe,
        ingredients: [
          ...baseRecipe.ingredients,
          { id: 'fixed', name: 'Pizca de sal', quantity: 2, unit: 'g', isScalable: false },
        ],
      }

      const result = scaleRecipeByFactor(recipeWithFixedItem, 3)
      const fixed = result.scaledRecipe.ingredients.find((i) => i.name === 'Pizca de sal')
      expect(fixed?.quantity).toBe(2)
    })

    it('escala costos adicionales solo si se habilita scaleAdditionalCosts', () => {
      // Por defecto: no escala costos adicionales
      const noScaleResult = scaleRecipeByFactor(baseRecipe, 2)
      const costs1 = noScaleResult.scaledRecipe.additional_costs || []
      expect(costs1.find((c) => c.id === 'c1')?.amount).toBe(300)

      // Con scaleAdditionalCosts: true
      const scaleResult = scaleRecipeByFactor(baseRecipe, 2, { scaleAdditionalCosts: true })
      const costs2 = scaleResult.scaledRecipe.additional_costs || []
      // c1 es escalable -> 300 * 2 = 600
      expect(costs2.find((c) => c.id === 'c1')?.amount).toBe(600)
      // c2 tiene isScalable: false -> permanece 1500
      expect(costs2.find((c) => c.id === 'c2')?.amount).toBe(1500)
    })

    it('calcula cantidades prácticas diferenciadas de la matemática exacta', () => {
      // Escalar por 1.5x: 3 huevos * 1.5 = 4.5 huevos -> cantidad práctica sugerida: 5 unidades enteras
      const result = scaleRecipeByFactor(baseRecipe, 1.5)
      const huevos = result.scaledRecipe.ingredients.find((i) => i.name === 'Huevos')
      expect(huevos?.mathematical_quantity).toBe(4.5)
      expect(huevos?.practical_quantity).toBe(5)
    })

    it('rechaza factor negativo, cero o no finito', () => {
      expect(() => scaleRecipeByFactor(baseRecipe, 0)).toThrow(/mayor a cero/)
      expect(() => scaleRecipeByFactor(baseRecipe, -1)).toThrow(/mayor a cero/)
      expect(() => scaleRecipeByFactor(baseRecipe, NaN)).toThrow(/número finito/)
    })
  })

  describe('scaleRecipeByYield (Porciones / Rendimiento)', () => {
    it('calcula factor correcto: objetivo 20 porciones sobre base de 8 porciones', () => {
      // Factor = 20 / 8 = 2.5
      const result = scaleRecipeByYield(baseRecipe, 20, 'porciones')
      expect(result.scaleFactor).toBe(2.5)
      expect(result.targetYield).toBe(20)
      expect(result.scaledRecipe.ingredients[0].quantity).toBe(600) // 240 * 2.5 = 600
    })

    it('rechaza unidades de rendimiento incompatibles si se proporcionan', () => {
      expect(() => scaleRecipeByYield(baseRecipe, 20, 'kg')).toThrow(/no coincide con la unidad original/)
    })

    it('rechaza rendimiento objetivo <= 0', () => {
      expect(() => scaleRecipeByYield(baseRecipe, 0)).toThrow(/mayor a 0/)
    })
  })

  describe('scaleRecipeByUnits (Unidades / Piezas)', () => {
    it('escala receta formulada para unidades', () => {
      const muffinRecipe: ScalableRecipe = {
        name: 'Muffins de arándanos',
        yield_quantity: 12,
        yield_unit: 'unidades',
        ingredients: [
          { name: 'Harina', quantity: 300, unit: 'g' },
          { name: 'Arándanos', quantity: 150, unit: 'g' },
        ],
      }

      // Queremos hacer 36 muffins (3 docenas) -> factor 3
      const result = scaleRecipeByUnits(muffinRecipe, 36)
      expect(result.scaleFactor).toBe(3)
      expect(result.scaledRecipe.yield_quantity).toBe(36)
      expect(result.scaledRecipe.ingredients[0].quantity).toBe(900)
    })
  })

  describe('scaleRecipeByTargetWeight (Peso final objetivo)', () => {
    it('escala la receta para alcanzar un peso objetivo de masa en gramos', () => {
      // Receta simple de pan:
      // Harina: 500g, Agua: 325g (ml a 1g/ml), Levadura: 5g, Sal: 10g.
      // Peso total = 500 + 325 + 5 + 10 = 840g.
      // Si queremos 1680g de masa (el doble): factor = 1680 / 840 = 2.0.
      const breadRecipe: ScalableRecipe = {
        name: 'Pan de campo',
        yield_quantity: 1,
        yield_unit: 'unidades',
        ingredients: [
          { name: 'Harina 000', quantity: 500, unit: 'g' },
          { name: 'Agua', quantity: 325, unit: 'ml', density: 1.0 },
          { name: 'Sal fina', quantity: 10, unit: 'g' },
          { name: 'Levadura fresca', quantity: 5, unit: 'g' },
        ],
      }

      const result = scaleRecipeByTargetWeight(breadRecipe, 1680, 'g')
      expect(result.scaleFactor).toBe(2)
      expect(result.scaledRecipe.ingredients[0].quantity).toBe(1000)
      expect(result.scaledRecipe.ingredients[1].quantity).toBe(650)
    })

    it('escala especificando peso objetivo en kg', () => {
      const breadRecipe: ScalableRecipe = {
        name: 'Pan',
        yield_quantity: 1,
        yield_unit: 'unidades',
        ingredients: [{ name: 'Harina', quantity: 1000, unit: 'g' }],
      }

      // Objetivo 2.5 kg = 2500g -> factor 2.5
      const result = scaleRecipeByTargetWeight(breadRecipe, 2.5, 'kg')
      expect(result.scaleFactor).toBe(2.5)
      expect(result.scaledRecipe.ingredients[0].quantity).toBe(2500)
    })

    it('rechaza si contiene ingredientes escalables sin conversión a masa (evita subestimar peso)', () => {
      const mixedRecipe: ScalableRecipe = {
        name: 'Torta con manzanas',
        yield_quantity: 1,
        yield_unit: 'torta',
        ingredients: [
          { name: 'Harina', quantity: 300, unit: 'g' },
          { name: 'Manzanas enteras', quantity: 3, unit: 'unidades' }, // Sin pieceWeightGrams
        ],
      }
      expect(() => scaleRecipeByTargetWeight(mixedRecipe, 1000, 'g')).toThrow(
        /no pueden convertirse a masa/
      )
    })

    it('permite escalar si el ingrediente de conteo tiene pieceWeightGrams definido', () => {
      const mixedRecipeWithWeight: ScalableRecipe = {
        name: 'Torta con manzanas pesadas',
        yield_quantity: 1,
        yield_unit: 'torta',
        ingredients: [
          { name: 'Harina', quantity: 300, unit: 'g' },
          { name: 'Manzanas', quantity: 2, unit: 'unidades', pieceWeightGrams: 150 }, // 300g
        ],
      }
      // Peso total: 300g + 300g = 600g. Si pedimos 1200g -> factor 2
      const result = scaleRecipeByTargetWeight(mixedRecipeWithWeight, 1200, 'g')
      expect(result.scaleFactor).toBe(2)
      expect(result.scaledRecipe.ingredients[0].quantity).toBe(600)
      expect(result.scaledRecipe.ingredients[1].quantity).toBe(4)
    })
  })

  describe('calculatePracticalQuantity & formatCulinaryQuantity', () => {
    it('formatea números con decimales limpios en español argentino', () => {
      expect(formatCulinaryQuantity(1250)).toBe('1.250')
      expect(formatCulinaryQuantity(2.5)).toBe('2,5')
      expect(formatCulinaryQuantity(0.333333, 2)).toBe('0,33')
    })

    it('aplica redondeo práctico según unidad', () => {
      expect(calculatePracticalQuantity(3.2, 'unidades')).toBe(4) // huevos ceiling
      expect(calculatePracticalQuantity(123.456, 'g')).toBe(123.5)
      expect(calculatePracticalQuantity(1.23456, 'kg')).toBe(1.235)
    })
  })
})
