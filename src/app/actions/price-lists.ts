'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { PriceList, PriceListProduct, Category, PriceListUserStatus } from '@/components/tools/generador-listas-precios/types'

const PRO_REQUIRED_PRICE_LIST_ERROR = 'Esta función de persistencia en la nube requiere una suscripción Pro activa.'

/**
 * Consulta el estado de autenticación, suscripción Pro y cantidad de listas
 * preservadas del usuario en el servidor.
 */
export async function getPriceListUserStatusServer(): Promise<PriceListUserStatus> {
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

    // Si no es Pro, consultamos la función segura que devuelve el recuento de listas
    // sin exponer sus detalles, garantizando que el usuario sepa que sus datos existen y no se perdieron.
    const { data: countData, error: countError } = await supabase.rpc('get_user_price_list_count')
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
    console.error('Error al verificar estado de usuario en listas de precios:', error)
    return {
      isAuthenticated: false,
      isPro: false,
      userId: null,
      preservedCount: 0,
    }
  }
}

/**
 * Obtiene todas las listas de precios guardadas en la nube del usuario autenticado.
 * Requiere suscripción Pro activa.
 */
export async function getUserPriceListsServer(): Promise<{
  data: PriceList[] | null
  error: string | null
  isProRequired?: boolean
  preservedCount?: number
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        data: null,
        error: 'Debes iniciar sesión para consultar tus listas guardadas.',
      }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      const { data: count } = await supabase.rpc('get_user_price_list_count')
      return {
        data: null,
        error: PRO_REQUIRED_PRICE_LIST_ERROR,
        isProRequired: true,
        preservedCount: Number(count) || 0,
      }
    }

    const { data: listsData, error: listsError } = await supabase
      .from('price_lists')
      .select('*, price_list_categories(*), price_list_products(*)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (listsError) {
      console.error('Error cargando listas de precios en servidor:', listsError)
      return { data: null, error: listsError.message }
    }

    const formattedLists: PriceList[] = (listsData || []).map((row: any) => {
      const rawCategories = (row.price_list_categories || []) as any[]
      rawCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      const rawProducts = (row.price_list_products || []) as any[]
      rawProducts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      return {
        id: row.id,
        user_id: row.user_id,
        rubro: row.rubro || 'general',
        name: row.name || 'Lista de Precios',
        business_name: row.business_name || '',
        contact_info: row.contact_info || '',
        description: row.description || '',
        currency: row.currency || 'ARS',
        logo_url: row.logo_url || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
        categories: rawCategories.map((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sort_order || 0,
        })),
        products: rawProducts.map((p) => ({
          id: p.id,
          list_id: row.id,
          category_id: p.category_id || undefined,
          name: p.name,
          price: Number(p.price) || 0,
          code: p.code || '',
          description: p.description || '',
          duration: p.duration || '',
          variant: p.variant || '',
          unit: p.unit || '',
          sort_order: p.sort_order || 0,
        })),
      }
    })

    return { data: formattedLists, error: null }
  } catch (error: any) {
    console.error('Error inesperado al obtener listas de precios:', error)
    return { data: null, error: error?.message || 'Error inesperado del servidor' }
  }
}

/**
 * Guarda o actualiza una lista de precios en la nube (cabecera, categorías y productos).
 * Requiere Pro.
 */
export async function savePriceListServer(list: PriceList): Promise<{
  data: PriceList | null
  error: string | null
  isProRequired?: boolean
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para guardar listas en la nube.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_PRICE_LIST_ERROR, isProRequired: true }
    }

    if (!list.name?.trim()) {
      return { data: null, error: 'La lista debe tener un nombre identificatorio.' }
    }

    // 1. Upsert cabecera de la lista
    const listPayload: any = {
      user_id: user.id,
      rubro: list.rubro || 'general',
      name: list.name.trim(),
      business_name: list.business_name?.trim() || null,
      contact_info: list.contact_info?.trim() || null,
      description: list.description?.trim() || null,
      currency: list.currency || 'ARS',
      logo_url: list.logo_url || null,
      updated_at: new Date().toISOString(),
    }

    if (list.id && !list.id.startsWith('local-')) {
      listPayload.id = list.id
    }

    const { data: savedListRow, error: listError } = await supabase
      .from('price_lists')
      .upsert(listPayload)
      .select()
      .single()

    if (listError || !savedListRow) {
      console.error('Error guardando cabecera de lista:', listError)
      return { data: null, error: listError?.message || 'Error al guardar lista' }
    }

    const targetListId = savedListRow.id

    // 2. Sincronizar categorías
    // Eliminamos categorías previas de esta lista para refrescar el conjunto
    await supabase.from('price_list_categories').delete().eq('list_id', targetListId)

    const categoriesToInsert = list.categories.map((c, index) => ({
      id: c.id,
      list_id: targetListId,
      name: c.name.trim(),
      sort_order: index,
    }))

    if (categoriesToInsert.length > 0) {
      const { error: catError } = await supabase.from('price_list_categories').insert(categoriesToInsert)
      if (catError) {
        console.error('Error guardando categorías:', catError)
      }
    }

    // 3. Sincronizar productos
    await supabase.from('price_list_products').delete().eq('list_id', targetListId)

    const productsToInsert = list.products.map((p, index) => ({
      id: p.id,
      list_id: targetListId,
      category_id: p.category_id || null,
      name: p.name.trim(),
      price: Number(p.price) || 0,
      code: p.code?.trim() || null,
      description: p.description?.trim() || null,
      duration: p.duration?.trim() || null,
      variant: p.variant?.trim() || null,
      unit: p.unit?.trim() || null,
      sort_order: index,
    }))

    if (productsToInsert.length > 0) {
      const { error: prodError } = await supabase.from('price_list_products').insert(productsToInsert)
      if (prodError) {
        console.error('Error guardando productos de la lista:', prodError)
      }
    }

    const completeList: PriceList = {
      ...list,
      id: targetListId,
      user_id: user.id,
      updated_at: savedListRow.updated_at,
    }

    return { data: completeList, error: null }
  } catch (error: any) {
    console.error('Error guardando lista de precios:', error)
    return { data: null, error: error?.message || 'Error inesperado del servidor' }
  }
}

/**
 * Duplica una lista guardada en la nube con un nuevo ID y fecha.
 * Requiere Pro.
 */
export async function duplicatePriceListServer(listId: string): Promise<{
  data: PriceList | null
  error: string | null
  isProRequired?: boolean
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const isPro = await isProUser(user.id)
    if (!isPro) return { data: null, error: PRO_REQUIRED_PRICE_LIST_ERROR, isProRequired: true }

    // Obtener la lista original
    const { data: original, error: origError } = await supabase
      .from('price_lists')
      .select('*, price_list_categories(*), price_list_products(*)')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single()

    if (origError || !original) {
      return { data: null, error: 'No se encontró la lista a duplicar.' }
    }

    // Mapa de viejos IDs de categoría a nuevos IDs para preservar relaciones
    const categoryIdMap = new Map<string, string>()
    const duplicatedCategories: Category[] = (original.price_list_categories || []).map((c: any) => {
      const newCatId = crypto.randomUUID()
      categoryIdMap.set(c.id, newCatId)
      return {
        id: newCatId,
        name: c.name,
        sort_order: c.sort_order || 0,
      }
    })

    const duplicatedProducts: PriceListProduct[] = (original.price_list_products || []).map((p: any) => {
      const mappedCatId = p.category_id ? categoryIdMap.get(p.category_id) : undefined
      return {
        id: crypto.randomUUID(),
        list_id: '',
        category_id: mappedCatId,
        name: p.name,
        price: Number(p.price) || 0,
        code: p.code || '',
        description: p.description || '',
        duration: p.duration || '',
        variant: p.variant || '',
        unit: p.unit || '',
        sort_order: p.sort_order || 0,
      }
    })

    const newList: PriceList = {
      id: crypto.randomUUID(),
      user_id: user.id,
      rubro: original.rubro,
      name: `${original.name} (Copia)`,
      business_name: original.business_name || '',
      contact_info: original.contact_info || '',
      description: original.description || '',
      currency: original.currency || 'ARS',
      logo_url: original.logo_url || '',
      categories: duplicatedCategories,
      products: duplicatedProducts,
    }

    return await savePriceListServer(newList)
  } catch (error: any) {
    console.error('Error duplicando lista de precios:', error)
    return { data: null, error: error?.message || 'Error inesperado al duplicar lista' }
  }
}

/**
 * Elimina una lista de la nube.
 * Requiere Pro.
 */
export async function deletePriceListServer(id: string): Promise<{
  success: boolean
  error: string | null
  isProRequired?: boolean
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autenticado' }

    const isPro = await isProUser(user.id)
    if (!isPro) return { success: false, error: PRO_REQUIRED_PRICE_LIST_ERROR, isProRequired: true }

    const { error } = await supabase
      .from('price_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error eliminando lista de precios:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error eliminando lista de precios:', error)
    return { success: false, error: error?.message || 'Error inesperado' }
  }
}
