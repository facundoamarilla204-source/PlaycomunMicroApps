import { describe, it, expect } from 'vitest'
import {
  convertUnits,
  normalizeUnit,
  getUnitDimension,
  describeCulinaryUnit,
  CULINARY_VOLUME_CONVENTIONS,
} from '../conversions'

describe('Gastronomía: Conversiones dimensionales seguras', () => {
  describe('normalizeUnit y getUnitDimension', () => {
    it('normaliza sinónimos y variaciones habituales', () => {
      expect(normalizeUnit('g')).toBe('g')
      expect(normalizeUnit('gr')).toBe('g')
      expect(normalizeUnit('GRAMOS')).toBe('g')
      expect(normalizeUnit('kg')).toBe('kg')
      expect(normalizeUnit('kilo')).toBe('kg')
      expect(normalizeUnit('mg')).toBe('mg')
      expect(normalizeUnit('ml')).toBe('ml')
      expect(normalizeUnit('L')).toBe('l')
      expect(normalizeUnit('litros')).toBe('l')
      expect(normalizeUnit('cucharadita')).toBe('cucharadita')
      expect(normalizeUnit('tsp')).toBe('cucharadita')
      expect(normalizeUnit('tbsp')).toBe('cucharada')
      expect(normalizeUnit('taza')).toBe('taza')
      expect(normalizeUnit('cup')).toBe('taza')
      expect(normalizeUnit('unidades')).toBe('unidades')
      expect(normalizeUnit('piezas')).toBe('piezas')
      expect(normalizeUnit('desconocido')).toBeNull()
    })

    it('identifica dimensiones físicas correctamente', () => {
      expect(getUnitDimension('kg')).toBe('mass')
      expect(getUnitDimension('g')).toBe('mass')
      expect(getUnitDimension('mg')).toBe('mass')
      expect(getUnitDimension('ml')).toBe('volume')
      expect(getUnitDimension('l')).toBe('volume')
      expect(getUnitDimension('taza')).toBe('volume')
      expect(getUnitDimension('cucharada')).toBe('volume')
      expect(getUnitDimension('unidades')).toBe('count')
      expect(getUnitDimension('piezas')).toBe('count')
    })
  })

  describe('Conversiones dentro de la misma dimensión (Masa)', () => {
    it('convierte kg a g y viceversa exactamente', () => {
      const kgToG = convertUnits(1.5, 'kg', 'g')
      expect(kgToG.success).toBe(true)
      if (kgToG.success) expect(kgToG.value).toBe(1500)

      const gToKg = convertUnits(250, 'g', 'kg')
      expect(gToKg.success).toBe(true)
      if (gToKg.success) expect(gToKg.value).toBe(0.25)
    })

    it('convierte g a mg y viceversa', () => {
      const gToMg = convertUnits(2, 'g', 'mg')
      expect(gToMg.success).toBe(true)
      if (gToMg.success) expect(gToMg.value).toBe(2000)

      const mgToG = convertUnits(500, 'mg', 'g')
      expect(mgToG.success).toBe(true)
      if (mgToG.success) expect(mgToG.value).toBe(0.5)
    })

    it('convierte kg a mg directamente', () => {
      const res = convertUnits(0.005, 'kg', 'mg')
      expect(res.success).toBe(true)
      if (res.success) expect(res.value).toBe(5000)
    })
  })

  describe('Conversiones dentro de la misma dimensión (Volumen)', () => {
    it('convierte l a ml y viceversa exactamente', () => {
      const lToMl = convertUnits(0.75, 'l', 'ml')
      expect(lToMl.success).toBe(true)
      if (lToMl.success) expect(lToMl.value).toBe(750)

      const mlToL = convertUnits(1200, 'ml', 'l')
      expect(mlToL.success).toBe(true)
      if (mlToL.success) expect(mlToL.value).toBe(1.2)
    })

    it('convierte medidas culinarias métricas explícitas (taza, cucharada, cucharadita)', () => {
      // 1 taza = 250 ml
      const cupToMl = convertUnits(2, 'taza', 'ml')
      expect(cupToMl.success).toBe(true)
      if (cupToMl.success) expect(cupToMl.value).toBe(500)

      // 1 cucharada = 15 ml
      const tbspToMl = convertUnits(3, 'cucharada', 'ml')
      expect(tbspToMl.success).toBe(true)
      if (tbspToMl.success) expect(tbspToMl.value).toBe(45)

      // 1 cucharadita = 5 ml
      const tspToMl = convertUnits(4, 'cucharadita', 'ml')
      expect(tspToMl.success).toBe(true)
      if (tspToMl.success) expect(tspToMl.value).toBe(20)

      // 1 taza a cucharadas (250 / 15 = 16.6666...)
      const cupToTbsp = convertUnits(1, 'taza', 'cucharada')
      expect(cupToTbsp.success).toBe(true)
      if (cupToTbsp.success) expect(cupToTbsp.value).toBeCloseTo(16.6667, 3)
    })
  })

  describe('Conversiones cruzadas Masa <-> Volumen con densidad explícita', () => {
    // Caso de referencia: Aceite de girasol (densidad ~0.92 g/ml)
    it('convierte ml a g con densidad válida', () => {
      // 500 ml de aceite a 0.92 g/ml = 460 g
      const res = convertUnits(500, 'ml', 'g', { density: 0.92 })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.value).toBe(460)
        expect(res.dimension).toBe('cross_dimension')
      }
    })

    it('convierte g a ml con densidad válida', () => {
      // 460 g de aceite a 0.92 g/ml = 500 ml
      const res = convertUnits(460, 'g', 'ml', { density: 0.92 })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.value).toBeCloseTo(500, 4)
      }
    })

    // Caso de referencia: Miel pura (densidad ~1.42 g/ml)
    it('convierte 1 taza de miel a gramos usando densidad', () => {
      // 1 taza = 250 ml -> 250 * 1.42 = 355 gramos
      const res = convertUnits(1, 'taza', 'g', { density: 1.42 })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.value).toBe(355)
      }
    })

    it('rechaza conversión cruzada si falta la densidad', () => {
      const res = convertUnits(100, 'g', 'ml')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe('MISSING_DENSITY')
        expect(res.message).toContain('requiere especificar la densidad')
      }
    })

    it('rechaza conversión con densidad inválida (cero, negativa o no finita)', () => {
      const zeroDensity = convertUnits(100, 'g', 'ml', { density: 0 })
      expect(zeroDensity.success).toBe(false)
      if (!zeroDensity.success) expect(zeroDensity.error).toBe('INVALID_DENSITY')

      const negDensity = convertUnits(100, 'g', 'ml', { density: -1.2 })
      expect(negDensity.success).toBe(false)
      if (!negDensity.success) expect(negDensity.error).toBe('INVALID_DENSITY')

      const nanDensity = convertUnits(100, 'g', 'ml', { density: NaN })
      expect(nanDensity.success).toBe(false)
      if (!nanDensity.success) expect(nanDensity.error).toBe('INVALID_DENSITY')
    })
  })

  describe('Conteo con peso unitario explícito', () => {
    it('convierte unidades a gramos cuando se define peso unitario', () => {
      // 4 huevos de 60g promedio = 240g
      const res = convertUnits(4, 'unidades', 'g', { pieceWeightGrams: 60 })
      expect(res.success).toBe(true)
      if (res.success) expect(res.value).toBe(240)
    })

    it('convierte gramos a unidades con peso unitario', () => {
      // 300g de huevos a 60g c/u = 5 unidades
      const res = convertUnits(300, 'g', 'unidades', { pieceWeightGrams: 60 })
      expect(res.success).toBe(true)
      if (res.success) expect(res.value).toBe(5)
    })

    it('rechaza conteo a masa si no se provee pieceWeightGrams', () => {
      const res = convertUnits(4, 'unidades', 'g')
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe('INCOMPATIBLE_DIMENSIONS')
    })
  })

  describe('Validación de entradas anómalas y límites', () => {
    it('rechaza valores negativos', () => {
      const res = convertUnits(-50, 'g', 'kg')
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe('INVALID_VALUE')
    })

    it('rechaza valores NaN, Infinity o no numéricos', () => {
      expect(convertUnits(NaN, 'g', 'kg').success).toBe(false)
      expect(convertUnits(Infinity, 'g', 'kg').success).toBe(false)
      expect(convertUnits(-Infinity, 'g', 'kg').success).toBe(false)
      expect(convertUnits('100' as any, 'g', 'kg').success).toBe(false)
    })

    it('rechaza unidades desconocidas', () => {
      const res = convertUnits(10, 'metro' as any, 'kg')
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe('UNKNOWN_UNIT')
    })

    it('permite valor 0 devolviendo 0', () => {
      const res = convertUnits(0, 'kg', 'g')
      expect(res.success).toBe(true)
      if (res.success) expect(res.value).toBe(0)
    })
  })

  describe('Metadatos y documentación de convenciones culinarias', () => {
    it('define explícitamente el sistema métrico para medidas culinarias', () => {
      expect(CULINARY_VOLUME_CONVENTIONS.system).toBe('metric')
      expect(CULINARY_VOLUME_CONVENTIONS.equivalences.taza.ml).toBe(250)
      expect(CULINARY_VOLUME_CONVENTIONS.equivalences.cucharada.ml).toBe(15)
      expect(CULINARY_VOLUME_CONVENTIONS.equivalences.cucharadita.ml).toBe(5)
      expect(CULINARY_VOLUME_CONVENTIONS.note).toContain('250 ml')
    })

    it('describe correctamente unidades reconocidas y desconocidas', () => {
      const gDesc = describeCulinaryUnit('g')
      expect(gDesc.dimension).toBe('mass')
      expect(gDesc.unit).toBe('g')

      const tazaDesc = describeCulinaryUnit('taza')
      expect(tazaDesc.dimension).toBe('volume')
      expect(tazaDesc.description).toContain('250 ml')

      const badDesc = describeCulinaryUnit('yardas')
      expect(badDesc.unit).toBeNull()
      expect(badDesc.dimension).toBeNull()
      expect(badDesc.description).toContain('no reconocida')
    })
  })
})
