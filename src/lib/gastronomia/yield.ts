/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * yield.ts: Rendimiento aprovechable, mermas y costos reales de materia prima.
 */

export interface YieldCalculationResult {
  /** Cantidad bruta / comprada (antes de limpieza o proceso) */
  grossQuantity: number
  /** Cantidad neta utilizable en la receta */
  netQuantity: number
  /** Cantidad descartada por merma (gross - net) */
  wasteQuantity: number
  /** Porcentaje de merma sobre el peso comprado (0 <= waste < 100) */
  wastePercentage: number
  /** Porcentaje de rendimiento aprovechable (100 - wastePercentage) */
  yieldPercentage: number
}

export interface NetCostResult {
  /** Precio unitario bruto de compra */
  grossUnitPrice: number
  /** Precio unitario real neto aprovechable */
  netUnitPrice: number
  /** Porcentaje de merma considerado */
  wastePercentage: number
  /** Porcentaje de rendimiento */
  yieldPercentage: number
}

/**
 * Valida que un porcentaje de merma esté dentro del rango físico permitido [0, 100).
 * Una merma de 100% o superior anula cualquier obtención de producto neto útil.
 */
function validateWastePercentage(wastePercentage: number, allowHundredPercent = false): void {
  if (typeof wastePercentage !== 'number' || isNaN(wastePercentage) || !isFinite(wastePercentage)) {
    throw new Error(`El porcentaje de merma debe ser un número finito válido. Se recibió: ${wastePercentage}`)
  }
  if (wastePercentage < 0) {
    throw new Error(`El porcentaje de merma no puede ser negativo. Se recibió: ${wastePercentage}%`)
  }
  if (!allowHundredPercent && wastePercentage >= 100) {
    throw new Error(
      `El porcentaje de merma debe ser estrictamente menor al 100% para calcular la cantidad bruta necesaria. Se recibió: ${wastePercentage}%`
    )
  }
  if (allowHundredPercent && wastePercentage > 100) {
    throw new Error(`El porcentaje de merma no puede exceder el 100%. Se recibió: ${wastePercentage}%`)
  }
}

/**
 * Valida cantidades de peso o volumen.
 */
function validateQuantity(qty: number, name = 'cantidad'): void {
  if (typeof qty !== 'number' || isNaN(qty) || !isFinite(qty) || qty < 0) {
    throw new Error(`La ${name} debe ser un número finito no negativo. Se recibió: ${qty}`)
  }
}

/**
 * Calcula la cantidad bruta a comprar a partir de la cantidad neta necesaria y la merma esperada.
 * Fórmula gastronómica estándar:
 * Cantidad Bruta = Cantidad Neta / (1 - %Merma / 100)
 */
export function calculateGrossFromNet(netQuantity: number, wastePercentage: number): YieldCalculationResult {
  validateQuantity(netQuantity, 'cantidad neta')
  validateWastePercentage(wastePercentage, false)

  if (netQuantity === 0) {
    return {
      grossQuantity: 0,
      netQuantity: 0,
      wasteQuantity: 0,
      wastePercentage,
      yieldPercentage: 100 - wastePercentage,
    }
  }

  const factor = 1 - wastePercentage / 100
  const grossQuantity = netQuantity / factor
  const wasteQuantity = grossQuantity - netQuantity

  return {
    grossQuantity,
    netQuantity,
    wasteQuantity,
    wastePercentage,
    yieldPercentage: 100 - wastePercentage,
  }
}

/**
 * Calcula el rendimiento neto utilizable a partir de una cantidad bruta comprada y la merma.
 * Fórmula gastronómica estándar:
 * Cantidad Neta = Cantidad Bruta * (1 - %Merma / 100)
 */
export function calculateNetFromGross(grossQuantity: number, wastePercentage: number): YieldCalculationResult {
  validateQuantity(grossQuantity, 'cantidad bruta')
  validateWastePercentage(wastePercentage, true)

  const factor = 1 - wastePercentage / 100
  const netQuantity = grossQuantity * factor
  const wasteQuantity = grossQuantity - netQuantity

  return {
    grossQuantity,
    netQuantity,
    wasteQuantity,
    wastePercentage,
    yieldPercentage: 100 - wastePercentage,
  }
}

/**
 * Determina el porcentaje de merma y rendimiento a partir de cantidades bruta y neta medidas.
 */
export function calculateWastePercentage(
  grossQuantity: number,
  netQuantity: number
): { wastePercentage: number; yieldPercentage: number } {
  validateQuantity(grossQuantity, 'cantidad bruta')
  validateQuantity(netQuantity, 'cantidad neta')

  if (grossQuantity === 0) {
    throw new Error('La cantidad bruta debe ser mayor a 0 para calcular el porcentaje de merma.')
  }
  if (netQuantity > grossQuantity) {
    throw new Error(
      `La cantidad neta (${netQuantity}) no puede superar la cantidad bruta inicial (${grossQuantity}).`
    )
  }

  const wasteQuantity = grossQuantity - netQuantity
  const wastePercentage = (wasteQuantity / grossQuantity) * 100
  const yieldPercentage = (netQuantity / grossQuantity) * 100

  return {
    wastePercentage,
    yieldPercentage,
  }
}

/**
 * Calcula el costo unitario neto real considerando la merma del ingrediente.
 * Por ejemplo: si 1 kg de frutillas cuesta $1.000 bruto y rinde un 80% (20% merma),
 * el costo real de cada kg neto utilizable es $1.000 / 0.8 = $1.250.
 */
export function calculateNetUnitCost(grossUnitPrice: number, wastePercentage: number): NetCostResult {
  if (typeof grossUnitPrice !== 'number' || isNaN(grossUnitPrice) || !isFinite(grossUnitPrice) || grossUnitPrice < 0) {
    throw new Error(`El precio unitario bruto debe ser un número no negativo. Se recibió: ${grossUnitPrice}`)
  }
  validateWastePercentage(wastePercentage, false)

  const factor = 1 - wastePercentage / 100
  const netUnitPrice = factor > 0 ? grossUnitPrice / factor : grossUnitPrice

  return {
    grossUnitPrice,
    netUnitPrice,
    wastePercentage,
    yieldPercentage: 100 - wastePercentage,
  }
}
