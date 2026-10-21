/**
 * Cocina Pro - Definiciones de Tipos del Modelo de Datos Gastronómico
 * Biblioteca personal de ingredientes, historial de precios, pasos de elaboración
 * y vinculaciones relacionales con recetas.
 */

import { Unit } from '../costo-receta'

/**
 * Ingrediente reutilizable de la biblioteca personal del usuario.
 */
export interface KitchenIngredient {
  id: string
  user_id: string
  name: string
  category?: string | null
  package_unit: Unit
  package_quantity: number
  current_price: number
  price_updated_at: string
  density_g_ml?: number | null
  density_source?: string | null
  is_flour: boolean
  is_water: boolean
  estimated_water_percentage?: number | null
  water_percentage_source?: string | null
  brand?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

/**
 * Input para crear un nuevo ingrediente en la biblioteca.
 */
export interface CreateKitchenIngredientInput {
  name: string
  category?: string | null
  package_unit: Unit
  package_quantity: number
  current_price: number
  density_g_ml?: number | null
  density_source?: string | null
  is_flour?: boolean
  is_water?: boolean
  estimated_water_percentage?: number | null
  water_percentage_source?: string | null
  brand?: string | null
  notes?: string | null
}

/**
 * Input para actualizar un ingrediente existente en la biblioteca.
 */
export interface UpdateKitchenIngredientInput extends Partial<CreateKitchenIngredientInput> {
  priceChangeReason?: string
}

/**
 * Registro histórico inmutable de cambio de precio de un ingrediente.
 */
export interface KitchenIngredientPriceHistory {
  id: string
  ingredient_id: string
  user_id: string
  previous_price: number
  new_price: number
  change_reason?: string | null
  recorded_at: string
}

/**
 * Paso de elaboración ordenado de una receta profesional.
 */
export interface RecipeStep {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
  duration_minutes?: number | null
  temperature_celsius?: number | null
  equipment?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

/**
 * Input para crear o editar un paso de elaboración.
 */
export interface RecipeStepInput {
  id?: string
  step_number: number
  instruction: string
  duration_minutes?: number | null
  temperature_celsius?: number | null
  equipment?: string | null
  notes?: string | null
}

/**
 * Ingrediente vinculado con su biblioteca y datos vigentes.
 */
export interface LinkedRecipeIngredient {
  recipeIngredientId: string
  recipeId: string
  name: string
  quantity: number
  unit: Unit
  // Precios guardados históricamente en la receta
  savedReferenceQuantity: number
  savedReferenceUnit: Unit
  savedReferencePrice: number
  savedCalculatedCost: number
  // Referencia a biblioteca
  ingredientId?: string | null
  libraryIngredient?: KitchenIngredient | null
  // Merma del ingrediente crudo
  wastePercentage?: number
  // Precios vigentes recalculados si está vinculado
  liveReferencePrice?: number
  liveCalculatedCost?: number
  hasPriceDivergence?: boolean
}

/**
 * Comparativa entre costeo guardado en receta y costeo con precios vigentes de la biblioteca.
 */
export interface RecipeLiveFinancialPreview {
  recipeId?: string
  recipeName: string
  savedCostTotal: number
  liveCostTotal: number
  differenceAmount: number
  percentageChange: number
  hasPriceDivergences: boolean
  linkedIngredientsCount: number
  unlinkedIngredientsCount: number
  items: Array<{
    name: string
    quantity: number
    unit: Unit
    savedCost: number
    liveCost: number
    difference: number
    isLinked: boolean
    ingredientName?: string
  }>
}

/**
 * Relación estructurada de subreceta incorporada en una receta principal.
 */
export interface RecipeSubrecipe {
  id: string
  recipe_id: string
  subrecipe_id: string
  quantity: number
  unit: Unit
  waste_percentage: number
  position: number
  notes?: string | null
  reference_yield_quantity?: number | null
  reference_yield_unit?: Unit | null
  reference_unit_cost?: number | null
  reference_total_cost?: number | null
  created_at?: string
  updated_at?: string
  // Metadatos de la subreceta resuelta para visualización inmediata
  subrecipe_name?: string
  subrecipe_yield_quantity?: number
  subrecipe_yield_unit?: Unit
  subrecipe_category?: string
}

/**
 * Input para crear o editar una relación de subreceta.
 */
export interface RecipeSubrecipeInput {
  id?: string
  subrecipe_id: string
  quantity: number
  unit: Unit
  waste_percentage?: number
  position?: number
  notes?: string | null
  reference_yield_quantity?: number | null
  reference_yield_unit?: Unit | null
  reference_unit_cost?: number | null
  reference_total_cost?: number | null
}

/**
 * Desglose financiero y proporcional de una subreceta incorporada.
 */
export interface SubrecipeFinancialItem {
  subrecipeRelationId: string
  subrecipeId: string
  subrecipeName: string
  netQuantity: number
  grossQuantity: number
  unit: Unit
  wastePercentage: number
  subrecipeYieldQuantity: number
  subrecipeYieldUnit: Unit
  subrecipeTotalCost: number
  subrecipeUnitCost: number
  calculatedCost: number
  percentageOfTotal: number
  savedHistoricalCost?: number | null
  hasCostDivergence: boolean
  hasYieldDivergence: boolean
  conversionError?: string | null
  isProvisional: boolean
  childSubrecipes?: SubrecipeFinancialItem[]
}

/**
 * Resultado completo del motor de costeo financiero para recetas compuestas.
 */
export interface CompositeRecipeFinancials {
  directIngredientsCost: number
  subrecipesCost: number
  additionalCosts: number
  totalCost: number
  unitCost: number
  suggestedPrice: number
  profitPerUnit: number
  totalProfit: number
  realMarginPct: number
  hasConversionErrors: boolean
  hasProvisionalCosts: boolean
  invalidItemsCount: number
  subrecipesBreakdown: SubrecipeFinancialItem[]
}

