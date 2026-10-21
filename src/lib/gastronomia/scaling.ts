/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * scaling.ts: Escalado proporcional e inmutable de recetas por factor, porciones, unidades y peso objetivo.
 */

import { convertUnits, normalizeUnit, MassUnit } from './conversions'

export interface ScalableIngredient {
  id?: string
  name: string
  quantity: number
  unit: string
  density?: number
  pieceWeightGrams?: number
  isScalable?: boolean
  reference_quantity?: number
  reference_unit?: any
  reference_price?: number
  [key: string]: any
}

export interface ScalableAdditionalCost {
  id?: string
  name: string
  amount: number
  isScalable?: boolean
  [key: string]: any
}

export interface ScalableRecipe {
  id?: string
  name: string
  yield_quantity: number
  yield_unit: string
  ingredients: ScalableIngredient[]
  additional_costs?: ScalableAdditionalCost[]
  [key: string]: any
}

export interface ScaledIngredient extends ScalableIngredient {
  original_quantity: number
  mathematical_quantity: number
  practical_quantity: number
}

export interface ScaledRecipeResult {
  scaleFactor: number
  originalYield: number
  targetYield: number
  yieldUnit: string
  scaledRecipe: ScalableRecipe & {
    ingredients: ScaledIngredient[]
  }
  totalScaledWeightGrams?: number
  scalingMode: 'factor' | 'portions' | 'units' | 'target_weight'
}

export interface ScalingOptions {
  /** Si debe escalar también los costos adicionales (por defecto false) */
  scaleAdditionalCosts?: boolean
  /** Criterio de redondeo práctico para compras/producción (por defecto ceiling para unidades enteras) */
  calculatePracticalQuantities?: boolean
}

/**
 * Redondea cantidades prácticas de producción sin truncar la precisión matemática interna.
 */
export function calculatePracticalQuantity(exactQuantity: number, unitRaw: string): number {
  const normalized = normalizeUnit(unitRaw)
  if (normalized === 'unidades' || normalized === 'piezas') {
    // Para unidades (ej. huevos), redondear al entero superior si hay fracción residual práctica
    return Math.ceil(exactQuantity)
  }
  if (normalized === 'g' || normalized === 'ml') {
    // En gramos o ml, redondear a 1 decimal
    return Math.round(exactQuantity * 10) / 10
  }
  if (normalized === 'kg' || normalized === 'l') {
    // En kg o litros, redondear a 3 decimales (precisión al gramo/ml)
    return Math.round(exactQuantity * 1000) / 1000
  }
  return Math.round(exactQuantity * 100) / 100
}

/**
 * Formatea una cantidad culinaria para visualización limpia sin ruido de punto flotante.
 */
export function formatCulinaryQuantity(value: number, maxDecimals = 2): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return '0'
  const rounded = Number(value.toFixed(maxDecimals))
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: maxDecimals,
  }).format(rounded)
}

/**
 * Valida un factor de escala positivo y finito.
 */
function validateFactor(factor: number): void {
  if (typeof factor !== 'number' || isNaN(factor) || !isFinite(factor) || factor <= 0) {
    throw new Error(`El factor de escala debe ser un número finito estrictamente mayor a cero. Se recibió: ${factor}`)
  }
}

/**
 * Escala una receta inmutablemente mediante un factor de escala explícito.
 */
export function scaleRecipeByFactor(
  recipe: ScalableRecipe,
  factor: number,
  options?: ScalingOptions
): ScaledRecipeResult {
  validateFactor(factor)

  if (!recipe || !Array.isArray(recipe.ingredients)) {
    throw new Error('La receta no tiene un formato válido o carece del array de ingredientes.')
  }

  const originalYield = Number(recipe.yield_quantity) > 0 ? Number(recipe.yield_quantity) : 1
  const targetYield = originalYield * factor

  let totalScaledWeightGrams = 0
  let hasWeightIngredients = false

  const scaledIngredients: ScaledIngredient[] = recipe.ingredients.map((ing) => {
    const originalQty = Number(ing.quantity) || 0
    const shouldScale = ing.isScalable !== false
    const mathematicalQty = shouldScale ? originalQty * factor : originalQty
    const practicalQty = calculatePracticalQuantity(mathematicalQty, ing.unit)

    // Acumular peso si es cuantificable en masa o convertible
    const conversionToG = convertUnits(mathematicalQty, ing.unit, 'g', {
      density: ing.density,
      pieceWeightGrams: ing.pieceWeightGrams,
    })
    if (conversionToG.success) {
      totalScaledWeightGrams += conversionToG.value
      hasWeightIngredients = true
    }

    return {
      ...ing,
      original_quantity: originalQty,
      mathematical_quantity: mathematicalQty,
      practical_quantity: practicalQty,
      quantity: mathematicalQty, // Mantiene la precisión matemática en el campo principal
    }
  })

  const scaledAdditionalCosts = (recipe.additional_costs || []).map((cost) => {
    const origAmount = Number(cost.amount) || 0
    const scaleCost = options?.scaleAdditionalCosts && cost.isScalable !== false
    return {
      ...cost,
      amount: scaleCost ? origAmount * factor : origAmount,
    }
  })

  return {
    scaleFactor: factor,
    originalYield,
    targetYield,
    yieldUnit: recipe.yield_unit || 'unidades',
    scaledRecipe: {
      ...recipe,
      yield_quantity: targetYield,
      ingredients: scaledIngredients,
      additional_costs: scaledAdditionalCosts,
    },
    totalScaledWeightGrams: hasWeightIngredients ? totalScaledWeightGrams : undefined,
    scalingMode: 'factor',
  }
}

/**
 * Escala una receta a partir de un rendimiento objetivo de porciones.
 * Fórmula: factor = rendimiento objetivo / rendimiento original
 */
export function scaleRecipeByYield(
  recipe: ScalableRecipe,
  targetYield: number,
  targetYieldUnit?: string,
  options?: ScalingOptions
): ScaledRecipeResult {
  if (typeof targetYield !== 'number' || isNaN(targetYield) || !isFinite(targetYield) || targetYield <= 0) {
    throw new Error(`El rendimiento objetivo debe ser mayor a 0. Se recibió: ${targetYield}`)
  }

  const originalYield = Number(recipe.yield_quantity)
  if (typeof originalYield !== 'number' || isNaN(originalYield) || !isFinite(originalYield) || originalYield <= 0) {
    throw new Error(`El rendimiento original de la receta debe ser mayor a 0. Se recibió: ${originalYield}`)
  }

  // Validación de compatibilidad de unidades de rendimiento si se especifica
  if (targetYieldUnit && recipe.yield_unit) {
    const normTarget = normalizeUnit(targetYieldUnit) ?? targetYieldUnit.trim().toLowerCase()
    const normOrig = normalizeUnit(recipe.yield_unit) ?? recipe.yield_unit.trim().toLowerCase()
    if (normTarget !== normOrig) {
      throw new Error(
        `La unidad del rendimiento objetivo ('${targetYieldUnit}') no coincide con la unidad original ('${recipe.yield_unit}').`
      )
    }
  }

  const factor = targetYield / originalYield
  const result = scaleRecipeByFactor(recipe, factor, options)

  return {
    ...result,
    targetYield,
    yieldUnit: targetYieldUnit || recipe.yield_unit,
    scalingMode: 'portions',
  }
}

/**
 * Escala una receta a partir de una cantidad objetivo de piezas o unidades.
 */
export function scaleRecipeByUnits(
  recipe: ScalableRecipe,
  targetUnits: number,
  options?: ScalingOptions
): ScaledRecipeResult {
  const result = scaleRecipeByYield(recipe, targetUnits, 'unidades', options)
  return {
    ...result,
    scalingMode: 'units',
  }
}

/**
 * Escala una receta para alcanzar un peso final objetivo de masa/elaboración.
 */
export function scaleRecipeByTargetWeight(
  recipe: ScalableRecipe,
  targetWeightValue: number,
  targetWeightUnit: MassUnit = 'g',
  options?: ScalingOptions
): ScaledRecipeResult {
  if (
    typeof targetWeightValue !== 'number' ||
    isNaN(targetWeightValue) ||
    !isFinite(targetWeightValue) ||
    targetWeightValue <= 0
  ) {
    throw new Error(`El peso objetivo debe ser mayor a 0. Se recibió: ${targetWeightValue}`)
  }

  // Convertir peso objetivo a gramos
  const targetConversion = convertUnits(targetWeightValue, targetWeightUnit, 'g')
  if (!targetConversion.success) {
    throw new Error(`Unidad de peso objetivo inválida: ${targetWeightUnit}`)
  }
  const targetGrams = targetConversion.value

  // Calcular peso total original de ingredientes en gramos
  let totalOriginalGrams = 0
  let quantifiableIngredientsCount = 0
  const unquantifiableIngredients: string[] = []

  for (const ing of recipe.ingredients || []) {
    const qty = Number(ing.quantity) || 0
    if (qty <= 0) continue

    const conv = convertUnits(qty, ing.unit, 'g', {
      density: ing.density,
      pieceWeightGrams: ing.pieceWeightGrams,
    })

    if (conv.success) {
      totalOriginalGrams += conv.value
      quantifiableIngredientsCount++
    } else if (ing.isScalable !== false) {
      unquantifiableIngredients.push(`'${ing.name || 'Sin nombre'}' (${qty} ${ing.unit})`)
    }
  }

  if (unquantifiableIngredients.length > 0) {
    throw new Error(
      `No es posible escalar por peso objetivo porque la receta contiene ingredientes escalables que no pueden convertirse a masa (falta densidad para volumen o peso unitario para piezas): ${unquantifiableIngredients.join(
        ', '
      )}. Para un escalado por peso confiable, todos los componentes deben tener masa conocida.`
    )
  }

  if (totalOriginalGrams <= 0 || quantifiableIngredientsCount === 0) {
    throw new Error(
      'La receta no contiene ingredientes cuantificables en masa (o con densidad/peso unitario) para calcular el escalado por peso objetivo.'
    )
  }

  const factor = targetGrams / totalOriginalGrams
  const result = scaleRecipeByFactor(recipe, factor, options)

  return {
    ...result,
    scalingMode: 'target_weight',
  }
}
