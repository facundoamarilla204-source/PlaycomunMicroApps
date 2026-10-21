import { describe, it, expect } from 'vitest'
import {
  calculateGrossFromNet,
  calculateNetFromGross,
  calculateWastePercentage,
  calculateNetUnitCost,
} from '../yield'

describe('Gastronomía: Rendimiento y Merma', () => {
  describe('calculateGrossFromNet (Cantidad bruta necesaria)', () => {
    it('calcula la cantidad bruta requerida con merma del 20%', () => {
      // Caso de referencia de la especificación:
      // Si se necesitan 1.000g netos y la merma es 20%:
      // Cantidad bruta = 1.000 / (1 - 0.20) = 1.000 / 0.8 = 1.250g
      const res = calculateGrossFromNet(1000, 20)
      expect(res.grossQuantity).toBe(1250)
      expect(res.netQuantity).toBe(1000)
      expect(res.wasteQuantity).toBe(250)
      expect(res.wastePercentage).toBe(20)
      expect(res.yieldPercentage).toBe(80)
    })

    it('calcula correctamente con merma 0%', () => {
      const res = calculateGrossFromNet(500, 0)
      expect(res.grossQuantity).toBe(500)
      expect(res.wasteQuantity).toBe(0)
      expect(res.yieldPercentage).toBe(100)
    })

    it('rechaza merma del 100% o superior (división por cero físico)', () => {
      expect(() => calculateGrossFromNet(1000, 100)).toThrow(/estrictamente menor al 100%/)
      expect(() => calculateGrossFromNet(1000, 105)).toThrow(/estrictamente menor al 100%/)
    })

    it('rechaza porcentajes negativos o valores no finitos', () => {
      expect(() => calculateGrossFromNet(1000, -5)).toThrow(/no puede ser negativo/)
      expect(() => calculateGrossFromNet(1000, NaN)).toThrow(/número finito/)
      expect(() => calculateGrossFromNet(NaN, 20)).toThrow(/número finito/)
      expect(() => calculateGrossFromNet(-500, 20)).toThrow(/no negativo/)
    })

    it('maneja cantidad neta de 0 devolviendo 0', () => {
      const res = calculateGrossFromNet(0, 25)
      expect(res.grossQuantity).toBe(0)
      expect(res.wasteQuantity).toBe(0)
    })
  })

  describe('calculateNetFromGross (Rendimiento neto a partir de peso bruto)', () => {
    it('calcula el peso neto a partir de 1.250g comprados con 20% de merma', () => {
      // Sentido inverso del caso anterior:
      // 1.250g * (1 - 0.20) = 1.250 * 0.8 = 1.000g netos
      const res = calculateNetFromGross(1250, 20)
      expect(res.netQuantity).toBe(1000)
      expect(res.grossQuantity).toBe(1250)
      expect(res.wasteQuantity).toBe(250)
      expect(res.yieldPercentage).toBe(80)
    })

    it('permite merma del 100% en peso bruto (ej. pérdida total, producto arruinado)', () => {
      const res = calculateNetFromGross(1000, 100)
      expect(res.netQuantity).toBe(0)
      expect(res.wasteQuantity).toBe(1000)
      expect(res.yieldPercentage).toBe(0)
    })

    it('rechaza merma negativa o mayor a 100%', () => {
      expect(() => calculateNetFromGross(1000, -10)).toThrow(/no puede ser negativo/)
      expect(() => calculateNetFromGross(1000, 101)).toThrow(/no puede exceder el 100%/)
    })
  })

  describe('calculateWastePercentage (Medición de merma y rendimiento)', () => {
    it('calcula 20% de merma y 80% de rendimiento para 1.250g brutos y 1.000g netos', () => {
      const res = calculateWastePercentage(1250, 1000)
      expect(res.wastePercentage).toBe(20)
      expect(res.yieldPercentage).toBe(80)
    })

    it('rechaza si neto es mayor que bruto', () => {
      expect(() => calculateWastePercentage(500, 600)).toThrow(/no puede superar la cantidad bruta/)
    })

    it('rechaza si bruto es 0', () => {
      expect(() => calculateWastePercentage(0, 0)).toThrow(/mayor a 0/)
    })
  })

  describe('calculateNetUnitCost (Costo unitario real considerando merma)', () => {
    it('ajusta el costo unitario según el rendimiento aprovechable', () => {
      // Manzanas compradas a $1.000/kg con 25% de merma (corazones, piel)
      // Costo real aprovechable: $1.000 / 0.75 = $1.333,33
      const res = calculateNetUnitCost(1000, 25)
      expect(res.netUnitPrice).toBeCloseTo(1333.33, 2)
      expect(res.grossUnitPrice).toBe(1000)
      expect(res.wastePercentage).toBe(25)
      expect(res.yieldPercentage).toBe(75)
    })

    it('rechaza precio negativo o merma del 100%', () => {
      expect(() => calculateNetUnitCost(-100, 20)).toThrow(/no negativo/)
      expect(() => calculateNetUnitCost(1000, 100)).toThrow(/menor al 100%/)
    })
  })
})
