/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * subrecipes.ts: Motor de subrecetas, elaboraciones compuestas, costeo recursivo,
 * detección de ciclos y seguimiento de costos históricos.
 */

import { convertUnits, normalizeUnit } from './conversions'
import { calculateRecipeFinancials, FinancialRecipe } from './financials'
import {
  SubrecipeFinancialItem,
  CompositeRecipeFinancials,
} from './types'
import { Recipe, Unit } from '../costo-receta'

export interface CycleDetectionResult {
  hasCycle: boolean
  cyclePath: string[]
  message?: string
}

export interface ProportionalCostResult {
  success: boolean
  calculatedCost: number
  grossQuantity: number
  convertedYield: number
  unitCost: number
  conversionError?: string | null
  isProvisional: boolean
  hasCostDivergence: boolean
  hasYieldDivergence: boolean
}

/**
 * Detecta dependencias circulares directas e indirectas en el grafo de subrecetas.
 * Impide que una receta dependa directa o transitivamente de sí misma.
 */
export function detectSubrecipeCycle(
  targetRecipeId: string,
  candidateSubrecipeId: string,
  getSubrecipeIds: (recipeId: string) => string[]
): CycleDetectionResult {
  if (!targetRecipeId || !candidateSubrecipeId) {
    return { hasCycle: false, cyclePath: [] }
  }

  // 1. Ciclo directo: la receta no puede agregarse a sí misma
  if (targetRecipeId === candidateSubrecipeId) {
    return {
      hasCycle: true,
      cyclePath: [targetRecipeId, candidateSubrecipeId],
      message: 'Una receta no puede incluirse a sí misma como subreceta.',
    }
  }

  // 2. Ciclo indirecto: DFS explorando los hijos de candidateSubrecipeId
  const visited = new Set<string>()
  const path: string[] = [targetRecipeId, candidateSubrecipeId]

  function dfs(currentId: string): boolean {
    if (currentId === targetRecipeId) {
      return true
    }
    if (visited.has(currentId)) {
      return false
    }
    visited.add(currentId)

    const children = getSubrecipeIds(currentId) || []
    for (const childId of children) {
      path.push(childId)
      if (dfs(childId)) {
        return true
      }
      path.pop()
    }

    return false
  }

  const cycleFound = dfs(candidateSubrecipeId)

  if (cycleFound) {
    return {
      hasCycle: true,
      cyclePath: path,
      message: `Dependencia circular detectada: la subreceta ya depende de la receta principal (${path.join(' -> ')}).`,
    }
  }

  return { hasCycle: false, cyclePath: [] }
}

/**
 * Calcula el costo proporcional exacto de una cantidad de subreceta incorporada,
 * respetando rendimientos originales, mermas y dimensiones gastronómicas.
 */
export function calculateProportionalSubrecipeCost(params: {
  netQuantity: number
  unit: Unit | string
  wastePercentage?: number
  subrecipeYieldQuantity: number
  subrecipeYieldUnit: Unit | string
  subrecipeTotalCost: number
  density?: number
  pieceWeightGrams?: number
  savedHistoricalCost?: number | null
  savedReferenceYieldQuantity?: number | null
  savedReferenceYieldUnit?: Unit | string | null
}): ProportionalCostResult {
  const {
    netQuantity,
    unit,
    wastePercentage = 0,
    subrecipeYieldQuantity,
    subrecipeYieldUnit,
    subrecipeTotalCost,
    density,
    pieceWeightGrams,
    savedHistoricalCost,
    savedReferenceYieldQuantity,
    savedReferenceYieldUnit,
  } = params

  const netQty = Number(netQuantity) || 0
  const waste = Math.max(0, Math.min(99.99, Number(wastePercentage) || 0))
  const grossQuantity = waste > 0 ? netQty / (1 - waste / 100) : netQty

  const yieldQty = Number(subrecipeYieldQuantity) || 1
  const totalCost = Number(subrecipeTotalCost) || 0

  if (netQty <= 0 || yieldQty <= 0 || totalCost <= 0) {
    return {
      success: true,
      calculatedCost: 0,
      grossQuantity,
      convertedYield: yieldQty,
      unitCost: yieldQty > 0 ? totalCost / yieldQty : 0,
      conversionError: null,
      isProvisional: false,
      hasCostDivergence: false,
      hasYieldDivergence: false,
    }
  }

  // Conversión dimensional segura de la unidad de rendimiento a la unidad utilizada
  const conversion = convertUnits(yieldQty, subrecipeYieldUnit, unit, {
    density,
    pieceWeightGrams,
  })

  if (!conversion.success) {
    return {
      success: false,
      calculatedCost: 0,
      grossQuantity,
      convertedYield: 0,
      unitCost: 0,
      conversionError: conversion.message,
      isProvisional: true,
      hasCostDivergence: true,
      hasYieldDivergence: true,
    }
  }

  const convertedYield = conversion.value
  if (convertedYield <= 0) {
    return {
      success: false,
      calculatedCost: 0,
      grossQuantity,
      convertedYield: 0,
      unitCost: 0,
      conversionError: 'El rendimiento convertido de la subreceta no es válido.',
      isProvisional: true,
      hasCostDivergence: true,
      hasYieldDivergence: true,
    }
  }

  // Costo por unidad en la dimensión utilizada
  const unitCostInUsedDimension = totalCost / convertedYield
  const calculatedCost = unitCostInUsedDimension * grossQuantity

  // Detección de divergencias con el costo y rendimiento históricos registrados
  const hasCostDivergence =
    savedHistoricalCost !== undefined &&
    savedHistoricalCost !== null &&
    Math.abs(calculatedCost - savedHistoricalCost) > 0.05

  const hasYieldDivergence =
    (savedReferenceYieldQuantity !== undefined &&
      savedReferenceYieldQuantity !== null &&
      Math.abs(yieldQty - savedReferenceYieldQuantity) > 0.001) ||
    (savedReferenceYieldUnit &&
      normalizeUnit(String(savedReferenceYieldUnit)) !== normalizeUnit(String(subrecipeYieldUnit)))

  return {
    success: true,
    calculatedCost,
    grossQuantity,
    convertedYield,
    unitCost: totalCost / yieldQty,
    conversionError: null,
    isProvisional: false,
    hasCostDivergence: Boolean(hasCostDivergence),
    hasYieldDivergence: Boolean(hasYieldDivergence),
  }
}

export type RecipeResolver = (id: string) => Recipe | undefined

export interface RecursionOptions {
  maxDepth?: number
  memoCache?: Map<string, CompositeRecipeFinancials>
}

/**
 * Motor de costeo recursivo para recetas compuestas.
 * Calcula los costos de ingredientes directos, costos adicionales y subrecetas incorporadas
 * hasta la base del árbol, utilizando memoización temporal para evitar recálculos en dependencias en diamante.
 */
export function calculateCompositeRecipeFinancials(
  recipe: Recipe,
  resolveRecipe: RecipeResolver,
  options?: RecursionOptions,
  currentDepth: number = 0,
  callStack: Set<string> = new Set()
): CompositeRecipeFinancials {
  const maxDepth = options?.maxDepth ?? 10
  const memoCache = options?.memoCache ?? new Map<string, CompositeRecipeFinancials>()

  // 1. Protección contra ciclos y límite de recursión
  const recipeId = recipe.id || 'unidentified-recipe'
  if (recipe.id && callStack.has(recipe.id)) {
    return createProvisionalFinancials(
      `Dependencia circular detectada en ${recipe.name || recipeId}.`
    )
  }

  if (currentDepth > maxDepth) {
    return createProvisionalFinancials(
      `Se superó el límite de profundidad máxima (${maxDepth}) en recetas compuestas.`
    )
  }

  // Si ya tenemos el cálculo de esta receta en la caché de este pase, reutilizarlo
  if (recipe.id && memoCache.has(recipe.id)) {
    return memoCache.get(recipe.id)!
  }

  // 2. Calcular los ingredientes directos y costos adicionales de esta receta base
  const directFinancials = calculateRecipeFinancials(recipe as FinancialRecipe)
  const directIngredientsCost = directFinancials.totalIngredients
  const additionalCosts = directFinancials.totalAdditional

  let subrecipesCost = 0
  let hasConversionErrors = directFinancials.hasConversionErrors
  let hasProvisionalCosts = false
  let invalidItemsCount = directFinancials.invalidIngredientsCount

  const subrecipesBreakdown: SubrecipeFinancialItem[] = []

  // 3. Procesar subrecetas incorporadas
  const subrecipes = recipe.subrecipes || []

  if (subrecipes.length > 0) {
    const nextCallStack = new Set(callStack)
    if (recipe.id) nextCallStack.add(recipe.id)

    for (const rel of subrecipes) {
      const childRecipe = resolveRecipe(rel.subrecipe_id)

      if (!childRecipe) {
        // Subreceta no encontrada en el catálogo provisto
        hasProvisionalCosts = true
        invalidItemsCount++
        subrecipesBreakdown.push({
          subrecipeRelationId: rel.id || crypto.randomUUID(),
          subrecipeId: rel.subrecipe_id,
          subrecipeName: rel.subrecipe_name || 'Subreceta no encontrada',
          netQuantity: rel.quantity,
          grossQuantity: rel.quantity,
          unit: rel.unit,
          wastePercentage: rel.waste_percentage || 0,
          subrecipeYieldQuantity: rel.reference_yield_quantity || 1,
          subrecipeYieldUnit: rel.reference_yield_unit || 'unidades',
          subrecipeTotalCost: rel.reference_total_cost || 0,
          subrecipeUnitCost: rel.reference_unit_cost || 0,
          calculatedCost: rel.reference_total_cost || 0,
          percentageOfTotal: 0,
          savedHistoricalCost: rel.reference_total_cost ?? null,
          hasCostDivergence: false,
          hasYieldDivergence: false,
          conversionError: 'La subreceta vinculada no se encuentra disponible.',
          isProvisional: true,
        })
        continue
      }

      // Cálculo recursivo de la subreceta (puede tener sus propias subrecetas)
      const childFinancials = calculateCompositeRecipeFinancials(
        childRecipe,
        resolveRecipe,
        { maxDepth, memoCache },
        currentDepth + 1,
        nextCallStack
      )

      if (childFinancials.hasConversionErrors || childFinancials.hasProvisionalCosts) {
        hasProvisionalCosts = true
        invalidItemsCount += childFinancials.invalidItemsCount
      }

      // Costeo proporcional de la cantidad utilizada
      const propResult = calculateProportionalSubrecipeCost({
        netQuantity: rel.quantity,
        unit: rel.unit,
        wastePercentage: rel.waste_percentage,
        subrecipeYieldQuantity: childRecipe.yield_quantity,
        subrecipeYieldUnit: childRecipe.yield_unit,
        subrecipeTotalCost: childFinancials.totalCost,
        savedHistoricalCost: rel.reference_total_cost,
        savedReferenceYieldQuantity: rel.reference_yield_quantity,
        savedReferenceYieldUnit: rel.reference_yield_unit,
      })

      if (!propResult.success || propResult.isProvisional) {
        hasProvisionalCosts = true
        invalidItemsCount++
      }

      if (propResult.conversionError) {
        hasConversionErrors = true
      }

      subrecipesCost += propResult.calculatedCost

      subrecipesBreakdown.push({
        subrecipeRelationId: rel.id || crypto.randomUUID(),
        subrecipeId: childRecipe.id || rel.subrecipe_id,
        subrecipeName: childRecipe.name,
        netQuantity: rel.quantity,
        grossQuantity: propResult.grossQuantity,
        unit: rel.unit,
        wastePercentage: rel.waste_percentage || 0,
        subrecipeYieldQuantity: childRecipe.yield_quantity,
        subrecipeYieldUnit: childRecipe.yield_unit,
        subrecipeTotalCost: childFinancials.totalCost,
        subrecipeUnitCost: propResult.unitCost,
        calculatedCost: propResult.calculatedCost,
        percentageOfTotal: 0, // Se computa luego al tener el total general
        savedHistoricalCost: rel.reference_total_cost ?? null,
        hasCostDivergence: propResult.hasCostDivergence,
        hasYieldDivergence: propResult.hasYieldDivergence,
        conversionError: propResult.conversionError,
        isProvisional: propResult.isProvisional,
        childSubrecipes: childFinancials.subrecipesBreakdown,
      })
    }
  }

  // 4. Totales consolidados sin duplicación
  const totalCost = directIngredientsCost + subrecipesCost + additionalCosts
  const yieldQty = Number(recipe.yield_quantity) > 0 ? Number(recipe.yield_quantity) : 1
  const unitCost = totalCost / yieldQty

  // 5. Precios de venta sugeridos y márgenes
  const targetMargin = Number(recipe.target_margin) || 0
  const targetMarkup = Number(recipe.target_markup) || 0

  let suggestedPrice = 0
  let realMarginPct = 0

  if (recipe.pricing_mode === 'margin') {
    let margin = targetMargin / 100
    if (margin >= 1) margin = 0.99
    if (margin < 0) margin = 0
    suggestedPrice = unitCost > 0 ? unitCost / (1 - margin) : 0
    realMarginPct = targetMargin
  } else {
    let markup = targetMarkup / 100
    if (markup < 0) markup = 0
    suggestedPrice = unitCost * (1 + markup)
    realMarginPct = suggestedPrice > 0 ? ((suggestedPrice - unitCost) / suggestedPrice) * 100 : 0
  }

  const profitPerUnit = Math.max(0, suggestedPrice - unitCost)
  const totalProfit = profitPerUnit * yieldQty

  // Asignar porcentajes de cada subreceta sobre el costo total
  const finalSubrecipesBreakdown = subrecipesBreakdown.map((item) => ({
    ...item,
    percentageOfTotal: totalCost > 0 ? (item.calculatedCost / totalCost) * 100 : 0,
  }))

  const result: CompositeRecipeFinancials = {
    directIngredientsCost,
    subrecipesCost,
    additionalCosts,
    totalCost,
    unitCost,
    suggestedPrice,
    profitPerUnit,
    totalProfit,
    realMarginPct,
    hasConversionErrors,
    hasProvisionalCosts,
    invalidItemsCount,
    subrecipesBreakdown: finalSubrecipesBreakdown,
  }

  if (recipe.id) {
    memoCache.set(recipe.id, result)
  }

  return result
}

function createProvisionalFinancials(errorMessage: string): CompositeRecipeFinancials {
  return {
    directIngredientsCost: 0,
    subrecipesCost: 0,
    additionalCosts: 0,
    totalCost: 0,
    unitCost: 0,
    suggestedPrice: 0,
    profitPerUnit: 0,
    totalProfit: 0,
    realMarginPct: 0,
    hasConversionErrors: true,
    hasProvisionalCosts: true,
    invalidItemsCount: 1,
    subrecipesBreakdown: [
      {
        subrecipeRelationId: crypto.randomUUID(),
        subrecipeId: '',
        subrecipeName: 'Error en fórmula',
        netQuantity: 0,
        grossQuantity: 0,
        unit: 'unidades',
        wastePercentage: 0,
        subrecipeYieldQuantity: 0,
        subrecipeYieldUnit: 'unidades',
        subrecipeTotalCost: 0,
        subrecipeUnitCost: 0,
        calculatedCost: 0,
        percentageOfTotal: 0,
        hasCostDivergence: false,
        hasYieldDivergence: false,
        conversionError: errorMessage,
        isProvisional: true,
      },
    ],
  }
}
