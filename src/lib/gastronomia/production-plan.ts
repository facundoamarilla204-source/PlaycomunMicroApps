/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * production-plan.ts: Motor de planificación de producción, escalado de elaboraciones
 * compuestas y consolidación inteligente de listas de compras.
 *
 * Sigue las directrices de Antislop e Impeccable:
 * - Rigor matemático sin conversiones arbitrarias.
 * - Soporte para insumos de biblioteca e insumos libres.
 * - Desglose transparente de orígenes de insumos.
 * - Distinción explícita entre costo de consumo y costo estimado de compra por paquete.
 */

import {
  convertUnits,
  normalizeUnit,
  getUnitDimension,
  UnitDimension,
  CulinaryUnit,
} from './conversions'
import { calculateGrossFromNet } from './yield'
import { Recipe } from '../costo-receta'
import { KitchenIngredient } from './types'

export interface ProductionPlanRecipeInput {
  recipeId: string
  targetQuantity: number
  targetUnit: string
  notes?: string
}

export interface ScaledDirectIngredient {
  ingredientId?: string | null
  name: string
  netQuantity: number
  grossQuantity: number
  unit: string
  wastePercentage: number
  density?: number
  pieceWeightGrams?: number
  estimatedCost: number
  recipeId: string
  recipeName: string
  isSubrecipe: boolean
  parentRecipeName?: string
}

export interface ExpandedSubrecipeInfo {
  subrecipeId: string
  subrecipeName: string
  category?: string
  requiredGrossQuantity: number
  requiredNetQuantity: number
  unit: string
  scalingFactor: number
  depth: number
  parentRecipeName: string
}

export interface ProductionPlanItemCalculation {
  recipeId: string
  recipeName: string
  category: string
  baseYieldQuantity: number
  baseYieldUnit: string
  targetQuantity: number
  targetUnit: string
  scalingFactor: number
  isProvisional: boolean
  warnings: string[]
  directIngredients: ScaledDirectIngredient[]
  expandedSubrecipes: ExpandedSubrecipeInfo[]
  estimatedCost: number
  unitCost: number
}

export interface ConsolidatedIngredientOrigin {
  recipeId: string
  recipeName: string
  isSubrecipe: boolean
  parentRecipeName?: string
  netQuantity: number
  grossQuantity: number
  unit: string
}

export interface ConsolidatedIngredientItem {
  key: string
  ingredientId?: string | null
  name: string
  totalGrossQuantity: number
  totalNetQuantity: number
  unit: string
  dimension: UnitDimension | 'unknown'
  origins: ConsolidatedIngredientOrigin[]
  libraryItem?: KitchenIngredient | null
  estimatedConsumptionCost: number
  estimatedPackagePurchaseCost?: number
  packagesNeeded?: number
  warnings: string[]
  isProvisional: boolean
  isChecked?: boolean
}

export interface ProductionPlanSummary {
  items: ProductionPlanItemCalculation[]
  consolidatedIngredients: ConsolidatedIngredientItem[]
  incompatibleIngredients: ConsolidatedIngredientItem[]
  totalEstimatedCost: number
  hasProvisionalCalculations: boolean
  warnings: string[]
}

/**
 * Normaliza nombres de ingredientes para agrupamiento conservador de insumos libres.
 */
export function normalizeIngredientName(name: string): string {
  if (!name || typeof name !== 'string') return ''
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Determina el factor de escalado proporcional entre el rendimiento base de una receta
 * y la cantidad solicitada para producción.
 */
export function calculateItemScalingFactor(
  baseYieldQuantity: number,
  baseYieldUnit: string,
  targetQuantity: number,
  targetUnit: string,
  options?: { density?: number; pieceWeightGrams?: number }
): { factor: number; isProvisional: boolean; warning?: string } {
  const baseQty = Number(baseYieldQuantity) || 1
  const targetQty = Number(targetQuantity) || 0

  if (targetQty <= 0) {
    return { factor: 0, isProvisional: false }
  }

  const normBase = normalizeUnit(baseYieldUnit)
  const normTarget = normalizeUnit(targetUnit)

  // 1. Mismas unidades canónicas (o ambas son idénticas en string)
  if (normBase && normTarget && normBase === normTarget) {
    return { factor: targetQty / baseQty, isProvisional: false }
  }

  if (baseYieldUnit.trim().toLowerCase() === targetUnit.trim().toLowerCase()) {
    return { factor: targetQty / baseQty, isProvisional: false }
  }

  // 2. Si ambas unidades son culinarias válidas, intentar conversión dimensional
  if (normBase && normTarget) {
    const conv = convertUnits(targetQty, normTarget, normBase, {
      density: options?.density,
      pieceWeightGrams: options?.pieceWeightGrams,
    })

    if (conv.success) {
      return { factor: conv.value / baseQty, isProvisional: false }
    }
  }

  // 3. Si la unidad objetivo es "multiplicador", "receta" o "lote"
  const cleanedTarget = targetUnit.trim().toLowerCase()
  if (['receta', 'recetas', 'lote', 'lotes', 'preparacion', 'preparaciones', 'x'].includes(cleanedTarget)) {
    return { factor: targetQty, isProvisional: false }
  }

  // 4. Si las unidades no son compatibles dimensionalmente sin densidad
  return {
    factor: targetQty / baseQty,
    isProvisional: true,
    warning: `Unidades incompatibles entre el rendimiento base (${baseYieldQuantity} ${baseYieldUnit}) y la producción objetivo (${targetQuantity} ${targetUnit}). Se aplica escala directa proporcional.`,
  }
}

export type RecipeLookup = (id: string) => Recipe | undefined

/**
 * Expande recursivamente una receta (directa y sus subrecetas) recolectando todos sus
 * ingredientes base escalados y verificando la ausencia de ciclos.
 */
function expandRecipeIngredients(
  recipe: Recipe,
  scalingFactor: number,
  resolveRecipe: RecipeLookup,
  currentDepth: number = 0,
  maxDepth: number = 10,
  callStack: Set<string> = new Set(),
  parentRecipeName?: string
): {
  directIngredients: ScaledDirectIngredient[]
  expandedSubrecipes: ExpandedSubrecipeInfo[]
  warnings: string[]
  isProvisional: boolean
} {
  const directIngredients: ScaledDirectIngredient[] = []
  const expandedSubrecipes: ExpandedSubrecipeInfo[] = []
  const warnings: string[] = []
  let isProvisional = false

  const recipeId = recipe.id || 'unidentified-recipe'
  if (recipe.id && callStack.has(recipe.id)) {
    warnings.push(`Dependencia circular detectada en subreceta ${recipe.name || recipeId}.`)
    return { directIngredients, expandedSubrecipes, warnings, isProvisional: true }
  }

  if (currentDepth > maxDepth) {
    warnings.push(`Profundidad máxima de subrecetas excedida en ${recipe.name || recipeId}.`)
    return { directIngredients, expandedSubrecipes, warnings, isProvisional: true }
  }

  const nextStack = new Set(callStack)
  if (recipe.id) nextStack.add(recipe.id)

  // 1. Ingredientes directos de la receta
  for (const ing of recipe.ingredients || []) {
    const rawQty = Number(ing.quantity) || 0
    if (rawQty <= 0) continue

    const netQuantity = rawQty * scalingFactor
    const wastePct = Math.max(0, Math.min(99.99, Number(ing.waste_percentage) || 0))
    const grossQuantity = wastePct > 0
      ? calculateGrossFromNet(netQuantity, wastePct).grossQuantity
      : netQuantity

    const unitCost = Number(ing.calculated_cost) || 0
    const estimatedCost = unitCost * scalingFactor

    directIngredients.push({
      ingredientId: ing.ingredient_id ?? null,
      name: ing.name.trim(),
      netQuantity,
      grossQuantity,
      unit: ing.unit,
      wastePercentage: wastePct,
      density: ing.density,
      pieceWeightGrams: ing.pieceWeightGrams,
      estimatedCost,
      recipeId: recipe.id || '',
      recipeName: recipe.name,
      isSubrecipe: currentDepth > 0,
      parentRecipeName,
    })
  }

  // 2. Subrecetas incorporadas
  for (const sub of recipe.subrecipes || []) {
    const childRecipe = resolveRecipe(sub.subrecipe_id)
    if (!childRecipe) {
      warnings.push(`La subreceta vinculada "${sub.subrecipe_name || sub.subrecipe_id}" no se encuentra en el recetario.`)
      isProvisional = true
      continue
    }

    const subNetQuantity = (Number(sub.quantity) || 0) * scalingFactor
    const subWastePct = Math.max(0, Math.min(99.99, Number(sub.waste_percentage) || 0))
    const subGrossQuantity = subWastePct > 0
      ? calculateGrossFromNet(subNetQuantity, subWastePct).grossQuantity
      : subNetQuantity

    // Calcular factor de escala de la subreceta según su rendimiento propio
    const childYieldQty = Number(childRecipe.yield_quantity) || 1
    const childYieldUnit = childRecipe.yield_unit || 'unidades'

    const childScaling = calculateItemScalingFactor(
      childYieldQty,
      childYieldUnit,
      subGrossQuantity,
      sub.unit
    )

    if (childScaling.isProvisional) {
      isProvisional = true
      if (childScaling.warning) warnings.push(childScaling.warning)
    }

    expandedSubrecipes.push({
      subrecipeId: childRecipe.id || sub.subrecipe_id,
      subrecipeName: childRecipe.name,
      category: childRecipe.category,
      requiredGrossQuantity: subGrossQuantity,
      requiredNetQuantity: subNetQuantity,
      unit: sub.unit,
      scalingFactor: childScaling.factor,
      depth: currentDepth + 1,
      parentRecipeName: recipe.name,
    })

    // Expansión recursiva
    const childResult = expandRecipeIngredients(
      childRecipe,
      childScaling.factor,
      resolveRecipe,
      currentDepth + 1,
      maxDepth,
      nextStack,
      recipe.name
    )

    directIngredients.push(...childResult.directIngredients)
    expandedSubrecipes.push(...childResult.expandedSubrecipes)
    warnings.push(...childResult.warnings)
    if (childResult.isProvisional) isProvisional = true
  }

  return { directIngredients, expandedSubrecipes, warnings, isProvisional }
}

/**
 * Calcula un plan de producción completo con sus recetas escaladas y
 * genera la lista consolidada de compras sin duplicaciones erróneas.
 */
export function calculateProductionPlan(
  plannedItems: ProductionPlanRecipeInput[],
  resolveRecipe: RecipeLookup,
  libraryIngredientsMap?: Map<string, KitchenIngredient>,
  checkedIngredientKeys?: Set<string>
): ProductionPlanSummary {
  const calculatedItems: ProductionPlanItemCalculation[] = []
  const allIngredientsToConsolidate: ScaledDirectIngredient[] = []
  let totalEstimatedCost = 0
  let hasProvisionalCalculations = false
  const globalWarnings: string[] = []

  // 1. Procesar cada receta planificada
  for (const item of plannedItems) {
    const recipe = resolveRecipe(item.recipeId)
    if (!recipe) {
      hasProvisionalCalculations = true
      globalWarnings.push(`Receta con ID "${item.recipeId}" no encontrada.`)
      calculatedItems.push({
        recipeId: item.recipeId,
        recipeName: 'Receta no encontrada',
        category: '',
        baseYieldQuantity: 1,
        baseYieldUnit: 'unidades',
        targetQuantity: item.targetQuantity,
        targetUnit: item.targetUnit,
        scalingFactor: 0,
        isProvisional: true,
        warnings: ['La receta no se encuentra disponible.'],
        directIngredients: [],
        expandedSubrecipes: [],
        estimatedCost: 0,
        unitCost: 0,
      })
      continue
    }

    const baseYieldQty = Number(recipe.yield_quantity) || 1
    const baseYieldUnit = recipe.yield_unit || 'unidades'

    // Calcular factor de escala
    const scaleInfo = calculateItemScalingFactor(
      baseYieldQty,
      baseYieldUnit,
      item.targetQuantity,
      item.targetUnit
    )

    const itemWarnings: string[] = []
    if (scaleInfo.warning) {
      itemWarnings.push(scaleInfo.warning)
    }

    // Expandir ingredientes directos y subrecetas
    const expanded = expandRecipeIngredients(recipe, scaleInfo.factor, resolveRecipe)
    itemWarnings.push(...expanded.warnings)

    const isItemProvisional = scaleInfo.isProvisional || expanded.isProvisional
    if (isItemProvisional) hasProvisionalCalculations = true

    // Calcular costo estimado del ítem
    let itemTotalCost = 0
    for (const ing of expanded.directIngredients) {
      itemTotalCost += ing.estimatedCost
    }
    // Añadir costos adicionales escalados de la receta principal
    for (const cost of recipe.additional_costs || []) {
      itemTotalCost += (Number(cost.amount) || 0) * scaleInfo.factor
    }

    const unitCost = item.targetQuantity > 0 ? itemTotalCost / item.targetQuantity : 0
    totalEstimatedCost += itemTotalCost

    calculatedItems.push({
      recipeId: recipe.id || item.recipeId,
      recipeName: recipe.name,
      category: recipe.category || '',
      baseYieldQuantity: baseYieldQty,
      baseYieldUnit,
      targetQuantity: item.targetQuantity,
      targetUnit: item.targetUnit,
      scalingFactor: scaleInfo.factor,
      isProvisional: isItemProvisional,
      warnings: itemWarnings,
      directIngredients: expanded.directIngredients,
      expandedSubrecipes: expanded.expandedSubrecipes,
      estimatedCost: itemTotalCost,
      unitCost,
    })

    allIngredientsToConsolidate.push(...expanded.directIngredients)
  }

  // 2. Consolidar ingredientes
  // Agrupar insumos por identidad:
  // - Insumos vinculados: 'lib:' + ingredientId
  // - Insumos libres: 'free:' + normalizeIngredientName(name)
  const groups = new Map<string, ScaledDirectIngredient[]>()

  for (const ing of allIngredientsToConsolidate) {
    let groupKey: string
    if (ing.ingredientId && ing.ingredientId.trim() !== '') {
      groupKey = `lib:${ing.ingredientId.trim()}`
    } else {
      const normalized = normalizeIngredientName(ing.name)
      groupKey = `free:${normalized || 'sin-nombre'}`
    }

    const list = groups.get(groupKey) || []
    list.push(ing)
    groups.set(groupKey, list)
  }

  const consolidatedIngredients: ConsolidatedIngredientItem[] = []
  const incompatibleIngredients: ConsolidatedIngredientItem[] = []

  for (const [groupKey, entries] of groups.entries()) {
    if (entries.length === 0) continue

    const first = entries[0]
    const isLibraryLinked = groupKey.startsWith('lib:')
    const libraryId = isLibraryLinked ? groupKey.slice(4) : null
    const libraryItem = libraryId && libraryIngredientsMap ? libraryIngredientsMap.get(libraryId) : null

    const displayName = libraryItem?.name || first.name

    // Separar entradas según dimensión física
    const entriesByDimension = new Map<string, ScaledDirectIngredient[]>()
    for (const entry of entries) {
      const norm = normalizeUnit(entry.unit)
      const dim = norm ? getUnitDimension(norm) : 'unknown'
      const list = entriesByDimension.get(dim) || []
      list.push(entry)
      entriesByDimension.set(dim, list)
    }

    // Si hay mezclas entre masa y volumen, intentar unificar si existe densidad
    const density = libraryItem?.density_g_ml || first.density
    const pieceWeight = first.pieceWeightGrams

    // Si sólo hay una dimensión, o podemos convertir a la dimensión preferida:
    // Unidad preferida de presentación:
    // Masa -> 'g' o 'kg'
    // Volumen -> 'ml' o 'l'
    // Conteo -> 'unidades'
    for (const [dim, dimEntries] of entriesByDimension.entries()) {
      let canonicalUnit: CulinaryUnit = 'g'
      if (dim === 'volume') canonicalUnit = 'ml'
      else if (dim === 'count') canonicalUnit = 'unidades'
      else canonicalUnit = 'g'

      let totalGrossInCanonical = 0
      let totalNetInCanonical = 0
      let totalCost = 0
      const origins: ConsolidatedIngredientOrigin[] = []
      const itemWarnings: string[] = []
      let isItemProvisional = false

      for (const entry of dimEntries) {
        totalCost += entry.estimatedCost

        const normEntryUnit = normalizeUnit(entry.unit)
        if (normEntryUnit) {
          const convGross = convertUnits(entry.grossQuantity, normEntryUnit, canonicalUnit, {
            density,
            pieceWeightGrams: pieceWeight,
          })
          const convNet = convertUnits(entry.netQuantity, normEntryUnit, canonicalUnit, {
            density,
            pieceWeightGrams: pieceWeight,
          })

          if (convGross.success && convNet.success) {
            totalGrossInCanonical += convGross.value
            totalNetInCanonical += convNet.value
          } else {
            totalGrossInCanonical += entry.grossQuantity
            totalNetInCanonical += entry.netQuantity
            isItemProvisional = true
            itemWarnings.push(
              `Conversión incompatible al consolidar "${entry.name}" (${entry.grossQuantity} ${entry.unit}).`
            )
          }
        } else {
          // Unidad libre no canónica
          totalGrossInCanonical += entry.grossQuantity
          totalNetInCanonical += entry.netQuantity
          canonicalUnit = entry.unit as CulinaryUnit
        }

        origins.push({
          recipeId: entry.recipeId,
          recipeName: entry.recipeName,
          isSubrecipe: entry.isSubrecipe,
          parentRecipeName: entry.parentRecipeName,
          netQuantity: entry.netQuantity,
          grossQuantity: entry.grossQuantity,
          unit: entry.unit,
        })
      }

      // Si tenemos múltiples dimensiones no convertibles en el mismo grupo, advertir
      if (entriesByDimension.size > 1) {
        itemWarnings.push(
          `Este insumo tiene cantidades en distintas dimensiones (${Array.from(entriesByDimension.keys()).join(', ')}). Se presentan desglosadas para evitar conversiones imprecisas.`
        )
        isItemProvisional = true
      }

      // Cálculo de compras por paquete si tenemos datos de biblioteca
      let packagesNeeded: number | undefined
      let estimatedPackagePurchaseCost: number | undefined

      if (libraryItem && libraryItem.package_quantity > 0 && libraryItem.current_price >= 0) {
        const pkgUnit = normalizeUnit(libraryItem.package_unit)
        if (pkgUnit) {
          const convToPkg = convertUnits(totalGrossInCanonical, canonicalUnit, pkgUnit, { density })
          if (convToPkg.success) {
            const requiredInPkgUnit = convToPkg.value
            packagesNeeded = Math.ceil(requiredInPkgUnit / libraryItem.package_quantity)
            estimatedPackagePurchaseCost = packagesNeeded * libraryItem.current_price
          }
        }
      }

      const itemKey = `${groupKey}:${dim}`
      const isChecked = checkedIngredientKeys ? checkedIngredientKeys.has(itemKey) : false

      const consolidatedItem: ConsolidatedIngredientItem = {
        key: itemKey,
        ingredientId: libraryId,
        name: displayName,
        totalGrossQuantity: Math.round(totalGrossInCanonical * 100) / 100,
        totalNetQuantity: Math.round(totalNetInCanonical * 100) / 100,
        unit: canonicalUnit,
        dimension: dim as UnitDimension,
        origins,
        libraryItem,
        estimatedConsumptionCost: Math.round(totalCost * 100) / 100,
        estimatedPackagePurchaseCost: estimatedPackagePurchaseCost !== undefined ? Math.round(estimatedPackagePurchaseCost * 100) / 100 : undefined,
        packagesNeeded,
        warnings: itemWarnings,
        isProvisional: isItemProvisional,
        isChecked,
      }

      if (isItemProvisional && entriesByDimension.size > 1) {
        incompatibleIngredients.push(consolidatedItem)
      } else {
        consolidatedIngredients.push(consolidatedItem)
      }
    }
  }

  // Ordenar alfabéticamente para facilidad de lectura en compras
  consolidatedIngredients.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  incompatibleIngredients.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))

  return {
    items: calculatedItems,
    consolidatedIngredients,
    incompatibleIngredients,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    hasProvisionalCalculations,
    warnings: globalWarnings,
  }
}
