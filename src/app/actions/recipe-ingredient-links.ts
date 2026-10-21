'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'
import { KitchenIngredient, RecipeLiveFinancialPreview } from '@/lib/gastronomia/types'
import {
  calculateIngredientLiveCost,
  prepareRecipeIngredientLink,
  prepareRecipeIngredientUnlink,
  previewRecipeLiveFinancials,
} from '@/lib/gastronomia/recipe-linking'

/**
 * Vincula un ingrediente de una receta propia con un insumo de la biblioteca personal.
 * Por defecto, conserva los valores históricos guardados salvo que se solicite `syncPrice: true`.
 */
export async function linkRecipeIngredientServer(
  recipeId: string,
  recipeIngredientId: string,
  kitchenIngredientId: string,
  options?: { syncPrice?: boolean }
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // 1. Verificar propiedad de la receta
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('id, user_id')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (recipeError || !recipeData) {
      return { success: false, error: 'Receta no encontrada o no autorizada.' }
    }

    // 2. Verificar propiedad del ingrediente de la biblioteca
    const { data: libraryIngredient, error: libError } = await supabase
      .from('kitchen_ingredients')
      .select('*')
      .eq('id', kitchenIngredientId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (libError || !libraryIngredient) {
      return { success: false, error: 'El ingrediente de la biblioteca no existe o pertenece a otra cuenta.' }
    }

    // 3. Obtener el ingrediente de la receta actual
    const { data: currentIngredient, error: ingError } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('id', recipeIngredientId)
      .eq('recipe_id', recipeId)
      .maybeSingle()

    if (ingError || !currentIngredient) {
      return { success: false, error: 'El ingrediente no pertenece a la receta indicada.' }
    }

    const syncPrice = options?.syncPrice ?? false
    const updatePayload: Record<string, any> = {
      ingredient_id: kitchenIngredientId,
      updated_at: new Date().toISOString(),
    }

    if (syncPrice) {
      const liveCostResult = calculateIngredientLiveCost(
        {
          quantity: Number(currentIngredient.quantity),
          unit: currentIngredient.unit,
          waste_percentage: Number(currentIngredient.waste_percentage) || 0,
        },
        libraryIngredient as KitchenIngredient
      )

      updatePayload.reference_quantity = libraryIngredient.package_quantity
      updatePayload.reference_unit = libraryIngredient.package_unit
      updatePayload.reference_price = libraryIngredient.current_price
      if (liveCostResult.success) {
        updatePayload.calculated_cost = liveCostResult.liveCost
      }
    }

    const { error: updateError } = await supabase
      .from('recipe_ingredients')
      .update(updatePayload)
      .eq('id', recipeIngredientId)
      .eq('recipe_id', recipeId)

    if (updateError) {
      return { success: false, error: updateError.message || 'Error al vincular el ingrediente' }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error del servidor' }
  }
}

/**
 * Desvincula un ingrediente de receta de la biblioteca personal,
 * conservando de forma segura su nombre, cantidades, unidades y costo calculado.
 */
export async function unlinkRecipeIngredientServer(
  recipeId: string,
  recipeIngredientId: string
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // Verificar que la receta pertenezca al usuario
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (recipeError || !recipeData) {
      return { success: false, error: 'Receta no encontrada o no autorizada.' }
    }

    const { error: updateError } = await supabase
      .from('recipe_ingredients')
      .update({
        ingredient_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeIngredientId)
      .eq('recipe_id', recipeId)

    if (updateError) {
      return { success: false, error: updateError.message || 'Error al desvincular ingrediente' }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error del servidor' }
  }
}

/**
 * Sincroniza explícitamente el precio de un ingrediente de receta con el precio vigente
 * de la biblioteca personal.
 */
export async function syncRecipeIngredientWithLibraryPriceServer(
  recipeId: string,
  recipeIngredientId: string
): Promise<{
  success: boolean
  newCalculatedCost?: number
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // 1. Obtener el ingrediente de la receta
    const { data: currentIngredient, error: ingError } = await supabase
      .from('recipe_ingredients')
      .select('*, recipes!inner(user_id)')
      .eq('id', recipeIngredientId)
      .eq('recipe_id', recipeId)
      .maybeSingle()

    if (ingError || !currentIngredient || currentIngredient.recipes?.user_id !== user.id) {
      return { success: false, error: 'Ingrediente no encontrado o no autorizado.' }
    }

    if (!currentIngredient.ingredient_id) {
      return { success: false, error: 'El ingrediente no está vinculado a la biblioteca.' }
    }

    // 2. Obtener los datos vigentes de la biblioteca
    const { data: libraryIngredient, error: libError } = await supabase
      .from('kitchen_ingredients')
      .select('*')
      .eq('id', currentIngredient.ingredient_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (libError || !libraryIngredient) {
      return { success: false, error: 'El ingrediente de la biblioteca ya no está disponible.' }
    }

    const liveResult = calculateIngredientLiveCost(
      {
        quantity: Number(currentIngredient.quantity),
        unit: currentIngredient.unit,
        waste_percentage: Number(currentIngredient.waste_percentage) || 0,
      },
      libraryIngredient as KitchenIngredient
    )

    if (!liveResult.success) {
      return { success: false, error: liveResult.error || 'No se pudo recalcular el costo.' }
    }

    const { error: updateError } = await supabase
      .from('recipe_ingredients')
      .update({
        reference_quantity: libraryIngredient.package_quantity,
        reference_unit: libraryIngredient.package_unit,
        reference_price: libraryIngredient.current_price,
        calculated_cost: liveResult.liveCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeIngredientId)
      .eq('recipe_id', recipeId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, newCalculatedCost: liveResult.liveCost, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error del servidor' }
  }
}

/**
 * Previsualiza el recosteo de una receta completa utilizando los precios vigentes
 * de la biblioteca personal, sin alterar los datos guardados en la base de datos.
 */
export async function previewRecipeWithLibraryPricesServer(
  recipeId: string
): Promise<{
  data: RecipeLiveFinancialPreview | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // 1. Obtener la receta con ingredientes y costos adicionales
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*),
        additional_costs:recipe_additional_costs(*)
      `)
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (recipeError || !recipeData) {
      return { data: null, error: 'Receta no encontrada o no autorizada.' }
    }

    // 2. Obtener los ingredientes de la biblioteca del usuario
    const { data: libraryIngredients } = await supabase
      .from('kitchen_ingredients')
      .select('*')
      .eq('user_id', user.id)

    const mappedRecipe = {
      id: recipeData.id,
      name: recipeData.name,
      category: recipeData.category || '',
      description: recipeData.description || '',
      yield_quantity: Number(recipeData.yield_quantity) || 1,
      yield_unit: recipeData.yield_unit,
      target_margin: Number(recipeData.target_margin) || 0,
      target_markup: Number(recipeData.target_markup) || 0,
      pricing_mode: recipeData.pricing_mode || 'margin',
      ingredients: (recipeData.ingredients || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: Number(i.quantity) || 0,
        unit: i.unit,
        reference_quantity: Number(i.reference_quantity) || 0,
        reference_unit: i.reference_unit,
        reference_price: Number(i.reference_price) || 0,
        calculated_cost: Number(i.calculated_cost) || 0,
        ingredient_id: i.ingredient_id,
        waste_percentage: Number(i.waste_percentage) || 0,
      })),
      additional_costs: (recipeData.additional_costs || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        amount: Number(c.amount) || 0,
      })),
    }

    const preview = previewRecipeLiveFinancials(mappedRecipe, (libraryIngredients || []) as KitchenIngredient[])

    return { data: preview, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Error del servidor' }
  }
}
