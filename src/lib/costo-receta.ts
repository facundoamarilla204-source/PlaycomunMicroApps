export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'unidades'

export type Ingredient = {
  id: string
  name: string
  quantity: number
  unit: Unit
  reference_quantity: number
  reference_unit: Unit
  reference_price: number
  calculated_cost?: number
}

export type AdditionalCost = {
  id: string
  name: string
  amount: number
}

export type Recipe = {
  id?: string
  name: string
  category: string
  description: string
  yield_quantity: number
  yield_unit: Unit
  target_margin: number
  target_markup: number
  pricing_mode: 'margin' | 'markup'
  ingredients: Ingredient[]
  additional_costs: AdditionalCost[]
  created_at?: string
  updated_at?: string
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
  ingredientsWithCost: (Ingredient & { calculated_cost: number; percentageOfTotal: number })[]
}

export const emptyRecipe: Recipe = {
  name: '',
  category: '',
  description: '',
  yield_quantity: 1,
  yield_unit: 'unidades',
  target_margin: 30,
  target_markup: 0,
  pricing_mode: 'margin',
  ingredients: [],
  additional_costs: [],
}

export const formatCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '$ 0,00'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const unitConversion = (from: Unit, to: Unit, value: number): number => {
  if (value <= 0 || isNaN(value)) return 0
  if (from === to) return value
  if (from === 'kg' && to === 'g') return value * 1000
  if (from === 'g' && to === 'kg') return value / 1000
  if (from === 'l' && to === 'ml') return value * 1000
  if (from === 'ml' && to === 'l') return value / 1000
  return value
}

export function calculateRecipeFinancials(recipe: Recipe): RecipeFinancials {
  let totalIngredients = 0

  const ingredientsCalculated = (recipe.ingredients || []).map((i) => {
    const refQty = Number(i.reference_quantity) || 0
    const refPrice = Number(i.reference_price) || 0
    const qty = Number(i.quantity) || 0

    const refQtyConverted = unitConversion(i.reference_unit, i.unit, refQty)
    const cost = refQtyConverted > 0 ? (refPrice / refQtyConverted) * qty : 0
    totalIngredients += cost
    return {
      ...i,
      calculated_cost: cost,
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
  }
}
