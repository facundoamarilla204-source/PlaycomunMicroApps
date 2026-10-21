/**
 * Cocina Pro - Vinculación de Ingredientes y Precios Dinámicos
 * recipe-linking.ts: Lógica de vinculación segura entre recetas e ingredientes
 * de la biblioteca personal, preservación de precios históricos vs. cálculo en vivo.
 */

import { Ingredient, Recipe } from '../costo-receta'
import { convertUnits } from './conversions'
import { calculateGrossFromNet } from './yield'
import { KitchenIngredient, RecipeLiveFinancialPreview } from './types'

/**
 * Calcula el costo en vivo de un ingrediente de receta utilizando los datos vigentes
 * de su ingrediente vinculado en la biblioteca.
 *
 * @param recipeIng Ingrediente de la receta
 * @param libIng Ingrediente de la biblioteca
 * @returns Costo recalculado con el precio vigente del catálogo
 */
export function calculateIngredientLiveCost(
  recipeIng: Pick<Ingredient, 'quantity' | 'unit' | 'waste_percentage'>,
  libIng: Pick<KitchenIngredient, 'package_quantity' | 'package_unit' | 'current_price' | 'density_g_ml'>
): {
  success: boolean
  liveCost: number
  grossQuantity: number
  error?: string
} {
  const waste = recipeIng.waste_percentage || 0
  const grossQuantity = waste > 0 ? calculateGrossFromNet(recipeIng.quantity, waste).grossQuantity : recipeIng.quantity

  const conversion = convertUnits(
    grossQuantity,
    recipeIng.unit,
    libIng.package_unit,
    { density: libIng.density_g_ml ?? undefined }
  )

  if (!conversion.success) {
    return {
      success: false,
      liveCost: 0,
      grossQuantity,
      error: conversion.message || conversion.error || 'No se pudo convertir la unidad del ingrediente a la presentación de compra.',
    }
  }

  // Costo efectivo = (Cantidad convertida en unidades del paquete / Cantidad total del paquete) * Precio del paquete
  const liveCost = (conversion.value / libIng.package_quantity) * libIng.current_price
  return {
    success: true,
    liveCost: Number(liveCost.toFixed(4)),
    grossQuantity,
  }
}

/**
 * Prepara la vinculación de un ingrediente de receta con uno de la biblioteca personal.
 * Por defecto, conserva el precio de referencia guardado históricamente para evitar
 * alteraciones involuntarias, a menos que se solicite expresamente `syncPrice: true`.
 */
export function prepareRecipeIngredientLink(
  ingredient: Ingredient,
  libraryIngredient: KitchenIngredient,
  options?: { syncPrice?: boolean }
): Ingredient {
  const syncPrice = options?.syncPrice ?? false

  if (syncPrice) {
    const liveCostResult = calculateIngredientLiveCost(ingredient, libraryIngredient)
    return {
      ...ingredient,
      ingredient_id: libraryIngredient.id,
      reference_quantity: libraryIngredient.package_quantity,
      reference_unit: libraryIngredient.package_unit,
      reference_price: libraryIngredient.current_price,
      calculated_cost: liveCostResult.success ? liveCostResult.liveCost : ingredient.calculated_cost,
      density: libraryIngredient.density_g_ml ?? ingredient.density,
    }
  }

  // Preservación histórica: solo asigna el ID de referencia
  return {
    ...ingredient,
    ingredient_id: libraryIngredient.id,
    density: libraryIngredient.density_g_ml ?? ingredient.density,
  }
}

/**
 * Desvincula un ingrediente de receta de la biblioteca sin destruir sus valores de referencia ni su costo.
 */
export function prepareRecipeIngredientUnlink(ingredient: Ingredient): Ingredient {
  return {
    ...ingredient,
    ingredient_id: null,
  }
}

/**
 * Genera una previsualización comparativa entre los costos guardados en la receta
 * y los costos en vivo calculados con los precios vigentes de la biblioteca de ingredientes.
 */
export function previewRecipeLiveFinancials(
  recipe: Recipe,
  libraryIngredients: KitchenIngredient[] | Record<string, KitchenIngredient>
): RecipeLiveFinancialPreview {
  const libMap = new Map<string, KitchenIngredient>()
  if (Array.isArray(libraryIngredients)) {
    for (const item of libraryIngredients) {
      libMap.set(item.id, item)
    }
  } else {
    for (const [id, item] of Object.entries(libraryIngredients)) {
      libMap.set(id, item)
    }
  }

  let savedCostTotal = 0
  let liveCostTotal = 0
  let linkedCount = 0
  let unlinkedCount = 0
  let hasPriceDivergences = false

  const items = recipe.ingredients.map((ing) => {
    const savedCost = ing.calculated_cost ?? 0
    savedCostTotal += savedCost

    if (ing.ingredient_id && libMap.has(ing.ingredient_id)) {
      linkedCount++
      const libItem = libMap.get(ing.ingredient_id)!
      const liveResult = calculateIngredientLiveCost(ing, libItem)
      const liveCost = liveResult.success ? liveResult.liveCost : savedCost
      liveCostTotal += liveCost

      const diff = Number((liveCost - savedCost).toFixed(4))
      if (Math.abs(diff) >= 0.01) {
        hasPriceDivergences = true
      }

      return {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        savedCost,
        liveCost,
        difference: diff,
        isLinked: true,
        ingredientName: libItem.name,
      }
    } else {
      unlinkedCount++
      liveCostTotal += savedCost
      return {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        savedCost,
        liveCost: savedCost,
        difference: 0,
        isLinked: false,
      }
    }
  })

  // Sumar costos adicionales si existen
  const additionalCostsSum = (recipe.additional_costs || []).reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  savedCostTotal += additionalCostsSum
  liveCostTotal += additionalCostsSum

  const differenceAmount = Number((liveCostTotal - savedCostTotal).toFixed(4))
  const percentageChange = savedCostTotal > 0 ? Number(((differenceAmount / savedCostTotal) * 100).toFixed(2)) : 0

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    savedCostTotal: Number(savedCostTotal.toFixed(2)),
    liveCostTotal: Number(liveCostTotal.toFixed(2)),
    differenceAmount,
    percentageChange,
    hasPriceDivergences,
    linkedIngredientsCount: linkedCount,
    unlinkedIngredientsCount: unlinkedCount,
    items,
  }
}
