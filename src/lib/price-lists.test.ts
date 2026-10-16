import { describe, it, expect } from 'vitest'
import { RoundingRule } from '@/components/tools/generador-listas-precios/types'

function applyRounding(val: number, rule: RoundingRule): number {
  switch (rule) {
    case 'none':
    case 'decimals':
      return Number(val.toFixed(2))
    case 'integer':
      return Math.round(val)
    case 'tens':
      return Math.round(val / 10) * 10
    case 'fifties':
      return Math.round(val / 50) * 50
    case 'hundreds':
      return Math.round(val / 100) * 100
    default:
      return Math.round(val)
  }
}

describe('Generador de Listas de Precios - Reglas de Ajuste Masivo y Redondeo', () => {
  it('aplica incremento porcentual simple sin redondeo', () => {
    const basePrice = 1000
    const percentage = 15
    const newPrice = basePrice * (1 + percentage / 100)
    expect(newPrice).toBe(1150)
  })

  it('aplica descuento porcentual correctamente', () => {
    const basePrice = 2000
    const percentage = 20
    const newPrice = basePrice * (1 - percentage / 100)
    expect(newPrice).toBe(1600)
  })

  it('redondea a números enteros evitando números decimales flotantes irregulares', () => {
    const rawPrice = 1453.3333333333
    expect(applyRounding(rawPrice, 'integer')).toBe(1453)
  })

  it('redondea a la decena más cercana ($10)', () => {
    expect(applyRounding(1453, 'tens')).toBe(1450)
    expect(applyRounding(1457, 'tens')).toBe(1460)
  })

  it('redondea a cincuenta ($50)', () => {
    expect(applyRounding(1420, 'fifties')).toBe(1400)
    expect(applyRounding(1435, 'fifties')).toBe(1450)
    expect(applyRounding(1480, 'fifties')).toBe(1500)
  })

  it('redondea a la centena más cercana ($100)', () => {
    expect(applyRounding(1440, 'hundreds')).toBe(1400)
    expect(applyRounding(1460, 'hundreds')).toBe(1500)
  })

  it('preserva dos decimales con la regla decimals', () => {
    expect(applyRounding(1250.456, 'decimals')).toBe(1250.46)
  })
})
