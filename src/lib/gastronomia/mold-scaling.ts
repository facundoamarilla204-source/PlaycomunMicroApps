/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * mold-scaling.ts: Adaptación geométrica de recetas entre moldes redondos, cuadrados y rectangulares.
 */

import { ScalableRecipe, ScaledRecipeResult, scaleRecipeByFactor } from './scaling'

export interface RoundMold {
  shape: 'round'
  /** Diámetro en centímetros */
  diameter: number
  /** Altura en centímetros (opcional) */
  height?: number
}

export interface SquareMold {
  shape: 'square'
  /** Lado en centímetros */
  side: number
  /** Altura en centímetros (opcional) */
  height?: number
}

export interface RectangularMold {
  shape: 'rectangular'
  /** Largo en centímetros */
  length: number
  /** Ancho en centímetros */
  width: number
  /** Altura en centímetros (opcional) */
  height?: number
}

export type Mold = RoundMold | SquareMold | RectangularMold

export interface MoldScalingResult {
  scaleFactor: number
  sourceArea: number
  targetArea: number
  sourceVolume?: number
  targetVolume?: number
  calculationBasis: 'area' | 'volume'
  heightPreserved: boolean
  bakingNote: string
}

export interface MoldScalingOptions {
  /**
   * Si es true y ambos moldes definen altura, calcula la escala por relación de volúmenes.
   * Si es false (por defecto), calcula por relación de áreas conservando el espesor/altura final de la pieza.
   */
  considerHeight?: boolean
  /** Si debe escalar costos adicionales */
  scaleAdditionalCosts?: boolean
}

const BAKING_NOTE_AREA =
  'El cálculo se basa en la relación de áreas para conservar la altura original de la preparación. Nota técnica: si el diámetro o masa total varía significativamente, verificá el punto de cocción ya que la distribución térmica puede variar.'

const BAKING_NOTE_VOLUME =
  'El cálculo se basa en la relación de volúmenes considerando las alturas indicadas. Advertencia de pastelería: una preparación con mayor profundidad modificará el centro térmico y requerirá ajustar tiempos y temperaturas de horneado.'

/**
 * Valida dimensiones físicas de un molde.
 */
function validateDimension(val: number, name: string): void {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val) || val <= 0) {
    throw new Error(`La dimensión '${name}' del molde debe ser un número finito mayor a 0. Se recibió: ${val}`)
  }
}

/**
 * Calcula el área de la base del molde en cm².
 */
export function calculateMoldArea(mold: Mold): number {
  if (!mold || !mold.shape) {
    throw new Error('Molde inválido o forma no especificada.')
  }

  switch (mold.shape) {
    case 'round': {
      validateDimension(mold.diameter, 'diámetro')
      const radius = mold.diameter / 2
      return Math.PI * radius * radius
    }
    case 'square': {
      validateDimension(mold.side, 'lado')
      return mold.side * mold.side
    }
    case 'rectangular': {
      validateDimension(mold.length, 'largo')
      validateDimension(mold.width, 'ancho')
      return mold.length * mold.width
    }
    default:
      throw new Error(`Forma de molde desconocida: ${(mold as any).shape}`)
  }
}

/**
 * Calcula el volumen del molde en cm³ (ml) si tiene altura definida.
 */
export function calculateMoldVolume(mold: Mold): number | null {
  const area = calculateMoldArea(mold)
  if (mold.height === undefined || mold.height === null) return null
  validateDimension(mold.height, 'altura')
  return area * mold.height
}

/**
 * Calcula el factor de ajuste matemático entre dos moldes.
 */
export function calculateMoldScaleFactor(
  sourceMold: Mold,
  targetMold: Mold,
  options?: MoldScalingOptions
): MoldScalingResult {
  const sourceArea = calculateMoldArea(sourceMold)
  const targetArea = calculateMoldArea(targetMold)

  const sourceVol = calculateMoldVolume(sourceMold)
  const targetVol = calculateMoldVolume(targetMold)

  const canUseVolume =
    options?.considerHeight === true &&
    sourceVol !== null &&
    targetVol !== null &&
    sourceMold.height !== undefined &&
    targetMold.height !== undefined

  if (canUseVolume) {
    const scaleFactor = targetVol / sourceVol
    return {
      scaleFactor,
      sourceArea,
      targetArea,
      sourceVolume: sourceVol,
      targetVolume: targetVol,
      calculationBasis: 'volume',
      heightPreserved: false,
      bakingNote: BAKING_NOTE_VOLUME,
    }
  }

  // Por defecto: relación de áreas (conserva altura de horneado)
  const scaleFactor = targetArea / sourceArea
  return {
    scaleFactor,
    sourceArea,
    targetArea,
    sourceVolume: sourceVol ?? undefined,
    targetVolume: targetVol ?? undefined,
    calculationBasis: 'area',
    heightPreserved: true,
    bakingNote: BAKING_NOTE_AREA,
  }
}

/**
 * Escala una receta completa adaptándola a las dimensiones de un nuevo molde.
 */
export function scaleRecipeForMold(
  recipe: ScalableRecipe,
  sourceMold: Mold,
  targetMold: Mold,
  options?: MoldScalingOptions
): ScaledRecipeResult & { moldScaling: MoldScalingResult } {
  const moldScaling = calculateMoldScaleFactor(sourceMold, targetMold, options)
  const scaled = scaleRecipeByFactor(recipe, moldScaling.scaleFactor, {
    scaleAdditionalCosts: options?.scaleAdditionalCosts,
  })

  return {
    ...scaled,
    moldScaling,
  }
}
