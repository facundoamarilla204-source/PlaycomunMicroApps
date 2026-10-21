'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { RecipeStep, RecipeStepInput } from '@/lib/gastronomia/types'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'

/**
 * Verifica si una receta pertenece al usuario autenticado.
 */
async function verifyRecipeOwnership(supabase: any, recipeId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .maybeSingle()

  return !error && !!data
}

/**
 * Consulta los pasos de elaboración ordenados de una receta propia.
 */
export async function getRecipeStepsServer(recipeId: string): Promise<{
  data: RecipeStep[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: 'Debes iniciar sesión.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: [], error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const ownsRecipe = await verifyRecipeOwnership(supabase, recipeId, user.id)
    if (!ownsRecipe) {
      return { data: [], error: 'Receta no encontrada o no tienes permisos sobre ella.' }
    }

    const { data, error } = await supabase
      .from('recipe_steps')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('step_number', { ascending: true })

    if (error) {
      return { data: [], error: error.message || 'Error al obtener los pasos de la receta' }
    }

    return { data: (data || []) as RecipeStep[], error: null }
  } catch (error: any) {
    return { data: [], error: error.message || 'Error del servidor' }
  }
}

/**
 * Guarda o reemplaza de forma ordenada y atómica la lista completa de pasos de elaboración de una receta.
 */
export async function saveRecipeStepsServer(
  recipeId: string,
  steps: RecipeStepInput[]
): Promise<{
  data: RecipeStep[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: 'Debes iniciar sesión para guardar los pasos.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: [], error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const ownsRecipe = await verifyRecipeOwnership(supabase, recipeId, user.id)
    if (!ownsRecipe) {
      return { data: [], error: 'Receta no encontrada o acceso no autorizado.' }
    }

    // Validar pasos
    const validatedSteps = steps.map((s, idx) => {
      if (!s.instruction || !s.instruction.trim()) {
        throw new Error(`El paso #${idx + 1} debe contener una instrucción de elaboración.`)
      }

      if (s.duration_minutes !== undefined && s.duration_minutes !== null) {
        if (typeof s.duration_minutes !== 'number' || isNaN(s.duration_minutes) || s.duration_minutes < 0) {
          throw new Error(`La duración del paso #${idx + 1} no puede ser negativa.`)
        }
      }

      return {
        recipe_id: recipeId,
        step_number: idx + 1,
        instruction: s.instruction.trim(),
        duration_minutes: s.duration_minutes ?? null,
        temperature_celsius: s.temperature_celsius ?? null,
        equipment: s.equipment ? s.equipment.trim() : null,
        notes: s.notes ? s.notes.trim() : null,
        updated_at: new Date().toISOString(),
      }
    })

    // Eliminar pasos antiguos y reinsertar con el nuevo orden
    const { error: deleteError } = await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId)
    if (deleteError) {
      return { data: [], error: deleteError.message }
    }

    if (validatedSteps.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('recipe_steps')
        .insert(validatedSteps)
        .select('*')
        .order('step_number', { ascending: true })

      if (insertError) {
        return { data: [], error: insertError.message }
      }

      return { data: (insertedData || []) as RecipeStep[], error: null }
    }

    return { data: [], error: null }
  } catch (error: any) {
    return { data: [], error: error.message || 'Error del servidor al guardar pasos' }
  }
}

/**
 * Elimina un paso individual de una receta y renumera los restantes.
 */
export async function deleteRecipeStepServer(
  recipeId: string,
  stepId: string
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

    const ownsRecipe = await verifyRecipeOwnership(supabase, recipeId, user.id)
    if (!ownsRecipe) {
      return { success: false, error: 'Receta no encontrada o no autorizada.' }
    }

    const { error: delError } = await supabase
      .from('recipe_steps')
      .delete()
      .eq('id', stepId)
      .eq('recipe_id', recipeId)

    if (delError) {
      return { success: false, error: delError.message }
    }

    // Renumerar los pasos restantes
    const { data: remainingSteps } = await supabase
      .from('recipe_steps')
      .select('id')
      .eq('recipe_id', recipeId)
      .order('step_number', { ascending: true })

    if (remainingSteps && remainingSteps.length > 0) {
      for (let i = 0; i < remainingSteps.length; i++) {
        await supabase
          .from('recipe_steps')
          .update({ step_number: i + 1, updated_at: new Date().toISOString() })
          .eq('id', remainingSteps[i].id)
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
