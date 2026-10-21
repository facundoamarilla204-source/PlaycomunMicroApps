/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * bakers-percentage.ts: Porcentajes panaderos, formulaciones e hidratación profesional.
 */

/**
 * Tabla referencial de estimaciones empíricas de contenido de agua en ingredientes culinarios comunes.
 * Fuente: Criterios técnicos bromatológicos (USDA FoodData Central / INDEC).
 * ADVERTENCIA TÉCNICA: Estos valores son estimaciones referenciales y NO representan constantes
 * físicas universales. La composición real de la leche, huevos o manteca varía según origen,
 * tenor graso y manufactura. La aplicación permite sobreescribir estos coeficientes.
 */
export const EMPIRICAL_WATER_ESTIMATES_TABLE: Record<string, number> = {
  agua: 1.0,
  water: 1.0,
  leche: 0.9, // ~88-90% agua según tenor graso
  milk: 0.9,
  leche_entera: 0.88,
  leche_descremada: 0.91,
  huevo: 0.75, // ~74-76% agua en huevo entero crudo
  huevos: 0.75,
  egg: 0.75,
  eggs: 0.75,
  clara: 0.88, // ~88% agua
  claras: 0.88,
  yema: 0.5, // ~50% agua
  yemas: 0.5,
  cerveza: 0.92,
  vino: 0.88,
  manteca: 0.16, // La manteca comercial contiene típicamente 16% de agua emulsionada y 82% de lípidos
  butter: 0.16,
  aceite: 0.0, // Lípidos 100% puros (sin agua)
  oil: 0.0,
}

/** Alias de compatibilidad */
export const DEFAULT_WATER_CONTENT_RATIOS = EMPIRICAL_WATER_ESTIMATES_TABLE

export interface PrefermentSpec {
  name?: string
  /** Peso total del prefermento / masa madre en gramos */
  totalWeightGrams: number
  /**
   * Porcentaje de hidratación del prefermento (ej. 100% para masa madre 1:1 o poolish, 50-60% para biga).
   * Por defecto 100%.
   */
  hydrationPercentage?: number
  /**
   * Si es true, el usuario ya incluyó la harina y el agua del prefermento en la lista de ingredientes principal.
   * Si es false (por defecto), la función descompone el prefermento y suma su harina y agua al balance total.
   */
  alreadyIncludedInBaseIngredients?: boolean
}

export interface PrefermentDecomposition {
  prefermentName: string
  totalWeightGrams: number
  hydrationPercentage: number
  flourGrams: number
  waterGrams: number
  alreadyIncludedInBaseIngredients: boolean
  note: string
}

export interface BakerIngredientInput {
  id?: string
  name: string
  weightGrams: number
  isFlour?: boolean
  /** Si es true, se contabiliza como agua pura para la hidratación tradicional */
  isWater?: boolean
  isLiquid?: boolean
  /** Proporción de agua entre 0 y 1 (ej: 1.0 para agua, 0.90 para leche). Si no se indica, se infiere por nombre */
  waterRatio?: number
}

export interface BakerIngredientCalculated {
  id?: string
  name: string
  weightGrams: number
  isFlour: boolean
  /** Porcentaje respecto al total de harina (la harina total siempre suma 100%) */
  bakersPercentage: number
  /** Si es harina, su cuota parte porcentual sobre el mix total de harinas */
  shareOfTotalFlour?: number
  /** Gramos efectivos de agua que aporta a la masa */
  effectiveWaterGrams: number
}

export interface BakerFormulaResult {
  /** Peso total de harinas en gramos (base 100%) */
  totalFlourWeightGrams: number
  /** Peso total de la masa en gramos */
  totalDoughWeightGrams: number
  /**
   * Hidratación panadera tradicional y canónica:
   * Relación porcentual estricta entre el agua pura añadida y la harina total de referencia.
   * Fórmula: (Agua pura en gramos / Harina total en gramos) * 100
   */
  traditionalHydrationPercentage: number
  /**
   * Aporte de agua total estimado:
   * Estimación técnica que considera agua pura + agua contenida en leche, huevos u otros líquidos.
   * Aclaración: Es una aproximación empírica y NO la definición tradicional de hidratación.
   */
  estimatedTotalWaterPercentage: number
  /** Gramos de agua pura añadidos directamente */
  pureWaterGrams: number
  /** Gramos de agua adicionales aportados por otros líquidos (leche, huevo, etc.) */
  estimatedWaterFromLiquidsGrams: number
  /** Total de agua efectiva (pura + estimada) */
  totalEffectiveWaterGrams: number
  /** Alias de compatibilidad hacia traditionalHydrationPercentage */
  hydrationPercentage: number
  /** Alias de compatibilidad hacia traditionalHydrationPercentage */
  pureWaterHydrationPercentage: number
  /** Desglose de cada ingrediente */
  ingredients: BakerIngredientCalculated[]
  /** Detalle del prefermento / masa madre si fue provisto */
  prefermentContribution?: PrefermentDecomposition
}

export interface BakerPercentageSpec {
  id?: string
  name: string
  /** Porcentaje respecto a la harina total (100) */
  bakersPercentage: number
  isFlour?: boolean
  isLiquid?: boolean
  waterRatio?: number
}

export interface BakerCalculationOptions {
  /** Coeficientes de contenido acuoso personalizados para sobreescribir la tabla empírica */
  customWaterRatios?: Record<string, number>
  /** Detalle opcional de prefermento / masa madre para su correcta descomposición */
  preferment?: PrefermentSpec
}

/**
 * Descompone un prefermento o masa madre en sus partes de harina y agua según su hidratación.
 * Fórmula:
 * Harina = Peso Prefermento / (1 + Hidratación% / 100)
 * Agua = Peso Prefermento - Harina
 */
export function deconstructPreferment(spec: PrefermentSpec): PrefermentDecomposition {
  if (typeof spec.totalWeightGrams !== 'number' || isNaN(spec.totalWeightGrams) || spec.totalWeightGrams <= 0) {
    throw new Error(`El peso del prefermento debe ser mayor a 0. Se recibió: ${spec.totalWeightGrams}`)
  }

  const hydration = spec.hydrationPercentage ?? 100
  if (typeof hydration !== 'number' || isNaN(hydration) || hydration < 0) {
    throw new Error(`El porcentaje de hidratación del prefermento no puede ser negativo. Se recibió: ${hydration}%`)
  }

  const factor = 1 + hydration / 100
  const flourGrams = spec.totalWeightGrams / factor
  const waterGrams = spec.totalWeightGrams - flourGrams
  const alreadyIncluded = spec.alreadyIncludedInBaseIngredients ?? false

  return {
    prefermentName: spec.name || 'Masa Madre / Prefermento',
    totalWeightGrams: spec.totalWeightGrams,
    hydrationPercentage: hydration,
    flourGrams,
    waterGrams,
    alreadyIncludedInBaseIngredients: alreadyIncluded,
    note: alreadyIncluded
      ? 'La harina y agua del prefermento ya están computadas en los ingredientes base (evitando duplicación).'
      : 'Harina y agua del prefermento incorporadas al balance total de la fórmula.',
  }
}

/**
 * Resuelve la proporción de agua efectiva de un ingrediente según su nombre o valor explícito.
 */
export function resolveWaterRatio(
  name: string,
  explicitRatio?: number,
  customRatios?: Record<string, number>
): number {
  if (typeof explicitRatio === 'number' && !isNaN(explicitRatio) && isFinite(explicitRatio)) {
    if (explicitRatio < 0 || explicitRatio > 1) {
      throw new Error(`El ratio de agua debe estar entre 0 y 1. Se recibió: ${explicitRatio}`)
    }
    return explicitRatio
  }

  const table = { ...EMPIRICAL_WATER_ESTIMATES_TABLE, ...(customRatios || {}) }
  const clean = name.trim().toLowerCase()
  for (const [key, ratio] of Object.entries(table)) {
    if (clean === key || clean.includes(key)) {
      return ratio
    }
  }

  // Si no coincide y no se especificó, no asume agua
  return 0
}

/**
 * Detecta de forma heurística si un ingrediente es harina por su nombre si no viene etiquetado.
 */
export function isFlourByName(name: string): boolean {
  const clean = name.trim().toLowerCase()
  return (
    clean.includes('harina') ||
    clean.includes('flour') ||
    clean.includes('semolin') ||
    clean.includes('semola') ||
    clean.includes('centeno') ||
    clean.includes('avena') ||
    clean.includes('fecula') ||
    clean.includes('almidon')
  )
}

/**
 * Detecta de forma heurística si un ingrediente es agua pura por su nombre.
 */
export function isWaterByName(name: string): boolean {
  const clean = name.trim().toLowerCase()
  return (
    clean === 'agua' ||
    clean === 'water' ||
    clean.startsWith('agua ') ||
    clean.endsWith(' agua') ||
    clean.includes('agua pura') ||
    clean.includes('agua tibia') ||
    clean.includes('agua mineral') ||
    clean.includes('agua fría') ||
    clean.includes('agua helada') ||
    clean.startsWith('water ') ||
    clean.endsWith(' water')
  )
}

/**
 * Calcula los porcentajes panaderos, la hidratación tradicional y el aporte estimado de agua.
 */
export function calculateBakersPercentages(
  ingredients: BakerIngredientInput[],
  options?: BakerCalculationOptions
): BakerFormulaResult {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error('Debe proporcionar al menos un ingrediente para calcular el porcentaje panadero.')
  }

  // Descomponer prefermento si fue provisto
  let prefermentDec: PrefermentDecomposition | undefined
  if (options?.preferment) {
    prefermentDec = deconstructPreferment(options.preferment)
  }

  // 1. Identificar y validar harinas
  let baseFlourWeightGrams = 0
  const validatedInputs = ingredients.map((ing) => {
    if (typeof ing.weightGrams !== 'number' || isNaN(ing.weightGrams) || !isFinite(ing.weightGrams) || ing.weightGrams < 0) {
      throw new Error(`El peso del ingrediente '${ing.name}' debe ser un número finito no negativo. Se recibió: ${ing.weightGrams}`)
    }

    const isFlour = ing.isFlour ?? isFlourByName(ing.name)
    if (isFlour) {
      baseFlourWeightGrams += ing.weightGrams
    }

    return {
      ...ing,
      isFlour,
    }
  })

  // Si el prefermento no estaba incluido en la base, sumar su harina a la harina total de referencia
  const prefermentFlourToAdd = prefermentDec && !prefermentDec.alreadyIncludedInBaseIngredients ? prefermentDec.flourGrams : 0
  const totalFlourWeightGrams = baseFlourWeightGrams + prefermentFlourToAdd

  if (totalFlourWeightGrams <= 0) {
    throw new Error(
      'La receta debe contener al menos una harina con peso mayor a 0 para servir como base 100% del porcentaje panadero.'
    )
  }

  // 2. Calcular porcentajes e hidratación
  let totalDoughWeightGrams = prefermentDec && !prefermentDec.alreadyIncludedInBaseIngredients ? prefermentDec.totalWeightGrams : 0
  let totalPureWaterGrams = prefermentDec && !prefermentDec.alreadyIncludedInBaseIngredients ? prefermentDec.waterGrams : 0
  let estimatedWaterFromLiquidsGrams = 0

  const calculatedIngredients: BakerIngredientCalculated[] = validatedInputs.map((ing) => {
    const bakersPercentage = (ing.weightGrams / totalFlourWeightGrams) * 100
    totalDoughWeightGrams += ing.weightGrams

    const cleanName = ing.name.trim().toLowerCase()
    const isPureWater = ing.isWater ?? (ing.waterRatio === 1.0 || isWaterByName(ing.name))
    if (isPureWater) {
      totalPureWaterGrams += ing.weightGrams
    } else {
      const isLiquid = ing.isLiquid ?? (cleanName.includes('leche') || cleanName.includes('huevo') || ing.waterRatio !== undefined)
      if (isLiquid) {
        const waterRatio = resolveWaterRatio(ing.name, ing.waterRatio, options?.customWaterRatios)
        estimatedWaterFromLiquidsGrams += ing.weightGrams * waterRatio
      }
    }

    const effectiveWaterGrams = isPureWater
      ? ing.weightGrams
      : (ing.isLiquid || cleanName.includes('leche') || cleanName.includes('huevo') || ing.waterRatio !== undefined)
      ? ing.weightGrams * resolveWaterRatio(ing.name, ing.waterRatio, options?.customWaterRatios)
      : 0

    return {
      id: ing.id,
      name: ing.name,
      weightGrams: ing.weightGrams,
      isFlour: ing.isFlour,
      bakersPercentage,
      shareOfTotalFlour: ing.isFlour ? (ing.weightGrams / totalFlourWeightGrams) * 100 : undefined,
      effectiveWaterGrams,
    }
  })

  const totalEffectiveWaterGrams = totalPureWaterGrams + estimatedWaterFromLiquidsGrams

  // Hidratación tradicional canónica: solo agua pura sobre harina total
  const traditionalHydrationPercentage = (totalPureWaterGrams / totalFlourWeightGrams) * 100

  // Aporte estimado total de agua: incluye agua de leche, huevo, etc.
  const estimatedTotalWaterPercentage = (totalEffectiveWaterGrams / totalFlourWeightGrams) * 100

  return {
    totalFlourWeightGrams,
    totalDoughWeightGrams,
    traditionalHydrationPercentage,
    estimatedTotalWaterPercentage,
    pureWaterGrams: totalPureWaterGrams,
    estimatedWaterFromLiquidsGrams,
    totalEffectiveWaterGrams,
    // Compatibilidad: hidratación tradicional
    hydrationPercentage: traditionalHydrationPercentage,
    pureWaterHydrationPercentage: traditionalHydrationPercentage,
    ingredients: calculatedIngredients,
    prefermentContribution: prefermentDec,
  }
}

/**
 * Calcula las cantidades exactas en gramos a partir de un peso objetivo de harina base y porcentajes panaderos.
 */
export function calculateWeightsFromFlour(
  totalFlourWeightGrams: number,
  specs: BakerPercentageSpec[],
  options?: BakerCalculationOptions
): BakerFormulaResult {
  if (
    typeof totalFlourWeightGrams !== 'number' ||
    isNaN(totalFlourWeightGrams) ||
    !isFinite(totalFlourWeightGrams) ||
    totalFlourWeightGrams <= 0
  ) {
    throw new Error(`El peso de harina objetivo debe ser un número mayor a 0. Se recibió: ${totalFlourWeightGrams}`)
  }

  if (!Array.isArray(specs) || specs.length === 0) {
    throw new Error('Debe proporcionar especificaciones de porcentaje panadero.')
  }

  // Convertir cada especificación a ingrediente en gramos
  const ingredients: BakerIngredientInput[] = specs.map((s) => {
    if (typeof s.bakersPercentage !== 'number' || isNaN(s.bakersPercentage) || !isFinite(s.bakersPercentage) || s.bakersPercentage < 0) {
      throw new Error(`El porcentaje para '${s.name}' debe ser no negativo. Se recibió: ${s.bakersPercentage}`)
    }

    const isFlour = s.isFlour ?? isFlourByName(s.name)
    const weightGrams = (totalFlourWeightGrams * s.bakersPercentage) / 100

    return {
      id: s.id,
      name: s.name,
      weightGrams,
      isFlour,
      isLiquid: s.isLiquid,
      waterRatio: s.waterRatio,
    }
  })

  return calculateBakersPercentages(ingredients, options)
}

/**
 * Calcula las cantidades en gramos a partir de un peso total de masa deseado.
 * Fórmula:
 * Harina Total Necesaria = Peso Total de Masa / (Porcentaje Total de la Fórmula / 100)
 */
export function calculateWeightsFromTotalDough(
  totalDoughWeightGrams: number,
  specs: BakerPercentageSpec[],
  options?: BakerCalculationOptions
): BakerFormulaResult {
  if (
    typeof totalDoughWeightGrams !== 'number' ||
    isNaN(totalDoughWeightGrams) ||
    !isFinite(totalDoughWeightGrams) ||
    totalDoughWeightGrams <= 0
  ) {
    throw new Error(`El peso de masa deseado debe ser mayor a 0. Se recibió: ${totalDoughWeightGrams}`)
  }

  // Verificar que la suma de porcentajes de harina sea exactamente 100%
  let flourPercentageSum = 0
  let totalFormulaPercentage = 0

  for (const s of specs) {
    const isFlour = s.isFlour ?? isFlourByName(s.name)
    if (isFlour) {
      flourPercentageSum += s.bakersPercentage
    }
    totalFormulaPercentage += s.bakersPercentage
  }

  if (flourPercentageSum === 0) {
    throw new Error('La especificación debe contener al menos un ingrediente clasificado como harina.')
  }

  // Tolerancia del 0.05% para validar que las harinas sumen 100%
  if (Math.abs(flourPercentageSum - 100) > 0.05) {
    throw new Error(
      `En porcentaje panadero, la suma de las harinas debe ser exactamente 100%. Suma actual: ${flourPercentageSum}%`
    )
  }

  const flourWeightNeeded = totalDoughWeightGrams / (totalFormulaPercentage / 100)
  return calculateWeightsFromFlour(flourWeightNeeded, specs, options)
}

/**
 * Calcula directamente el porcentaje de hidratación a partir de harina y líquidos.
 * Retorna tanto la hidratación pura de agua como el aporte estimado total.
 */
export function calculateHydration(
  totalFlourGrams: number,
  liquids: Array<{ weightGrams: number; waterRatio?: number; name?: string }>
): {
  traditionalHydrationPercentage: number
  estimatedTotalWaterPercentage: number
  pureWaterGrams: number
  totalEffectiveWaterGrams: number
  /** Alias de compatibilidad */
  hydrationPercentage: number
  effectiveWaterGrams: number
} {
  if (typeof totalFlourGrams !== 'number' || isNaN(totalFlourGrams) || !isFinite(totalFlourGrams) || totalFlourGrams <= 0) {
    throw new Error(`El peso de harina debe ser mayor a 0. Se recibió: ${totalFlourGrams}`)
  }

  let pureWaterGrams = 0
  let totalEffectiveWaterGrams = 0

  for (const liq of liquids) {
    const cleanName = (liq.name || '').trim().toLowerCase()
    const isPureWater = cleanName === 'agua' || cleanName === 'water'
    if (isPureWater) {
      pureWaterGrams += liq.weightGrams || 0
      totalEffectiveWaterGrams += liq.weightGrams || 0
    } else {
      const ratio = resolveWaterRatio(liq.name || '', liq.waterRatio)
      totalEffectiveWaterGrams += (liq.weightGrams || 0) * ratio
    }
  }

  const traditionalHydration = (pureWaterGrams / totalFlourGrams) * 100
  const estimatedHydration = (totalEffectiveWaterGrams / totalFlourGrams) * 100

  return {
    traditionalHydrationPercentage: traditionalHydration,
    estimatedTotalWaterPercentage: estimatedHydration,
    pureWaterGrams,
    totalEffectiveWaterGrams,
    hydrationPercentage: traditionalHydration,
    effectiveWaterGrams: totalEffectiveWaterGrams,
  }
}
