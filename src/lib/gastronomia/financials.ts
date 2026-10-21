/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * financials.ts: Motor financiero gastronómico compartido y fuente de verdad para costos y precios.
 */

import { convertUnits } from './conversions'

export type LegacyUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidades'

export interface FinancialIngredient {
  id: string
  name: string
  quantity: number
  unit: string
  reference_quantity: number
  reference_unit: string
  reference_price: number
  calculated_cost?: number
  density?: number
  pieceWeightGrams?: number
  [key: string]: any
}

export interface FinancialAdditionalCost {
  id: string
  name: string
  amount: number
  [key: string]: any
}

export interface FinancialRecipe {
  id?: string
  name: string
  category?: string
  description?: string
  yield_quantity: number
  yield_unit: string
  target_margin: number
  target_markup: number
  pricing_mode: 'margin' | 'markup'
  ingredients: FinancialIngredient[]
  additional_costs: FinancialAdditionalCost[]
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface IngredientFinancialBreakdown extends FinancialIngredient {
  calculated_cost: number
  percentageOfTotal: number
  conversionError?: string | null
}

export interface RecipeFinancials {
  totalIngredients: number
  totalAdditional: number
  totalCost: number
  unitCost: number
  suggestedPrice: number
  profitPerUnit: number
  totalProfit: number
  realMarginPct: number
  ingredientsWithCost: IngredientFinancialBreakdown[]
  /** Indica si la receta contiene algún ingrediente cuyas unidades resultaron incompatibles */
  hasConversionErrors: boolean
  /** Cantidad de ingredientes con error de conversión */
  invalidIngredientsCount: number
}

/**
 * Formatea valores numéricos en formato de moneda estándar argentino (ARS).
 */
export const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return '$ 0,00'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Calcula los costos, márgenes, recargos y precios sugeridos de una receta gastronómica.
 * Es la fuente de verdad matemática compartida entre la herramienta existente y Cocina Pro.
 */
export function calculateRecipeFinancials(recipe: FinancialRecipe): RecipeFinancials {
  let totalIngredients = 0
  let hasConversionErrors = false
  let invalidIngredientsCount = 0

  const ingredientsCalculated: IngredientFinancialBreakdown[] = (recipe.ingredients || []).map((i) => {
    const refQty = Number(i.reference_quantity) || 0
    const refPrice = Number(i.reference_price) || 0
    const qty = Number(i.quantity) || 0

    // Si los datos están incompletos pero vacíos, no reportar error agresivo
    if (qty === 0 || refPrice === 0 || refQty === 0) {
      return {
        ...i,
        calculated_cost: 0,
        percentageOfTotal: 0,
        conversionError: null,
      }
    }

    // Conversión dimensional segura
    const conversion = convertUnits(refQty, i.reference_unit, i.unit, {
      density: i.density,
      pieceWeightGrams: i.pieceWeightGrams,
    })

    if (!conversion.success) {
      hasConversionErrors = true
      invalidIngredientsCount++
      return {
        ...i,
        calculated_cost: 0,
        percentageOfTotal: 0,
        conversionError: conversion.message,
      }
    }

    const refQtyConverted = conversion.value
    const waste = Number(i.waste_percentage) || 0
    const grossQty = waste > 0 && waste < 100 ? qty / (1 - waste / 100) : qty
    const cost = refQtyConverted > 0 ? (refPrice / refQtyConverted) * grossQty : 0
    totalIngredients += cost

    return {
      ...i,
      calculated_cost: cost,
      percentageOfTotal: 0, // Se computa luego de calcular totalCost
      conversionError: null,
    }
  })

  const totalAdditional = (recipe.additional_costs || []).reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  )

  const totalCost = totalIngredients + totalAdditional
  const yieldQty = Number(recipe.yield_quantity) > 0 ? Number(recipe.yield_quantity) : 1
  const unitCost = totalCost / yieldQty

  let suggestedPrice = 0
  let realMarginPct = 0

  const targetMargin = Number(recipe.target_margin) || 0
  const targetMarkup = Number(recipe.target_markup) || 0

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

  const ingredientsWithCost = ingredientsCalculated.map((i) => ({
    ...i,
    percentageOfTotal: totalCost > 0 ? (i.calculated_cost / totalCost) * 100 : 0,
  }))

  return {
    totalIngredients,
    totalAdditional,
    totalCost,
    unitCost,
    suggestedPrice,
    profitPerUnit,
    totalProfit,
    realMarginPct,
    ingredientsWithCost,
    hasConversionErrors,
    invalidIngredientsCount,
  }
}
