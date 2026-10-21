'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import {
  KitchenIngredient,
  CreateKitchenIngredientInput,
  UpdateKitchenIngredientInput,
  KitchenIngredientPriceHistory,
} from '@/lib/gastronomia/types'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'

/**
 * Consulta la biblioteca de ingredientes del usuario autenticado con filtros opcionales.
 * Requiere suscripción Pro activa.
 */
export async function getKitchenIngredientsServer(options?: {
  search?: string
  category?: string
}): Promise<{
  data: KitchenIngredient[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: 'Debes iniciar sesión para acceder a tu biblioteca de ingredientes.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: [], error: PRO_REQUIRED_RECIPE_ERROR }
    }

    let query = supabase
      .from('kitchen_ingredients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (options?.category && options.category.trim() !== '') {
      query = query.eq('category', options.category.trim())
    }

    if (options?.search && options.search.trim() !== '') {
      query = query.ilike('name', `%${options.search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al consultar kitchen_ingredients:', error)
      return { data: [], error: error.message || 'Error al obtener los ingredientes' }
    }

    return {
      data: (data || []) as KitchenIngredient[],
      error: null,
    }
  } catch (error: any) {
    console.error('Error inesperado en getKitchenIngredientsServer:', error)
    return { data: [], error: error.message || 'Error del servidor' }
  }
}

/**
 * Consulta un ingrediente por ID verificando propiedad y plan Pro.
 */
export async function getKitchenIngredientByIdServer(id: string): Promise<{
  data: KitchenIngredient | null
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

    const { data, error } = await supabase
      .from('kitchen_ingredients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as KitchenIngredient | null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Crea un ingrediente nuevo en la biblioteca personal.
 */
export async function createKitchenIngredientServer(
  input: CreateKitchenIngredientInput
): Promise<{
  data: KitchenIngredient | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para registrar ingredientes.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // Validaciones de negocio
    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'El nombre del ingrediente es obligatorio.' }
    }

    if (typeof input.package_quantity !== 'number' || isNaN(input.package_quantity) || input.package_quantity <= 0) {
      return { data: null, error: 'La cantidad de presentación debe ser un número positivo mayor a 0.' }
    }

    if (typeof input.current_price !== 'number' || isNaN(input.current_price) || input.current_price < 0) {
      return { data: null, error: 'El precio vigente no puede ser negativo.' }
    }

    if (input.density_g_ml !== undefined && input.density_g_ml !== null) {
      if (typeof input.density_g_ml !== 'number' || isNaN(input.density_g_ml) || input.density_g_ml <= 0) {
        return { data: null, error: 'La densidad (g/ml) debe ser un número positivo mayor a 0 cuando se especifique.' }
      }
    }

    if (input.estimated_water_percentage !== undefined && input.estimated_water_percentage !== null) {
      if (
        typeof input.estimated_water_percentage !== 'number' ||
        isNaN(input.estimated_water_percentage) ||
        input.estimated_water_percentage < 0 ||
        input.estimated_water_percentage > 100
      ) {
        return { data: null, error: 'El porcentaje estimado de agua debe estar entre 0% y 100%.' }
      }
    }

    const payload = {
      user_id: user.id,
      name: input.name.trim(),
      category: input.category ? input.category.trim() : null,
      package_unit: input.package_unit,
      package_quantity: input.package_quantity,
      current_price: input.current_price,
      density_g_ml: input.density_g_ml ?? null,
      density_source: input.density_source ? input.density_source.trim() : null,
      is_flour: input.is_flour ?? false,
      is_water: input.is_water ?? false,
      estimated_water_percentage: input.estimated_water_percentage ?? null,
      water_percentage_source: input.water_percentage_source ? input.water_percentage_source.trim() : null,
      brand: input.brand ? input.brand.trim() : null,
      notes: input.notes ? input.notes.trim() : null,
    }

    const { data, error } = await supabase
      .from('kitchen_ingredients')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('Error al insertar kitchen_ingredient:', error)
      return { data: null, error: error.message || 'Error al guardar el ingrediente' }
    }

    return { data: data as KitchenIngredient, error: null }
  } catch (error: any) {
    console.error('Error inesperado en createKitchenIngredientServer:', error)
    return { data: null, error: error.message || 'Error del servidor' }
  }
}

/**
 * Actualiza un ingrediente existente de la biblioteca.
 * Si el precio cambia, el trigger de PostgreSQL registra automáticamente el historial.
 */
export async function updateKitchenIngredientServer(
  id: string,
  input: UpdateKitchenIngredientInput
): Promise<{
  data: KitchenIngredient | null
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

    // Validaciones
    if (input.name !== undefined && (!input.name || !input.name.trim())) {
      return { data: null, error: 'El nombre no puede quedar vacío.' }
    }

    if (input.package_quantity !== undefined) {
      if (typeof input.package_quantity !== 'number' || isNaN(input.package_quantity) || input.package_quantity <= 0) {
        return { data: null, error: 'La cantidad debe ser mayor a 0.' }
      }
    }

    if (input.current_price !== undefined) {
      if (typeof input.current_price !== 'number' || isNaN(input.current_price) || input.current_price < 0) {
        return { data: null, error: 'El precio no puede ser negativo.' }
      }
    }

    if (input.density_g_ml !== undefined && input.density_g_ml !== null) {
      if (typeof input.density_g_ml !== 'number' || isNaN(input.density_g_ml) || input.density_g_ml <= 0) {
        return { data: null, error: 'La densidad debe ser positiva mayor a 0.' }
      }
    }

    if (input.estimated_water_percentage !== undefined && input.estimated_water_percentage !== null) {
      if (
        typeof input.estimated_water_percentage !== 'number' ||
        isNaN(input.estimated_water_percentage) ||
        input.estimated_water_percentage < 0 ||
        input.estimated_water_percentage > 100
      ) {
        return { data: null, error: 'El porcentaje de agua debe estar entre 0% y 100%.' }
      }
    }

    const updatePayload: Record<string, any> = {}
    if (input.name !== undefined) updatePayload.name = input.name.trim()
    if (input.category !== undefined) updatePayload.category = input.category ? input.category.trim() : null
    if (input.package_unit !== undefined) updatePayload.package_unit = input.package_unit
    if (input.package_quantity !== undefined) updatePayload.package_quantity = input.package_quantity
    if (input.current_price !== undefined) updatePayload.current_price = input.current_price
    if (input.density_g_ml !== undefined) updatePayload.density_g_ml = input.density_g_ml
    if (input.density_source !== undefined) updatePayload.density_source = input.density_source ? input.density_source.trim() : null
    if (input.is_flour !== undefined) updatePayload.is_flour = input.is_flour
    if (input.is_water !== undefined) updatePayload.is_water = input.is_water
    if (input.estimated_water_percentage !== undefined) updatePayload.estimated_water_percentage = input.estimated_water_percentage
    if (input.water_percentage_source !== undefined) updatePayload.water_percentage_source = input.water_percentage_source ? input.water_percentage_source.trim() : null
    if (input.brand !== undefined) updatePayload.brand = input.brand ? input.brand.trim() : null
    if (input.notes !== undefined) updatePayload.notes = input.notes ? input.notes.trim() : null

    const { data, error } = await supabase
      .from('kitchen_ingredients')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      return { data: null, error: error.message || 'Error al actualizar ingrediente' }
    }

    return { data: data as KitchenIngredient, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Error del servidor' }
  }
}

/**
 * Elimina un ingrediente de la biblioteca de forma segura.
 * Las recetas existentes que referenciaban este ingrediente conservan sus datos intactos
 * (su foreign key se coloca en NULL mediante ON DELETE SET NULL).
 */
export async function deleteKitchenIngredientServer(id: string): Promise<{
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

    const { error } = await supabase
      .from('kitchen_ingredients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message || 'Error al eliminar ingrediente' }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error del servidor' }
  }
}

/**
 * Consulta el historial cronológico inmutable de cambios de precio de un ingrediente.
 */
export async function getIngredientPriceHistoryServer(ingredientId: string): Promise<{
  data: KitchenIngredientPriceHistory[]
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

    const { data, error } = await supabase
      .from('kitchen_ingredient_price_history')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message || 'Error al obtener historial de precios' }
    }

    return { data: (data || []) as KitchenIngredientPriceHistory[], error: null }
  } catch (error: any) {
    return { data: [], error: error.message || 'Error del servidor' }
  }
}

/**
 * Consulta la cantidad de ingredientes que el usuario tiene registrados
 * mediante función RPC segura.
 */
export async function getKitchenIngredientsCountServer(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_user_kitchen_ingredients_count')
    if (error || typeof data !== 'number') {
      return 0
    }
    return data
  } catch {
    return 0
  }
}
