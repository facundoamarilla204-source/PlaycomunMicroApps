import { describe, it, expect } from 'vitest'
import {
  calculateMoldArea,
  calculateMoldVolume,
  calculateMoldScaleFactor,
  scaleRecipeForMold,
  RoundMold,
  SquareMold,
  RectangularMold,
} from '../mold-scaling'
import { ScalableRecipe } from '../scaling'

describe('Gastronomía: Adaptación de moldes (mold-scaling)', () => {
  describe('calculateMoldArea', () => {
    it('calcula el área de molde redondo por diámetro: pi * (d/2)^2', () => {
      // Molde de 20 cm de diámetro -> r = 10 cm -> Area = pi * 100 = 314.159... cm²
      const round20: RoundMold = { shape: 'round', diameter: 20 }
      const area = calculateMoldArea(round20)
      expect(area).toBeCloseTo(314.16, 2)
    })

    it('calcula el área de molde cuadrado: side^2', () => {
      // Molde cuadrado de 20 cm de lado -> Area = 400 cm²
      const square20: SquareMold = { shape: 'square', side: 20 }
      expect(calculateMoldArea(square20)).toBe(400)
    })

    it('calcula el área de molde rectangular: length * width', () => {
      // Molde rectangular de 30 x 20 cm -> Area = 600 cm²
      const rect: RectangularMold = { shape: 'rectangular', length: 30, width: 20 }
      expect(calculateMoldArea(rect)).toBe(600)
    })

    it('rechaza dimensiones menores o iguales a cero, no numéricas o infinitas', () => {
      expect(() => calculateMoldArea({ shape: 'round', diameter: 0 } as any)).toThrow(/mayor a 0/)
      expect(() => calculateMoldArea({ shape: 'round', diameter: -5 } as any)).toThrow(/mayor a 0/)
      expect(() => calculateMoldArea({ shape: 'square', side: NaN } as any)).toThrow(/número finito/)
      expect(() => calculateMoldArea({ shape: 'rectangular', length: 20, width: -10 } as any)).toThrow(/mayor a 0/)
    })
  })

  describe('calculateMoldVolume', () => {
    it('calcula volumen si se proporciona altura', () => {
      // Molde redondo 20 cm diametro, 5 cm de alto
      // Volumen = Area (314.159) * 5 = 1570.796 cm³ (ml)
      const round: RoundMold = { shape: 'round', diameter: 20, height: 5 }
      const vol = calculateMoldVolume(round)
      expect(vol).toBeCloseTo(1570.8, 1)
    })

    it('devuelve null si no tiene altura', () => {
      const square: SquareMold = { shape: 'square', side: 20 }
      expect(calculateMoldVolume(square)).toBeNull()
    })
  })

  describe('calculateMoldScaleFactor', () => {
    it('calcula factor de escala por área entre dos moldes redondos de diferente diámetro (20cm a 24cm)', () => {
      // Molde origen: 20 cm -> Area = pi * 10^2 = 314.16
      // Molde destino: 24 cm -> Area = pi * 12^2 = 452.39
      // Factor = 452.389 / 314.159 = (24/20)^2 = 1.2^2 = 1.44 exactamente!
      const mold20: RoundMold = { shape: 'round', diameter: 20 }
      const mold24: RoundMold = { shape: 'round', diameter: 24 }

      const result = calculateMoldScaleFactor(mold20, mold24)
      expect(result.scaleFactor).toBeCloseTo(1.44, 4)
      expect(result.calculationBasis).toBe('area')
      expect(result.heightPreserved).toBe(true)
      expect(result.bakingNote).toContain('conservar la altura original')
    })

    it('calcula factor de ajuste entre formas diferentes: redondo a rectangular', () => {
      // Redondo 20 cm (area 314.16 cm²) a Rectangular 20x25 cm (area 500 cm²)
      // Factor = 500 / 314.159... = 1.5915...
      const round: RoundMold = { shape: 'round', diameter: 20 }
      const rect: RectangularMold = { shape: 'rectangular', length: 25, width: 20 }

      const result = calculateMoldScaleFactor(round, rect)
      expect(result.scaleFactor).toBeCloseTo(1.5915, 3)
      expect(result.calculationBasis).toBe('area')
    })

    it('calcula factor por volumen cuando se pide considerHeight con alturas disímiles', () => {
      // Molde 1: redondo 20 cm diámetro, 5 cm alto -> Vol = 1570.8
      // Molde 2: redondo 20 cm diámetro, 8 cm alto -> Vol = 2513.27
      // Factor volumen = 8 / 5 = 1.6
      const source: RoundMold = { shape: 'round', diameter: 20, height: 5 }
      const target: RoundMold = { shape: 'round', diameter: 20, height: 8 }

      const result = calculateMoldScaleFactor(source, target, { considerHeight: true })
      expect(result.scaleFactor).toBeCloseTo(1.6, 4)
      expect(result.calculationBasis).toBe('volume')
      expect(result.heightPreserved).toBe(false)
      expect(result.bakingNote).toContain('relación de volúmenes')
    })

    it('vuelve a área si considerHeight es true pero falta la altura en alguno', () => {
      const source: RoundMold = { shape: 'round', diameter: 20 } // sin altura
      const target: RoundMold = { shape: 'round', diameter: 24, height: 6 }

      const result = calculateMoldScaleFactor(source, target, { considerHeight: true })
      expect(result.calculationBasis).toBe('area')
      expect(result.scaleFactor).toBeCloseTo(1.44, 2)
    })
  })

  describe('scaleRecipeForMold (Escalado completo de receta por molde)', () => {
    it('adapta cantidades de ingredientes según el factor del nuevo molde', () => {
      const cakeRecipe: ScalableRecipe = {
        name: 'Bizcochuelo genovés básico',
        yield_quantity: 1,
        yield_unit: 'torta',
        ingredients: [
          { name: 'Huevos', quantity: 4, unit: 'unidades' },
          { name: 'Azúcar', quantity: 120, unit: 'g' },
          { name: 'Harina 0000', quantity: 120, unit: 'g' },
        ],
      }

      // Molde original: 20 cm redondo
      // Molde destino: 26 cm redondo -> Factor = (26/20)^2 = 1.3^2 = 1.69
      const sourceMold: RoundMold = { shape: 'round', diameter: 20 }
      const targetMold: RoundMold = { shape: 'round', diameter: 26 }

      const result = scaleRecipeForMold(cakeRecipe, sourceMold, targetMold)
      expect(result.moldScaling.scaleFactor).toBeCloseTo(1.69, 4)

      const sugar = result.scaledRecipe.ingredients.find((i) => i.name === 'Azúcar')
      // 120 * 1.69 = 202.8g
      expect(sugar?.quantity).toBeCloseTo(202.8, 1)

      const eggs = result.scaledRecipe.ingredients.find((i) => i.name === 'Huevos')
      // 4 * 1.69 = 6.76 huevos exactos -> 7 prácticos
      expect(eggs?.mathematical_quantity).toBeCloseTo(6.76, 2)
      expect(eggs?.practical_quantity).toBe(7)
    })
  })
})
