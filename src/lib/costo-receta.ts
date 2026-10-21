/**
 * Módulo de Costo de Recetas - PlayComun Online
 * Adaptador de compatibilidad y tipos para la herramienta /herramientas/costo-receta,
 * integrando la lógica matemática pura de @/lib/gastronomia.
 */

import {
  convertUnits,
  calculateRecipeFinancials as calculateFinancialsCore,
  formatCurrency as formatCurrencyCore,
  RecipeFinancials as CoreRecipeFinancials,
  FinancialRecipe,
} from './gastronomia'

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
  density?: number
  pieceWeightGrams?: number
  /** Identificador de ingrediente en la biblioteca personal de Cocina Pro (opcional) */
  ingredient_id?: string | null
  /** Porcentaje de merma del ingrediente crudo (0 a < 100) */
  waste_percentage?: number
}

export type AdditionalCost = {
  id: string
  name: string
  amount: number
}

import { RecipeStep, RecipeSubrecipe } from './gastronomia/types'
export type { RecipeSubrecipe } from './gastronomia/types'

export type Recipe = {
  id?: string
  user_id?: string
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
  steps?: RecipeStep[]
  subrecipes?: RecipeSubrecipe[]
  // Metadatos gastronómicos profesionales de Cocina Pro (opcionales)
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  rest_time_minutes?: number | null
  baking_temperature_celsius?: number | null
  baking_loss_percentage?: number | null
  created_at?: string
  updated_at?: string
}

export const PRO_REQUIRED_RECIPE_ERROR = 'Esta función de recetas requiere una suscripción Pro activa.'

export interface RecipeUserStatus {
  isAuthenticated: boolean
  isPro: boolean
  userId: string | null
  preservedCount: number
}

export interface RecipeFinancials extends CoreRecipeFinancials {
  ingredientsWithCost: (Ingredient & {
    calculated_cost: number
    percentageOfTotal: number
    conversionError?: string | null
  })[]
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

export const formatCurrency = formatCurrencyCore

/**
 * Convierte un valor entre unidades gastronómicas de forma segura.
 * A diferencia de la versión anterior con fallback silencioso a `value`,
 * ante dimensiones incompatibles o falta de densidad retorna 0, evitando
 * distorsionar los costos de la receta.
 */
export const unitConversion = (from: Unit, to: Unit, value: number, density?: number): number => {
  if (typeof value !== 'number' || value <= 0 || isNaN(value) || !isFinite(value)) return 0
  if (from === to) return value

  const result = convertUnits(value, from, to, { density })
  return result.success ? result.value : 0
}

/**
 * Calcula los costos e indicadores financieros de una receta gastronómica.
 */
export function calculateRecipeFinancials(recipe: Recipe): RecipeFinancials {
  const coreResult = calculateFinancialsCore(recipe as unknown as FinancialRecipe)

  return {
    ...coreResult,
    ingredientsWithCost: coreResult.ingredientsWithCost as (Ingredient & {
      calculated_cost: number
      percentageOfTotal: number
      conversionError?: string | null
    })[],
  }
}
