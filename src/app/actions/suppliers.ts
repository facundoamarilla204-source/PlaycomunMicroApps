'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'
import type { Supplier, SupplierIngredient } from '@/lib/gastronomia/types'

/**
 * Obtiene todos los proveedores del usuario autenticado.
 */
export async function getSuppliersServer(): Promise<{
  data: Supplier[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para consultar proveedores.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*, ingredients:supplier_ingredients(id)')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    const mapped: Supplier[] = (data || []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      name: s.name,
      contact_name: s.contact_name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      notes: s.notes,
      is_active: s.is_active,
      created_at: s.created_at,
      updated_at: s.updated_at,
      ingredients_count: (s.ingredients || []).length,
    }))

    return { data: mapped, error: null }
  } catch (err: any) {
    console.error('Error en getSuppliersServer:', err)
    return { data: null, error: err.message || 'Error al obtener proveedores.' }
  }
}

/**
 * Obtiene un proveedor por ID con todas sus presentaciones de ingredientes.
 */
export async function getSupplierByIdServer(id: string): Promise<{
  data: {
    supplier: Supplier
    ingredients: SupplierIngredient[]
  } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para consultar el proveedor.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data: s, error: sError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id.trim())
      .eq('user_id', user.id)
      .single()

    if (sError || !s) {
      return { data: null, error: sError?.message || 'Proveedor no encontrado.' }
    }

    const { data: siData, error: siError } = await supabase
      .from('supplier_ingredients')
      .select('*, ingredient:kitchen_ingredients(*)')
      .eq('supplier_id', s.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (siError) {
      return { data: null, error: siError.message }
    }

    const supplier: Supplier = {
      id: s.id,
      user_id: s.user_id,
      name: s.name,
      contact_name: s.contact_name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      notes: s.notes,
      is_active: s.is_active,
      created_at: s.created_at,
      updated_at: s.updated_at,
      ingredients_count: (siData || []).length,
    }

    const ingredients: SupplierIngredient[] = (siData || []).map((si: any) => ({
      id: si.id,
      user_id: si.user_id,
      supplier_id: si.supplier_id,
      ingredient_id: si.ingredient_id,
      package_size: Number(si.package_size) || 1,
      package_unit: si.package_unit || 'kg',
      price: Number(si.price) || 0,
      supplier_code: si.supplier_code,
      notes: si.notes,
      is_preferred: !!si.is_preferred,
      last_purchased_at: si.last_purchased_at,
      created_at: si.created_at,
      updated_at: si.updated_at,
      ingredient: si.ingredient || undefined,
    }))

    return { data: { supplier, ingredients }, error: null }
  } catch (err: any) {
    console.error('Error en getSupplierByIdServer:', err)
    return { data: null, error: err.message || 'Error al obtener el proveedor.' }
  }
}

/**
 * Guarda o actualiza un proveedor.
 */
export async function saveSupplierServer(supplier: {
  id?: string
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active?: boolean
}): Promise<{
  data: Supplier | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para guardar proveedores.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const trimmedName = supplier.name?.trim() || ''
    if (!trimmedName) {
      return { data: null, error: 'El nombre del proveedor es obligatorio.' }
    }

    const payload = {
      user_id: user.id,
      name: trimmedName,
      contact_name: supplier.contact_name?.trim() || null,
      phone: supplier.phone?.trim() || null,
      email: supplier.email?.trim() || null,
      address: supplier.address?.trim() || null,
      notes: supplier.notes?.trim() || null,
      is_active: supplier.is_active !== undefined ? supplier.is_active : true,
      updated_at: new Date().toISOString(),
    }

    if (supplier.id) {
      const { data, error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', supplier.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error || !data) {
        return { data: null, error: error?.message || 'Error al actualizar el proveedor.' }
      }
      return { data, error: null }
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !data) {
        return { data: null, error: error?.message || 'Error al crear el proveedor.' }
      }
      return { data, error: null }
    }
  } catch (err: any) {
    console.error('Error en saveSupplierServer:', err)
    return { data: null, error: err.message || 'Error al guardar el proveedor.' }
  }
}

/**
 * Elimina un proveedor si pertenece al usuario autenticado.
 */
export async function deleteSupplierServer(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para eliminar proveedores.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error en deleteSupplierServer:', err)
    return { success: false, error: err.message || 'Error al eliminar el proveedor.' }
  }
}

/**
 * Guarda o actualiza una presentación comercial de proveedor para un ingrediente.
 */
export async function saveSupplierIngredientServer(data: {
  id?: string
  supplier_id: string
  ingredient_id: string
  package_size: number
  package_unit: string
  price: number
  supplier_code?: string | null
  notes?: string | null
  is_preferred?: boolean
}): Promise<{
  data: SupplierIngredient | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para asociar insumos.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    if (data.package_size <= 0) {
      return { data: null, error: 'El tamaño de presentación debe ser mayor a cero.' }
    }

    if (data.price < 0) {
      return { data: null, error: 'El precio no puede ser negativo.' }
    }

    const payload = {
      user_id: user.id,
      supplier_id: data.supplier_id,
      ingredient_id: data.ingredient_id,
      package_size: Number(data.package_size),
      package_unit: data.package_unit.trim() || 'kg',
      price: Number(data.price),
      supplier_code: data.supplier_code?.trim() || null,
      notes: data.notes?.trim() || null,
      is_preferred: !!data.is_preferred,
      updated_at: new Date().toISOString(),
    }

    // Si se marca como preferido, desmarcar otros preferidos del mismo ingrediente
    if (payload.is_preferred) {
      await supabase
        .from('supplier_ingredients')
        .update({ is_preferred: false })
        .eq('ingredient_id', data.ingredient_id)
        .eq('user_id', user.id)
    }

    if (data.id) {
      const { data: updated, error } = await supabase
        .from('supplier_ingredients')
        .update(payload)
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error || !updated) {
        return { data: null, error: error?.message || 'Error al actualizar la presentación.' }
      }
      return { data: updated, error: null }
    } else {
      const { data: inserted, error } = await supabase
        .from('supplier_ingredients')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !inserted) {
        return { data: null, error: error?.message || 'Error al crear la presentación.' }
      }
      return { data: inserted, error: null }
    }
  } catch (err: any) {
    console.error('Error en saveSupplierIngredientServer:', err)
    return { data: null, error: err.message || 'Error al guardar la presentación.' }
  }
}

/**
 * Elimina una presentación comercial de un proveedor.
 */
export async function deleteSupplierIngredientServer(id: string): Promise<{
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

    const { error } = await supabase
      .from('supplier_ingredients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Consulta un mapa agrupado de ingredientes con sus proveedores y presentaciones.
 */
export async function getSupplierIngredientsMapServer(): Promise<{
  data: Record<string, SupplierIngredient[]> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data, error } = await supabase
      .from('supplier_ingredients')
      .select('*, supplier:suppliers(id, name, is_active)')
      .eq('user_id', user.id)

    if (error) return { data: null, error: error.message }

    const map: Record<string, SupplierIngredient[]> = {}
    for (const item of data || []) {
      if (!map[item.ingredient_id]) {
        map[item.ingredient_id] = []
      }
      map[item.ingredient_id].push({
        ...item,
        supplier: item.supplier,
      })
    }

    return { data: map, error: null }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}
