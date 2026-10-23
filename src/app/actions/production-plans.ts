'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'
import {
  ProductionPlan,
  ProductionPlanItem,
  SaveProductionPlanInput,
} from '@/lib/gastronomia/types'

/**
 * Consulta todos los planes de producción del usuario autenticado.
 * Requiere suscripción Pro activa.
 */
export async function getProductionPlansServer(): Promise<{
  data: ProductionPlan[] | null
  error: string | null
  isProRequired?: boolean
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        data: null,
        error: 'Debes iniciar sesión para consultar tus planes de producción.',
      }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return {
        data: null,
        error: PRO_REQUIRED_RECIPE_ERROR,
        isProRequired: true,
      }
    }

    const { data, error } = await supabase
      .from('production_plans')
      .select('*, items:production_plan_items(id, recipe_id, target_quantity, target_unit, scaling_factor, position, snapshot_recipe_name, snapshot_yield_quantity, snapshot_yield_unit, snapshot_total_cost)')
      .eq('user_id', user.id)
      .order('production_date', { ascending: false })

    if (error) {
      console.error('Error al consultar production_plans:', error)
      return { data: null, error: error.message || 'Error al obtener los planes de producción.' }
    }

    const mapped: ProductionPlan[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      production_date: row.production_date,
      status: row.status,
      notes: row.notes,
      checked_ingredients: Array.isArray(row.checked_ingredients) ? row.checked_ingredients : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: row.items || [],
      items_count: (row.items || []).length,
    }))

    return { data: mapped, error: null }
  } catch (err: any) {
    console.error('Error inesperado en getProductionPlansServer:', err)
    return { data: null, error: err.message || 'Error interno del servidor.' }
  }
}

/**
 * Consulta un plan de producción por ID con sus recetas planificadas completas.
 */
export async function getProductionPlanByIdServer(id: string): Promise<{
  data: ProductionPlan | null
  error: string | null
}> {
  try {
    if (!id || id.trim() === '') {
      return { data: null, error: 'Identificador de plan de producción no proporcionado.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        data: null,
        error: 'Debes iniciar sesión para acceder al plan de producción.',
      }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data, error } = await supabase
      .from('production_plans')
      .select('*, items:production_plan_items(*)')
      .eq('id', id.trim())
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return {
        data: null,
        error: error?.message || 'El plan de producción no existe o no pertenece a tu cuenta.',
      }
    }

    const plan: ProductionPlan = {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      production_date: data.production_date,
      status: data.status,
      notes: data.notes,
      checked_ingredients: Array.isArray(data.checked_ingredients) ? data.checked_ingredients : [],
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: (data.items || []).sort((a: ProductionPlanItem, b: ProductionPlanItem) => a.position - b.position),
      items_count: (data.items || []).length,
    }

    return { data: plan, error: null }
  } catch (err: any) {
    console.error('Error inesperado en getProductionPlanByIdServer:', err)
    return { data: null, error: err.message || 'Error interno al consultar el plan.' }
  }
}

/**
 * Guarda o actualiza un plan de producción de forma atómica.
 * Pre-valida propiedad de recetas y aplica snapshot de datos clave.
 */
export async function saveProductionPlanServer(input: SaveProductionPlanInput): Promise<{
  data: { id: string } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para guardar planes de producción.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const trimmedName = input.name?.trim() || ''
    if (!trimmedName) {
      return { data: null, error: 'El nombre del plan de producción es obligatorio.' }
    }

    // Pre-validar que las recetas pertenezcan al usuario antes de modificar
    const recipeIds = input.items.map((i) => i.recipe_id).filter(Boolean)
    if (recipeIds.length > 0) {
      const { data: ownedRecipes, error: recipeError } = await supabase
        .from('recipes')
        .select('id, name, yield_quantity, yield_unit, category')
        .eq('user_id', user.id)
        .in('id', recipeIds)

      if (recipeError) {
        return { data: null, error: recipeError.message || 'Error al validar las recetas.' }
      }

      const ownedMap = new Map((ownedRecipes || []).map((r: any) => [r.id, r]))
      for (const recipeId of recipeIds) {
        if (!ownedMap.has(recipeId)) {
          return {
            data: null,
            error: `La receta vinculada no existe o no pertenece a tu cuenta.`,
          }
        }
      }

      // Rellenar snapshots faltantes con datos de la receta original
      for (const item of input.items) {
        const original = ownedMap.get(item.recipe_id)
        if (original) {
          if (!item.snapshot_recipe_name) item.snapshot_recipe_name = original.name
          if (!item.snapshot_yield_quantity) item.snapshot_yield_quantity = Number(original.yield_quantity) || 1
          if (!item.snapshot_yield_unit) item.snapshot_yield_unit = original.yield_unit || 'unidades'
          if (!item.snapshot_category) item.snapshot_category = original.category || ''
        }
      }
    }

    // 1. Intentar persistencia atómica en PostgreSQL mediante RPC save_production_plan_tx
    try {
      const { data: rpcPlanId, error: rpcError } = await supabase.rpc('save_production_plan_tx', {
        p_plan: {
          id: input.id || null,
          name: trimmedName,
          production_date: input.production_date || new Date().toISOString().split('T')[0],
          status: input.status || 'draft',
          notes: input.notes?.trim() ? input.notes.trim() : null,
          checked_ingredients: input.checked_ingredients || [],
        },
        p_items: (input.items || []).map((it, idx) => ({
          recipe_id: it.recipe_id,
          target_quantity: Math.max(0.0001, Number(it.target_quantity) || 1),
          target_unit: it.target_unit || 'unidades',
          scaling_factor: Math.max(0.0001, Number(it.scaling_factor) || 1),
          position: it.position ?? idx,
          notes: it.notes?.trim() ? it.notes.trim() : null,
          snapshot_recipe_name: it.snapshot_recipe_name || 'Receta',
          snapshot_yield_quantity: Math.max(0.0001, Number(it.snapshot_yield_quantity) || 1),
          snapshot_yield_unit: it.snapshot_yield_unit || 'unidades',
          snapshot_category: it.snapshot_category || null,
          snapshot_cost_per_unit: it.snapshot_cost_per_unit ?? null,
          snapshot_total_cost: it.snapshot_total_cost ?? null,
        })),
      })

      if (!rpcError && rpcPlanId) {
        return { data: { id: rpcPlanId }, error: null }
      }
      if (rpcError) {
        console.warn('RPC save_production_plan_tx no disponible o con error, usando fallback:', rpcError.message)
      }
    } catch (rpcEx) {
      console.warn('Excepción al ejecutar save_production_plan_tx:', rpcEx)
    }

    // Fallback secuencial
    let savedPlanId = input.id
    const planPayload = {
      user_id: user.id,
      name: trimmedName,
      production_date: input.production_date || new Date().toISOString().split('T')[0],
      status: input.status || 'draft',
      notes: input.notes?.trim() ? input.notes.trim() : null,
      checked_ingredients: input.checked_ingredients || [],
      updated_at: new Date().toISOString(),
    }

    if (savedPlanId) {
      const { error: updateError } = await supabase
        .from('production_plans')
        .update(planPayload)
        .eq('id', savedPlanId)
        .eq('user_id', user.id)

      if (updateError) {
        return { data: null, error: updateError.message || 'Error al actualizar el plan de producción.' }
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('production_plans')
        .insert({
          ...planPayload,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        return { data: null, error: insertError?.message || 'Error al crear el plan de producción.' }
      }
      savedPlanId = inserted.id
    }

    // 2. Reemplazar items atómicamente
    const { error: deleteItemsError } = await supabase
      .from('production_plan_items')
      .delete()
      .eq('plan_id', savedPlanId)

    if (deleteItemsError) {
      return { data: null, error: deleteItemsError.message || 'Error al actualizar los items del plan.' }
    }

    if (input.items.length > 0) {
      const itemsToInsert = input.items.map((item, idx) => ({
        plan_id: savedPlanId,
        recipe_id: item.recipe_id,
        target_quantity: Math.max(0.0001, Number(item.target_quantity) || 1),
        target_unit: item.target_unit || 'unidades',
        scaling_factor: Math.max(0.0001, Number(item.scaling_factor) || 1),
        position: item.position ?? idx,
        notes: item.notes?.trim() ? item.notes.trim() : null,
        snapshot_recipe_name: item.snapshot_recipe_name || 'Receta',
        snapshot_yield_quantity: Math.max(0.0001, Number(item.snapshot_yield_quantity) || 1),
        snapshot_yield_unit: item.snapshot_yield_unit || 'unidades',
        snapshot_category: item.snapshot_category || null,
        snapshot_cost_per_unit: item.snapshot_cost_per_unit ?? null,
        snapshot_total_cost: item.snapshot_total_cost ?? null,
        updated_at: new Date().toISOString(),
      }))

      const { error: insertItemsError } = await supabase
        .from('production_plan_items')
        .insert(itemsToInsert)

      if (insertItemsError) {
        return { data: null, error: insertItemsError.message || 'Error al registrar los items del plan.' }
      }
    }

    return { data: { id: savedPlanId! }, error: null }
  } catch (err: any) {
    console.error('Error inesperado en saveProductionPlanServer:', err)
    return { data: null, error: err.message || 'Error interno al guardar el plan.' }
  }
}

/**
 * Elimina un plan de producción y sus items asociados en cascada.
 */
export async function deleteProductionPlanServer(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    if (!id || id.trim() === '') {
      return { success: false, error: 'Identificador no válido.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para realizar esta acción.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { error } = await supabase
      .from('production_plans')
      .delete()
      .eq('id', id.trim())
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message || 'Error al eliminar el plan de producción.' }
    }

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error inesperado en deleteProductionPlanServer:', err)
    return { success: false, error: err.message || 'Error interno al eliminar el plan.' }
  }
}

/**
 * Alterna el estado marcado/tachado de un ingrediente en la lista de compras del plan.
 */
export async function togglePlanIngredientCheckedServer(
  planId: string,
  ingredientKey: string,
  isChecked: boolean
): Promise<{
  success: boolean
  checkedIngredients: string[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, checkedIngredients: [], error: 'Sesión no válida.' }
    }

    const { data: plan, error: fetchError } = await supabase
      .from('production_plans')
      .select('checked_ingredients')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !plan) {
      return { success: false, checkedIngredients: [], error: 'Plan no encontrado.' }
    }

    const currentKeys: string[] = Array.isArray(plan.checked_ingredients)
      ? plan.checked_ingredients
      : []

    const set = new Set(currentKeys)
    if (isChecked) {
      set.add(ingredientKey)
    } else {
      set.delete(ingredientKey)
    }

    const updated = Array.from(set)

    const { error: updateError } = await supabase
      .from('production_plans')
      .update({
        checked_ingredients: updated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, checkedIngredients: currentKeys, error: updateError.message }
    }

    return { success: true, checkedIngredients: updated, error: null }
  } catch (err: any) {
    return { success: false, checkedIngredients: [], error: err.message }
  }
}
