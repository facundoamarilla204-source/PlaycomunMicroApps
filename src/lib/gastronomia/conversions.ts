/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * conversions.ts: Conversiones dimensionales seguras, exactas y tipadas.
 */

export type MassUnit = 'mg' | 'g' | 'kg'
export type VolumeUnit = 'ml' | 'l' | 'cucharadita' | 'cucharada' | 'taza'
export type CountUnit = 'unidades' | 'piezas'

export type CulinaryUnit = MassUnit | VolumeUnit | CountUnit
export type UnitDimension = 'mass' | 'volume' | 'count'

/** Factores de masa respecto al gramo (g) */
export const MASS_FACTORS_TO_GRAM: Record<MassUnit, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
}

/**
 * Factores de volumen respecto al mililitro (ml).
 * Convención predeterminada: Sistema Métrico Decimal Gastronómico (utilizado en Latinoamérica y el estándar internacional).
 * 1 cucharadita (tsp) = 5 ml
 * 1 cucharada (tbsp) = 15 ml
 * 1 taza métrica (cup) = 250 ml
 */
export const VOLUME_FACTORS_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  cucharadita: 5,
  cucharada: 15,
  taza: 250,
}

/**
 * Metadatos documentados de la convención de medidas caseras/culinarias.
 * Aclara que no son equivalencias universales idénticas en todos los países
 * (ej. US Customary Cup equivale a 236.59 ml o 240 ml legal).
 */
export const CULINARY_VOLUME_CONVENTIONS = {
  system: 'metric',
  name: 'Sistema Métrico Estándar (Latinoamérica, Argentina, Commonwealth)',
  equivalences: {
    cucharadita: { ml: 5, label: 'Cucharadita métrica (5 ml / ~1 cdta)' },
    cucharada: { ml: 15, label: 'Cucharada métrica (15 ml / ~1 cda / 3 cdtas)' },
    taza: { ml: 250, label: 'Taza métrica estándar (250 ml)' },
  },
  note: 'Esta biblioteca adopta la taza métrica de 250 ml. En recetas anglosajonas con tazas US Customary (236,59 ml) o US Legal (240 ml), debe tenerse en cuenta la variación del ~4-5%.',
} as const

export type ConversionErrorCode =
  | 'INVALID_VALUE'
  | 'UNKNOWN_UNIT'
  | 'INCOMPATIBLE_DIMENSIONS'
  | 'MISSING_DENSITY'
  | 'INVALID_DENSITY'

export type ConversionResult =
  | {
      success: true
      value: number
      from: CulinaryUnit
      to: CulinaryUnit
      dimension: UnitDimension | 'cross_dimension'
    }
  | {
      success: false
      error: ConversionErrorCode
      message: string
      from: string
      to: string
      value: number
    }

export interface ConversionOptions {
  /** Densidad del ingrediente en g/ml (g/cm³). Requerida para masa <-> volumen */
  density?: number
  /** Peso en gramos de 1 unidad/pieza. Requerido para masa <-> conteo */
  pieceWeightGrams?: number
}

/**
 * Normaliza strings de unidad a su identificador canónico.
 */
export function normalizeUnit(rawUnit: string): CulinaryUnit | null {
  if (!rawUnit || typeof rawUnit !== 'string') return null
  const cleaned = rawUnit.trim().toLowerCase()
  switch (cleaned) {
    case 'g':
    case 'gr':
    case 'gramo':
    case 'gramos':
      return 'g'
    case 'kg':
    case 'kilo':
    case 'kilos':
    case 'kilogramo':
    case 'kilogramos':
      return 'kg'
    case 'mg':
    case 'miligramo':
    case 'miligramos':
      return 'mg'
    case 'ml':
    case 'mililitro':
    case 'mililitros':
      return 'ml'
    case 'l':
    case 'litro':
    case 'litros':
      return 'l'
    case 'cucharadita':
    case 'cucharaditas':
    case 'tsp':
      return 'cucharadita'
    case 'cucharada':
    case 'cucharadas':
    case 'tbsp':
      return 'cucharada'
    case 'taza':
    case 'tazas':
    case 'cup':
    case 'cups':
      return 'taza'
    case 'unidades':
    case 'unidad':
    case 'un':
    case 'u':
      return 'unidades'
    case 'piezas':
    case 'pieza':
    case 'pz':
      return 'piezas'
    default:
      return null
  }
}

/**
 * Determina la dimensión física de una unidad culinaria.
 */
export function getUnitDimension(unit: CulinaryUnit): UnitDimension {
  if (unit in MASS_FACTORS_TO_GRAM) return 'mass'
  if (unit in VOLUME_FACTORS_TO_ML) return 'volume'
  return 'count'
}

/**
 * Convierte un valor entre dos unidades culinarias garantizando integridad dimensional.
 * No asume densidades de 1 ni realiza conversiones silenciosas arbitrarias.
 */
export function convertUnits(
  value: number,
  fromUnitRaw: string,
  toUnitRaw: string,
  options?: ConversionOptions
): ConversionResult {
  // Validación de valor numérico
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value) || value < 0) {
    return {
      success: false,
      error: 'INVALID_VALUE',
      message: `El valor a convertir debe ser un número finito no negativo. Se recibió: ${value}`,
      from: fromUnitRaw,
      to: toUnitRaw,
      value,
    }
  }

  const from = normalizeUnit(fromUnitRaw)
  const to = normalizeUnit(toUnitRaw)

  if (!from || !to) {
    return {
      success: false,
      error: 'UNKNOWN_UNIT',
      message: `Unidad no reconocida: ${!from ? fromUnitRaw : toUnitRaw}`,
      from: fromUnitRaw,
      to: toUnitRaw,
      value,
    }
  }

  // Mismo identificador normalizado
  if (from === to) {
    return {
      success: true,
      value,
      from,
      to,
      dimension: getUnitDimension(from),
    }
  }

  const fromDim = getUnitDimension(from)
  const toDim = getUnitDimension(to)

  // Caso 1: Misma dimensión Masa <-> Masa
  if (fromDim === 'mass' && toDim === 'mass') {
    const valueInGrams = value * MASS_FACTORS_TO_GRAM[from as MassUnit]
    const convertedValue = valueInGrams / MASS_FACTORS_TO_GRAM[to as MassUnit]
    return {
      success: true,
      value: convertedValue,
      from,
      to,
      dimension: 'mass',
    }
  }

  // Caso 2: Misma dimensión Volumen <-> Volumen
  if (fromDim === 'volume' && toDim === 'volume') {
    const valueInMl = value * VOLUME_FACTORS_TO_ML[from as VolumeUnit]
    const convertedValue = valueInMl / VOLUME_FACTORS_TO_ML[to as VolumeUnit]
    return {
      success: true,
      value: convertedValue,
      from,
      to,
      dimension: 'volume',
    }
  }

  // Caso 3: Conteo <-> Conteo (unidades <-> piezas)
  if (fromDim === 'count' && toDim === 'count') {
    return {
      success: true,
      value,
      from,
      to,
      dimension: 'count',
    }
  }

  // Caso 4: Masa <-> Volumen (Requiere densidad en g/ml)
  if ((fromDim === 'mass' && toDim === 'volume') || (fromDim === 'volume' && toDim === 'mass')) {
    const density = options?.density
    if (density === undefined || density === null) {
      return {
        success: false,
        error: 'MISSING_DENSITY',
        message: `La conversión entre masa (${from}) y volumen (${to}) requiere especificar la densidad del ingrediente (g/ml).`,
        from: fromUnitRaw,
        to: toUnitRaw,
        value,
      }
    }
    if (typeof density !== 'number' || isNaN(density) || !isFinite(density) || density <= 0) {
      return {
        success: false,
        error: 'INVALID_DENSITY',
        message: `La densidad debe ser un número positivo mayor a 0 g/ml. Se recibió: ${density}`,
        from: fromUnitRaw,
        to: toUnitRaw,
        value,
      }
    }

    if (fromDim === 'mass' && toDim === 'volume') {
      // Masa -> Volumen: gramos / densidad = ml
      const valueInGrams = value * MASS_FACTORS_TO_GRAM[from as MassUnit]
      const ml = valueInGrams / density
      const convertedValue = ml / VOLUME_FACTORS_TO_ML[to as VolumeUnit]
      return {
        success: true,
        value: convertedValue,
        from,
        to,
        dimension: 'cross_dimension',
      }
    } else {
      // Volumen -> Masa: ml * densidad = gramos
      const valueInMl = value * VOLUME_FACTORS_TO_ML[from as VolumeUnit]
      const grams = valueInMl * density
      const convertedValue = grams / MASS_FACTORS_TO_GRAM[to as MassUnit]
      return {
        success: true,
        value: convertedValue,
        from,
        to,
        dimension: 'cross_dimension',
      }
    }
  }

  // Caso 5: Conteo <-> Masa con peso unitario explícito
  if (options?.pieceWeightGrams && options.pieceWeightGrams > 0) {
    if (fromDim === 'count' && toDim === 'mass') {
      const grams = value * options.pieceWeightGrams
      const convertedValue = grams / MASS_FACTORS_TO_GRAM[to as MassUnit]
      return {
        success: true,
        value: convertedValue,
        from,
        to,
        dimension: 'cross_dimension',
      }
    }
    if (fromDim === 'mass' && toDim === 'count') {
      const grams = value * MASS_FACTORS_TO_GRAM[from as MassUnit]
      const pieces = grams / options.pieceWeightGrams
      return {
        success: true,
        value: pieces,
        from,
        to,
        dimension: 'cross_dimension',
      }
    }
  }

  // En cualquier otro caso, dimensiones incompatibles
  return {
    success: false,
    error: 'INCOMPATIBLE_DIMENSIONS',
    message: `No es posible convertir entre dimensiones incompatibles: ${fromDim} (${from}) y ${toDim} (${to}) sin datos complementarios.`,
    from: fromUnitRaw,
    to: toUnitRaw,
    value,
  }
}

/**
 * Provee una descripción legible y dimensional de una unidad culinaria.
 */
export function describeCulinaryUnit(unitRaw: string): {
  unit: CulinaryUnit | null
  dimension: UnitDimension | null
  description: string
} {
  const norm = normalizeUnit(unitRaw)
  if (!norm) {
    return {
      unit: null,
      dimension: null,
      description: `Unidad no reconocida: '${unitRaw}'`,
    }
  }

  const dim = getUnitDimension(norm)
  switch (norm) {
    case 'mg':
      return { unit: norm, dimension: dim, description: 'Miligramo (0.001 g, masa)' }
    case 'g':
      return { unit: norm, dimension: dim, description: 'Gramo (unidad base de masa)' }
    case 'kg':
      return { unit: norm, dimension: dim, description: 'Kilogramo (1000 g, masa)' }
    case 'ml':
      return { unit: norm, dimension: dim, description: 'Mililitro (unidad base de volumen)' }
    case 'l':
      return { unit: norm, dimension: dim, description: 'Litro (1000 ml, volumen)' }
    case 'cucharadita':
      return { unit: norm, dimension: dim, description: 'Cucharadita métrica estándar (5 ml, volumen)' }
    case 'cucharada':
      return { unit: norm, dimension: dim, description: 'Cucharada métrica estándar (15 ml, volumen)' }
    case 'taza':
      return { unit: norm, dimension: dim, description: 'Taza métrica estándar (250 ml, volumen métrico)' }
    case 'unidades':
      return { unit: norm, dimension: dim, description: 'Unidades enteras (conteo)' }
    case 'piezas':
      return { unit: norm, dimension: dim, description: 'Piezas enteras (conteo)' }
  }
}

