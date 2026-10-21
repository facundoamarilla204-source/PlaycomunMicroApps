'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import {
  Recipe,
  Unit,
  unitConversion,
  calculateRecipeFinancials,
  PRO_REQUIRED_RECIPE_ERROR,
  RecipeUserStatus,
} from '@/lib/costo-receta'
import {
  RecipeStep,
  RecipeStepInput,
  RecipeSubrecipe,
  detectSubrecipeCycle,
  calculateCompositeRecipeFinancials,
} from '@/lib/gastronomia'

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
    .select('*, recipe_ingredients(*), recipe_additional_costs(*), recipe_subrecipes:recipe_subrecipes!recipe_subrecipes_recipe_id_fkey(*, subrecipe:recipes!recipe_subrecipes_subrecipe_id_fkey(id, name, yield_quantity, yield_unit, category))')
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
    prep_time_minutes: r.prep_time_minutes ?? null,
    cook_time_minutes: r.cook_time_minutes ?? null,
    rest_time_minutes: r.rest_time_minutes ?? null,
    baking_temperature_celsius: r.baking_temperature_celsius !== null && r.baking_temperature_celsius !== undefined ? Number(r.baking_temperature_celsius) : null,
    baking_loss_percentage: Number(r.baking_loss_percentage) || 0,
    ingredients: (r.recipe_ingredients || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      quantity: Number(i.quantity) || 0,
      unit: (i.unit || 'g') as Unit,
      reference_quantity: Number(i.reference_quantity) || 1,
      reference_unit: (i.reference_unit || 'kg') as Unit,
      reference_price: Number(i.reference_price) || 0,
      calculated_cost: Number(i.calculated_cost) || 0,
      ingredient_id: i.ingredient_id ?? null,
      waste_percentage: Number(i.waste_percentage) || 0,
    })),
    additional_costs: (r.recipe_additional_costs || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount) || 0,
    })),
    subrecipes: (r.recipe_subrecipes || []).map((sr: any) => ({
      id: sr.id,
      recipe_id: sr.recipe_id,
      subrecipe_id: sr.subrecipe_id,
      quantity: Number(sr.quantity) || 1,
      unit: (sr.unit || 'unidades') as Unit,
      waste_percentage: Number(sr.waste_percentage) || 0,
      position: Number(sr.position) || 0,
      notes: sr.notes ?? null,
      reference_yield_quantity: sr.reference_yield_quantity !== null && sr.reference_yield_quantity !== undefined ? Number(sr.reference_yield_quantity) : null,
      reference_yield_unit: (sr.reference_yield_unit || null) as Unit | null,
      reference_unit_cost: sr.reference_unit_cost !== null && sr.reference_unit_cost !== undefined ? Number(sr.reference_unit_cost) : null,
      reference_total_cost: sr.reference_total_cost !== null && sr.reference_total_cost !== undefined ? Number(sr.reference_total_cost) : null,
      created_at: sr.created_at,
      updated_at: sr.updated_at,
      subrecipe_name: sr.subrecipe?.name || undefined,
      subrecipe_yield_quantity: sr.subrecipe?.yield_quantity ? Number(sr.subrecipe.yield_quantity) : undefined,
      subrecipe_yield_unit: (sr.subrecipe?.yield_unit as Unit) || undefined,
      subrecipe_category: sr.subrecipe?.category || undefined,
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
    .select('*, recipe_ingredients(*), recipe_additional_costs(*), recipe_steps(*), recipe_subrecipes:recipe_subrecipes!recipe_subrecipes_recipe_id_fkey(*, subrecipe:recipes!recipe_subrecipes_subrecipe_id_fkey(id, name, yield_quantity, yield_unit, category))')
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
    prep_time_minutes: data.prep_time_minutes ?? null,
    cook_time_minutes: data.cook_time_minutes ?? null,
    rest_time_minutes: data.rest_time_minutes ?? null,
    baking_temperature_celsius: data.baking_temperature_celsius !== null && data.baking_temperature_celsius !== undefined ? Number(data.baking_temperature_celsius) : null,
    baking_loss_percentage: Number(data.baking_loss_percentage) || 0,
    ingredients: (data.recipe_ingredients || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      quantity: Number(i.quantity) || 0,
      unit: (i.unit || 'g') as Unit,
      reference_quantity: Number(i.reference_quantity) || 1,
      reference_unit: (i.reference_unit || 'kg') as Unit,
      reference_price: Number(i.reference_price) || 0,
      calculated_cost: Number(i.calculated_cost) || 0,
      ingredient_id: i.ingredient_id ?? null,
      waste_percentage: Number(i.waste_percentage) || 0,
    })),
    additional_costs: (data.recipe_additional_costs || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount) || 0,
    })),
    steps: (data.recipe_steps || [])
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((s: any) => ({
        id: s.id,
        recipe_id: s.recipe_id,
        step_number: s.step_number,
        instruction: s.instruction,
        duration_minutes: s.duration_minutes ?? null,
        temperature_celsius: s.temperature_celsius !== null && s.temperature_celsius !== undefined ? Number(s.temperature_celsius) : null,
        equipment: s.equipment ?? null,
        notes: s.notes ?? null,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
    subrecipes: (data.recipe_subrecipes || []).map((sr: any) => ({
      id: sr.id,
      recipe_id: sr.recipe_id,
      subrecipe_id: sr.subrecipe_id,
      quantity: Number(sr.quantity) || 1,
      unit: (sr.unit || 'unidades') as Unit,
      waste_percentage: Number(sr.waste_percentage) || 0,
      position: Number(sr.position) || 0,
      notes: sr.notes ?? null,
      reference_yield_quantity: sr.reference_yield_quantity !== null && sr.reference_yield_quantity !== undefined ? Number(sr.reference_yield_quantity) : null,
      reference_yield_unit: (sr.reference_yield_unit || null) as Unit | null,
      reference_unit_cost: sr.reference_unit_cost !== null && sr.reference_unit_cost !== undefined ? Number(sr.reference_unit_cost) : null,
      reference_total_cost: sr.reference_total_cost !== null && sr.reference_total_cost !== undefined ? Number(sr.reference_total_cost) : null,
      created_at: sr.created_at,
      updated_at: sr.updated_at,
      subrecipe_name: sr.subrecipe?.name || undefined,
      subrecipe_yield_quantity: sr.subrecipe?.yield_quantity ? Number(sr.subrecipe.yield_quantity) : undefined,
      subrecipe_yield_unit: (sr.subrecipe?.yield_unit as Unit) || undefined,
      subrecipe_category: sr.subrecipe?.category || undefined,
    })),
  }

  return { data: mapped, error: null }
}

/**
 * Guarda o actualiza una receta en la base de datos con autorización estricta en servidor.
 * Requiere suscripción Pro activa.
 */
export async function saveRecipeServer(
  recipe: Recipe,
  steps?: RecipeStepInput[]
): Promise<{
  data: Recipe | null
  error: string | null
  hasConversionWarnings?: boolean
  invalidIngredientsCount?: number
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

  // Validación estricta de propiedad de los ingredientes vinculados de la biblioteca
  const libraryIds = (recipe.ingredients || [])
    .map((i) => i.ingredient_id)
    .filter((id): id is string => typeof id === 'string' && id.trim() !== '')

  if (libraryIds.length > 0) {
    const { data: ownedIngredients, error: checkError } = await supabase
      .from('kitchen_ingredients')
      .select('id')
      .eq('user_id', user.id)
      .in('id', libraryIds)

    if (checkError) {
      return { data: null, error: checkError.message || 'Error validando insumos vinculados.' }
    }

    const ownedSet = new Set((ownedIngredients || []).map((row: any) => row.id))
    for (const libId of libraryIds) {
      if (!ownedSet.has(libId)) {
        return {
          data: null,
          error: `El insumo con ID ${libId} no pertenece a tu biblioteca personal.`,
        }
      }
    }
  }

  // Validación estricta de subrecetas vinculadas: propiedad y prevención de ciclos
  const subrecipesToSave = recipe.subrecipes || []
  const subrecipeIds = subrecipesToSave
    .map((s) => s.subrecipe_id)
    .filter((id): id is string => typeof id === 'string' && id.trim() !== '')

  if (subrecipeIds.length > 0) {
    if (recipe.id && subrecipeIds.includes(recipe.id)) {
      return { data: null, error: 'Una receta no puede incluirse a sí misma como subreceta.' }
    }

    const { data: ownedSubrecipes, error: subCheckError } = await supabase
      .from('recipes')
      .select('id, name')
      .eq('user_id', user.id)
      .in('id', subrecipeIds)

    if (subCheckError) {
      return { data: null, error: subCheckError.message || 'Error validando subrecetas vinculadas.' }
    }

    const ownedSubSet = new Set((ownedSubrecipes || []).map((row: any) => row.id))
    for (const subId of subrecipeIds) {
      if (!ownedSubSet.has(subId)) {
        return {
          data: null,
          error: `La subreceta con ID ${subId} no existe o no pertenece a tu cuenta.`,
        }
      }
    }

    // Comprobación de ciclo en grafo completo del usuario
    if (recipe.id) {
      const { data: allRelations } = await supabase
        .from('recipe_subrecipes')
        .select('recipe_id, subrecipe_id')

      const graph = new Map<string, string[]>()
      for (const rel of allRelations || []) {
        if (rel.recipe_id !== recipe.id) {
          const list = graph.get(rel.recipe_id) || []
          list.push(rel.subrecipe_id)
          graph.set(rel.recipe_id, list)
        }
      }

      for (const subId of subrecipeIds) {
        const cycle = detectSubrecipeCycle(recipe.id, subId, (id) => graph.get(id) || [])
        if (cycle.hasCycle) {
          return {
            data: null,
            error: cycle.message || 'Dependencia circular detectada entre recetas.',
          }
        }
      }
    }
  }

  try {
    // Pre-validar pasos de elaboración antes de cualquier mutación para evitar eliminaciones parciales
    const stepsToSave = steps || (recipe.steps as unknown as RecipeStepInput[])
    let validSteps: Array<{
      step_number: number
      instruction: string
      duration_minutes: number | null
      temperature_celsius: number | null
      equipment: string | null
      notes: string | null
    }> = []

    if (stepsToSave && Array.isArray(stepsToSave)) {
      validSteps = stepsToSave
        .filter((s) => s.instruction && s.instruction.trim() !== '')
        .map((s, idx) => {
          if (s.duration_minutes !== undefined && s.duration_minutes !== null) {
            if (typeof s.duration_minutes !== 'number' || isNaN(s.duration_minutes) || s.duration_minutes < 0) {
              throw new Error(`La duración del paso #${idx + 1} no puede ser negativa.`)
            }
          }
          return {
            step_number: idx + 1,
            instruction: s.instruction.trim(),
            duration_minutes: s.duration_minutes ?? null,
            temperature_celsius: s.temperature_celsius ?? null,
            equipment: s.equipment ? s.equipment.trim() : null,
            notes: s.notes ? s.notes.trim() : null,
          }
        })
    }

    const validIngredients = (recipe.ingredients || []).filter((i) => i.name.trim() !== '')
    const validCosts = (recipe.additional_costs || []).filter((c) => c.name.trim() !== '')

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
      prep_time_minutes: recipe.prep_time_minutes ?? null,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      rest_time_minutes: recipe.rest_time_minutes ?? null,
      baking_temperature_celsius: recipe.baking_temperature_celsius ?? null,
      baking_loss_percentage: recipe.baking_loss_percentage ?? 0,
      updated_at: new Date().toISOString(),
    }

    const preparedIngredients = validIngredients.map((i) => {
      const waste = Number(i.waste_percentage) || 0
      const grossQty = waste > 0 && waste < 100 ? i.quantity / (1 - waste / 100) : i.quantity
      const refQtyConverted = unitConversion(i.reference_unit, i.unit, i.reference_quantity, i.density)
      const cost = refQtyConverted > 0 ? (i.reference_price / refQtyConverted) * grossQty : 0
      return {
        name: i.name.trim(),
        quantity: i.quantity,
        unit: i.unit,
        reference_quantity: i.reference_quantity,
        reference_unit: i.reference_unit,
        reference_price: i.reference_price,
        calculated_cost: Number(cost.toFixed(4)),
        ingredient_id: i.ingredient_id ?? null,
        waste_percentage: waste,
      }
    })

    const preparedCosts = validCosts.map((c) => ({
      name: c.name.trim(),
      amount: c.amount,
    }))

    const preparedSubrecipes = subrecipesToSave.map((s, idx) => ({
      subrecipe_id: s.subrecipe_id,
      quantity: Math.max(0.0001, Number(s.quantity) || 1),
      unit: s.unit || 'unidades',
      waste_percentage: Math.max(0, Math.min(99.99, Number(s.waste_percentage) || 0)),
      position: s.position ?? idx + 1,
      notes: s.notes ? s.notes.trim() : null,
      reference_yield_quantity: s.reference_yield_quantity ?? null,
      reference_yield_unit: s.reference_yield_unit ?? null,
      reference_unit_cost: s.reference_unit_cost ?? null,
      reference_total_cost: s.reference_total_cost ?? null,
    }))

    let rpcSuccess = false
    let rpcError: any = null
    try {
      const rpcRes = await supabase.rpc('save_recipe_transaction', {
        p_recipe_id: isEditing ? recipe.id : null,
        p_name: recipePayload.name,
        p_category: recipePayload.category,
        p_description: recipePayload.description,
        p_yield_quantity: recipePayload.yield_quantity,
        p_yield_unit: recipePayload.yield_unit,
        p_target_margin: recipePayload.target_margin,
        p_target_markup: recipePayload.target_markup,
        p_pricing_mode: recipePayload.pricing_mode,
        p_prep_time_minutes: recipePayload.prep_time_minutes,
        p_cook_time_minutes: recipePayload.cook_time_minutes,
        p_rest_time_minutes: recipePayload.rest_time_minutes,
        p_baking_temperature_celsius: recipePayload.baking_temperature_celsius,
        p_baking_loss_percentage: recipePayload.baking_loss_percentage,
        p_ingredients: preparedIngredients,
        p_additional_costs: preparedCosts,
        p_steps: validSteps,
        p_subrecipes: preparedSubrecipes,
      })

      if (rpcRes && !rpcRes.error && rpcRes.data) {
        savedRecipeId = rpcRes.data
        rpcSuccess = true
      } else if (rpcRes?.error) {
        rpcError = rpcRes.error
        if (!rpcRes.error.message?.includes('function') && !rpcRes.error.message?.includes('does not exist')) {
          throw new Error(rpcRes.error.message)
        }
      }
    } catch (rpcErr: any) {
      rpcError = rpcErr
      if (
        !rpcErr.message?.includes('function') &&
        !rpcErr.message?.includes('does not exist') &&
        !rpcErr.message?.includes('Cannot destructure') &&
        !rpcErr.message?.includes('rpc is not a function')
      ) {
        throw rpcErr
      }
    }

    if (!rpcSuccess) {
      if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
        throw new Error(rpcError.message)
      }

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

      // Actualizar ingredientes
      if (isEditing) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', savedRecipeId)
        await supabase.from('recipe_additional_costs').delete().eq('recipe_id', savedRecipeId)
        await supabase.from('recipe_subrecipes').delete().eq('recipe_id', savedRecipeId)
      }

      if (validIngredients.length > 0) {
        const ingredientsData = preparedIngredients.map((ing) => ({
          recipe_id: savedRecipeId,
          ...ing,
        }))
        const { error: ingError } = await supabase.from('recipe_ingredients').insert(ingredientsData)
        if (ingError) throw ingError
      }

      if (validCosts.length > 0) {
        const costsData = preparedCosts.map((c) => ({
          recipe_id: savedRecipeId,
          ...c,
        }))
        const { error: costsError } = await supabase.from('recipe_additional_costs').insert(costsData)
        if (costsError) throw costsError
      }

      if (preparedSubrecipes.length > 0) {
        const subrecipesData = preparedSubrecipes.map((sr) => ({
          recipe_id: savedRecipeId,
          ...sr,
          updated_at: new Date().toISOString(),
        }))
        const { error: subError } = await supabase.from('recipe_subrecipes').insert(subrecipesData)
        if (subError) throw subError
      }

      // Actualizar pasos
      if (stepsToSave && Array.isArray(stepsToSave)) {
        const { error: stepsDeleteError } = await supabase
          .from('recipe_steps')
          .delete()
          .eq('recipe_id', savedRecipeId)

        if (stepsDeleteError) throw stepsDeleteError

        if (validSteps.length > 0) {
          const stepsWithRecipeId = validSteps.map((s) => ({
            recipe_id: savedRecipeId,
            ...s,
            updated_at: new Date().toISOString(),
          }))
          const { error: stepsInsertError } = await supabase.from('recipe_steps').insert(stepsWithRecipeId)
          if (stepsInsertError) throw stepsInsertError
        }
      }
    }

    const fullRecipe = await getRecipeByIdServer(savedRecipeId!)
    const financials = calculateRecipeFinancials(recipe)

    return {
      data: fullRecipe.data,
      error: null,
      hasConversionWarnings: financials.hasConversionErrors,
      invalidIngredientsCount: financials.invalidIngredientsCount,
    }
  } catch (error: any) {
    console.error('Error guardando receta en servidor:', error)
    return { data: null, error: error.message || 'Error al guardar la receta' }
  }
}

/**
 * Duplica una receta existente asignándole un nuevo ID y el sufijo (Copia),
 * preservando todas sus subrecetas vinculadas sin duplicar el árbol completo.
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

  const stepsToClone: RecipeStepInput[] | undefined = original.data.steps
    ? original.data.steps.map((s) => ({
        step_number: s.step_number,
        instruction: s.instruction,
        duration_minutes: s.duration_minutes,
        temperature_celsius: s.temperature_celsius,
        equipment: s.equipment,
        notes: s.notes,
      }))
    : undefined

  const subrecipesToClone = (original.data.subrecipes || []).map((sr) => ({
    ...sr,
    id: undefined,
    recipe_id: undefined,
  }))

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
    steps: undefined,
    subrecipes: subrecipesToClone as any,
  }

  const saveResult = await saveRecipeServer(recipeToClone, stepsToClone)

  return saveResult
}

/**
 * Elimina una receta de la biblioteca del usuario.
 * Protege contra eliminación de recetas que están siendo utilizadas activamente como subrecetas.
 * Requiere suscripción Pro activa.
 */
export async function deleteRecipeServer(recipeId: string): Promise<{
  success: boolean
  error: string | null
  dependentRecipes?: Array<{ parent_recipe_id: string; parent_recipe_name: string }>
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

  // 1. Verificar si la receta se utiliza como subreceta en otras recetas del usuario
  try {
    const { data: dependents, error: depError } = await supabase.rpc('get_subrecipe_parents', {
      p_subrecipe_id: recipeId,
    })

    if (!depError && dependents && dependents.length > 0) {
      const parentNames = dependents.map((d: any) => `«${d.parent_recipe_name}»`).join(', ')
      return {
        success: false,
        error: `No se puede eliminar esta receta porque está siendo utilizada como subreceta en: ${parentNames}. Desvinculala de esas elaboraciones antes de eliminarla.`,
        dependentRecipes: dependents,
      }
    }
  } catch (rpcErr) {
    // Si la función RPC no estuviera disponible, verificar mediante consulta relacional directa
    const { data: directRelations } = await supabase
      .from('recipe_subrecipes')
      .select('recipe:recipes!recipe_subrecipes_recipe_id_fkey(id, name)')
      .eq('subrecipe_id', recipeId)

    if (directRelations && directRelations.length > 0) {
      const parentNames = directRelations.map((r: any) => `«${r.recipe?.name || 'Receta'}»`).join(', ')
      return {
        success: false,
        error: `No se puede eliminar esta receta porque está siendo utilizada como subreceta en: ${parentNames}. Desvinculala de esas elaboraciones antes de eliminarla.`,
        dependentRecipes: directRelations.map((r: any) => ({
          parent_recipe_id: r.recipe?.id,
          parent_recipe_name: r.recipe?.name,
        })),
      }
    }
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error eliminando receta en servidor:', error)
    if (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('recipe_subrecipes')) {
      return {
        success: false,
        error: 'No se puede eliminar esta receta porque está incorporada como subreceta en otra fórmula.',
      }
    }
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
