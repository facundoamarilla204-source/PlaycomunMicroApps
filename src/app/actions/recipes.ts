'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import {
  Recipe,
  Unit,
  unitConversion,
  PRO_REQUIRED_RECIPE_ERROR,
  RecipeUserStatus,
} from '@/lib/costo-receta'

/**
 * Consulta el estado de autenticación, suscripción Pro y cantidad de recetas
 * preservadas del usuario en el servidor.
 */
export async function getRecipeUserStatusServer(): Promise<RecipeUserStatus> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        isAuthenticated: false,
        isPro: false,
        userId: null,
        preservedCount: 0,
      }
    }

    const isPro = await isProUser(user.id)
    let preservedCount = 0

    // Si no es Pro, consultamos la función segura que devuelve el recuento de recetas
    // sin exponer sus detalles, garantizando que el usuario sepa que sus datos existen.
    const { data: countData, error: countError } = await supabase.rpc('get_user_recipe_count')
    if (!countError && typeof countData === 'number') {
      preservedCount = countData
    }

    return {
      isAuthenticated: true,
      isPro,
      userId: user.id,
      preservedCount,
    }
  } catch (error) {
    console.error('Error al verificar estado de usuario en recetas:', error)
    return {
      isAuthenticated: false,
      isPro: false,
      userId: null,
      preservedCount: 0,
    }
  }
}

/**
 * Obtiene las recetas guardadas del usuario autenticado.
 * Requiere suscripción Pro activa. Si el usuario no es Pro pero tiene recetas,
 * informa el estado bloqueado y la cantidad de recetas preservadas intactas.
 */
export async function getUserRecipesServer(): Promise<{
  data: Recipe[] | null
  error: string | null
  isProRequired?: boolean
  preservedCount?: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      data: null,
      error: 'Debes iniciar sesión para consultar tus recetas guardadas.',
    }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    const { data: count } = await supabase.rpc('get_user_recipe_count')
    return {
      data: null,
      error: PRO_REQUIRED_RECIPE_ERROR,
      isProRequired: true,
      preservedCount: Number(count) || 0,
    }
  }

  const { data: recipesData, error: recipesError } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_additional_costs(*)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (recipesError) {
    console.error('Error cargando recetas en servidor:', recipesError)
    return { data: null, error: recipesError.message }
  }

  const mapped: Recipe[] = (recipesData || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category || '',
    description: r.description || '',
    yield_quantity: Number(r.yield_quantity) || 1,
    yield_unit: (r.yield_unit || 'unidades') as Unit,
    target_margin: Number(r.target_margin) || 0,
    target_markup: Number(r.target_markup || 0),
    pricing_mode: (r.pricing_mode || 'margin') as 'margin' | 'markup',
    created_at: r.created_at,
    updated_at: r.updated_at,
    ingredients: (r.recipe_ingredients || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      quantity: Number(i.quantity) || 0,
      unit: (i.unit || 'g') as Unit,
      reference_quantity: Number(i.reference_quantity) || 1,
      reference_unit: (i.reference_unit || 'kg') as Unit,
      reference_price: Number(i.reference_price) || 0,
      calculated_cost: Number(i.calculated_cost) || 0,
    })),
    additional_costs: (r.recipe_additional_costs || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount) || 0,
    })),
  }))

  return { data: mapped, error: null }
}

/**
 * Obtiene una receta por su ID.
 * Distingue explícitamente entre receta no encontrada (404) y receta bloqueada por falta de Pro (403).
 */
export async function getRecipeByIdServer(recipeId: string): Promise<{
  data: Recipe | null
  error: string | null
  isLocked?: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Debes iniciar sesión para consultar esta receta.' }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    const { data: exists } = await supabase.rpc('user_recipe_exists', { p_recipe_id: recipeId })
    if (exists) {
      return {
        data: null,
        error: 'Esta receta está guardada en tu cuenta, pero requiere una suscripción Pro activa para abrirla.',
        isLocked: true,
      }
    }
    return {
      data: null,
      error: 'La receta solicitada no existe o no pertenece a tu cuenta.',
      isLocked: false,
    }
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_additional_costs(*)')
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error cargando receta por ID:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return {
      data: null,
      error: 'La receta solicitada no existe o no pertenece a tu cuenta.',
      isLocked: false,
    }
  }

  const mapped: Recipe = {
    id: data.id,
    name: data.name,
    category: data.category || '',
    description: data.description || '',
    yield_quantity: Number(data.yield_quantity) || 1,
    yield_unit: (data.yield_unit || 'unidades') as Unit,
    target_margin: Number(data.target_margin) || 0,
    target_markup: Number(data.target_markup || 0),
    pricing_mode: (data.pricing_mode || 'margin') as 'margin' | 'markup',
    created_at: data.created_at,
    updated_at: data.updated_at,
    ingredients: (data.recipe_ingredients || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      quantity: Number(i.quantity) || 0,
      unit: (i.unit || 'g') as Unit,
      reference_quantity: Number(i.reference_quantity) || 1,
      reference_unit: (i.reference_unit || 'kg') as Unit,
      reference_price: Number(i.reference_price) || 0,
      calculated_cost: Number(i.calculated_cost) || 0,
    })),
    additional_costs: (data.recipe_additional_costs || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount) || 0,
    })),
  }

  return { data: mapped, error: null }
}

/**
 * Guarda o actualiza una receta en la base de datos con autorización estricta en servidor.
 * Requiere suscripción Pro activa.
 */
export async function saveRecipeServer(recipe: Recipe): Promise<{
  data: Recipe | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Debes iniciar sesión para guardar una receta.' }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
  }

  if (!recipe.name || !recipe.name.trim()) {
    return { data: null, error: 'Por favor asignale un nombre a la receta.' }
  }

  if (recipe.yield_quantity <= 0) {
    return { data: null, error: 'El rendimiento debe ser mayor a 0.' }
  }

  const isEditing = !!recipe.id
  let savedRecipeId = recipe.id

  const recipePayload = {
    user_id: user.id,
    name: recipe.name.trim(),
    category: (recipe.category || '').trim(),
    description: (recipe.description || '').trim(),
    yield_quantity: recipe.yield_quantity,
    yield_unit: recipe.yield_unit,
    target_margin: recipe.target_margin,
    target_markup: recipe.target_markup || 0,
    pricing_mode: recipe.pricing_mode || 'margin',
    updated_at: new Date().toISOString(),
  }

  try {
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update(recipePayload)
        .eq('id', recipe.id!)
        .eq('user_id', user.id)

      if (updateError) throw updateError
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('recipes')
        .insert(recipePayload)
        .select('id')
        .single()

      if (insertError) throw insertError
      if (insertData) savedRecipeId = insertData.id
    }

    if (!savedRecipeId) {
      throw new Error('No se pudo determinar el ID de la receta guardada.')
    }

    // Actualizar ingredientes y costos asociados
    if (isEditing) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', savedRecipeId)
      await supabase.from('recipe_additional_costs').delete().eq('recipe_id', savedRecipeId)
    }

    const validIngredients = (recipe.ingredients || []).filter((i) => i.name.trim() !== '')
    if (validIngredients.length > 0) {
      const ingredientsData = validIngredients.map((i) => {
        const refQtyConverted = unitConversion(i.reference_unit, i.unit, i.reference_quantity)
        const cost = refQtyConverted > 0 ? (i.reference_price / refQtyConverted) * i.quantity : 0
        return {
          recipe_id: savedRecipeId,
          name: i.name.trim(),
          quantity: i.quantity,
          unit: i.unit,
          reference_quantity: i.reference_quantity,
          reference_unit: i.reference_unit,
          reference_price: i.reference_price,
          calculated_cost: cost,
        }
      })

      const { error: ingError } = await supabase.from('recipe_ingredients').insert(ingredientsData)
      if (ingError) throw ingError
    }

    const validCosts = (recipe.additional_costs || []).filter((c) => c.name.trim() !== '')
    if (validCosts.length > 0) {
      const costsData = validCosts.map((c) => ({
        recipe_id: savedRecipeId,
        name: c.name.trim(),
        amount: c.amount,
      }))

      const { error: costsError } = await supabase.from('recipe_additional_costs').insert(costsData)
      if (costsError) throw costsError
    }

    const fullRecipe = await getRecipeByIdServer(savedRecipeId)
    return { data: fullRecipe.data, error: null }
  } catch (error: any) {
    console.error('Error guardando receta en servidor:', error)
    return { data: null, error: error.message || 'Error al guardar la receta' }
  }
}

/**
 * Duplica una receta existente asignándole un nuevo ID y el sufijo (Copia).
 * Requiere suscripción Pro activa.
 */
export async function duplicateRecipeServer(recipeId: string): Promise<{
  data: Recipe | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Debes iniciar sesión para duplicar recetas.' }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
  }

  // Obtener la receta original verificando propiedad
  const original = await getRecipeByIdServer(recipeId)
  if (!original.data) {
    return { data: null, error: original.error || 'Receta original no encontrada.' }
  }

  const recipeToClone: Recipe = {
    ...original.data,
    id: undefined,
    name: `${original.data.name} (Copia)`,
    ingredients: original.data.ingredients.map((i) => ({
      ...i,
      id: crypto.randomUUID(),
    })),
    additional_costs: original.data.additional_costs.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
    })),
  }

  return await saveRecipeServer(recipeToClone)
}

/**
 * Elimina una receta de la biblioteca del usuario.
 * Requiere suscripción Pro activa.
 */
export async function deleteRecipeServer(recipeId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Debes iniciar sesión para eliminar recetas.' }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error eliminando receta en servidor:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
