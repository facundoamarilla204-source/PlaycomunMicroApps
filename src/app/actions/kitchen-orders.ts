'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'
import { revalidatePath } from 'next/cache'
import type {
  KitchenClient,
  SaveKitchenClientInput,
  KitchenOrder,
  KitchenOrderItem,
  KitchenOrderStatus,
  SaveKitchenOrderInput
} from '@/lib/gastronomia/types'
import { validateOrderStatusTransition } from '@/lib/gastronomia/orders'

// ==============================================================================
// 1. GESTIÓN DE CLIENTES
// ==============================================================================

/**
 * Obtiene el directorio de clientes del usuario autenticado.
 */
export async function getKitchenClientsServer(options?: {
  includeInactive?: boolean
}): Promise<{
  data: KitchenClient[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para consultar clientes.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    let query = supabase
      .from('kitchen_clients')
      .select('*, orders:kitchen_orders(id)')
      .eq('user_id', user.id)

    if (!options?.includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    const clients: KitchenClient[] = (data || []).map((c: any) => ({
      id: c.id,
      user_id: c.user_id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      notes: c.notes,
      is_active: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
      orders_count: (c.orders || []).length,
    }))

    return { data: clients, error: null }
  } catch (err: any) {
    console.error('Error en getKitchenClientsServer:', err)
    return { data: null, error: err.message || 'Error al consultar clientes.' }
  }
}

/**
 * Obtiene un cliente por su ID.
 */
export async function getKitchenClientByIdServer(id: string): Promise<{
  data: KitchenClient | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data: client, error } = await supabase
      .from('kitchen_clients')
      .select('*, orders:kitchen_orders(id)')
      .eq('id', id.trim())
      .eq('user_id', user.id)
      .single()

    if (error || !client) {
      return { data: null, error: error?.message || 'Cliente no encontrado.' }
    }

    return {
      data: {
        id: client.id,
        user_id: client.user_id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        notes: client.notes,
        is_active: client.is_active,
        created_at: client.created_at,
        updated_at: client.updated_at,
        orders_count: (client.orders || []).length,
      },
      error: null,
    }
  } catch (err: any) {
    console.error('Error en getKitchenClientByIdServer:', err)
    return { data: null, error: err.message || 'Error al consultar cliente.' }
  }
}

/**
 * Guarda o actualiza un cliente gastronómico.
 */
export async function saveKitchenClientServer(
  input: SaveKitchenClientInput
): Promise<{
  data: KitchenClient | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para guardar clientes.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const name = input.name?.trim()
    if (!name) {
      return { data: null, error: 'El nombre del cliente es obligatorio.' }
    }

    const payload = {
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      updated_at: new Date().toISOString(),
    }

    let res
    if (input.id) {
      res = await supabase
        .from('kitchen_clients')
        .update(payload)
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      res = await supabase
        .from('kitchen_clients')
        .insert({
          ...payload,
          user_id: user.id,
        })
        .select()
        .single()
    }

    if (res.error) {
      return { data: null, error: res.error.message }
    }

    revalidatePath('/cocina-pro/clientes')
    revalidatePath('/cocina-pro/pedidos')
    revalidatePath('/cocina-pro/calendario')

    return {
      data: {
        id: res.data.id,
        user_id: res.data.user_id,
        name: res.data.name,
        phone: res.data.phone,
        email: res.data.email,
        address: res.data.address,
        notes: res.data.notes,
        is_active: res.data.is_active,
        created_at: res.data.created_at,
        updated_at: res.data.updated_at,
      },
      error: null,
    }
  } catch (err: any) {
    console.error('Error en saveKitchenClientServer:', err)
    return { data: null, error: err.message || 'Error al guardar cliente.' }
  }
}

/**
 * Desactiva o reactiva un cliente sin eliminar su historial de pedidos.
 */
export async function toggleKitchenClientActiveServer(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { error } = await supabase
      .from('kitchen_clients')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/cocina-pro/clientes')
    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar cliente.' }
  }
}

/**
 * Elimina un cliente solo si no tiene pedidos históricos asociados.
 */
export async function deleteKitchenClientServer(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // Verificar si tiene pedidos asociados
    const { count, error: countErr } = await supabase
      .from('kitchen_orders')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', id)
      .eq('user_id', user.id)

    if (countErr) {
      return { success: false, error: countErr.message }
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `El cliente tiene ${count} pedido(s) registrado(s). Puedes desactivarlo para conservar el historial comercial sin borrarlo.`,
      }
    }

    const { error } = await supabase
      .from('kitchen_clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/cocina-pro/clientes')
    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar cliente.' }
  }
}

// ==============================================================================
// 2. GESTIÓN DE PEDIDOS COMERCIALES
// ==============================================================================

/**
 * Obtiene la lista de pedidos con filtros opcionales.
 */
export async function getKitchenOrdersServer(options?: {
  status?: KitchenOrderStatus
  clientId?: string
  startDate?: string
  endDate?: string
}): Promise<{
  data: KitchenOrder[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para consultar pedidos.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    let query = supabase
      .from('kitchen_orders')
      .select(`
        *,
        items:kitchen_order_items(*),
        linked_plans:order_production_plans(
          plan:production_plans(id, name, production_date, status)
        )
      `)
      .eq('user_id', user.id)

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId)
    }

    if (options?.startDate) {
      query = query.gte('delivery_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('delivery_date', options.endDate)
    }

    const { data, error } = await query
      .order('delivery_date', { ascending: true })
      .order('delivery_time', { ascending: true, nullsFirst: false })

    if (error) {
      return { data: null, error: error.message }
    }

    const orders: KitchenOrder[] = (data || []).map((o: any) => ({
      id: o.id,
      user_id: o.user_id,
      order_code: o.order_code,
      client_id: o.client_id,
      client_name_snapshot: o.client_name_snapshot,
      client_contact_snapshot: o.client_contact_snapshot,
      order_date: o.order_date,
      delivery_date: o.delivery_date,
      delivery_time: o.delivery_time,
      status: o.status,
      status_updated_at: o.status_updated_at,
      notes: o.notes,
      subtotal: Number(o.subtotal) || 0,
      discount_amount: Number(o.discount_amount) || 0,
      delivery_fee: Number(o.delivery_fee) || 0,
      total_amount: Number(o.total_amount) || 0,
      deposit_amount: Number(o.deposit_amount) || 0,
      balance_amount: Number(o.balance_amount) || 0,
      status_history: Array.isArray(o.status_history) ? o.status_history : [],
      items: (o.items || []).map((it: any) => ({
        id: it.id,
        order_id: it.order_id,
        recipe_id: it.recipe_id,
        product_name: it.product_name,
        quantity: Number(it.quantity) || 0,
        unit: it.unit,
        unit_price: Number(it.unit_price) || 0,
        subtotal: Number(it.subtotal) || 0,
        reference_cost_per_unit:
          it.reference_cost_per_unit !== null ? Number(it.reference_cost_per_unit) : null,
        reference_total_cost:
          it.reference_total_cost !== null ? Number(it.reference_total_cost) : null,
        notes: it.notes,
        position: it.position,
        created_at: it.created_at,
      })),
      items_count: (o.items || []).length,
      linked_plans: (o.linked_plans || [])
        .filter((lp: any) => lp.plan)
        .map((lp: any) => ({
          plan_id: lp.plan.id,
          plan_name: lp.plan.name,
          production_date: lp.plan.production_date,
          status: lp.plan.status,
        })),
      created_at: o.created_at,
      updated_at: o.updated_at,
    }))

    return { data: orders, error: null }
  } catch (err: any) {
    console.error('Error en getKitchenOrdersServer:', err)
    return { data: null, error: err.message || 'Error al consultar pedidos.' }
  }
}

/**
 * Obtiene un pedido por su ID completo.
 */
export async function getKitchenOrderByIdServer(id: string): Promise<{
  data: KitchenOrder | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data: o, error } = await supabase
      .from('kitchen_orders')
      .select(`
        *,
        items:kitchen_order_items(*),
        linked_plans:order_production_plans(
          plan:production_plans(id, name, production_date, status)
        )
      `)
      .eq('id', id.trim())
      .eq('user_id', user.id)
      .single()

    if (error || !o) {
      return { data: null, error: error?.message || 'Pedido no encontrado.' }
    }

    const order: KitchenOrder = {
      id: o.id,
      user_id: o.user_id,
      order_code: o.order_code,
      client_id: o.client_id,
      client_name_snapshot: o.client_name_snapshot,
      client_contact_snapshot: o.client_contact_snapshot,
      order_date: o.order_date,
      delivery_date: o.delivery_date,
      delivery_time: o.delivery_time,
      status: o.status,
      status_updated_at: o.status_updated_at,
      notes: o.notes,
      subtotal: Number(o.subtotal) || 0,
      discount_amount: Number(o.discount_amount) || 0,
      delivery_fee: Number(o.delivery_fee) || 0,
      total_amount: Number(o.total_amount) || 0,
      deposit_amount: Number(o.deposit_amount) || 0,
      balance_amount: Number(o.balance_amount) || 0,
      status_history: Array.isArray(o.status_history) ? o.status_history : [],
      items: (o.items || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((it: any) => ({
          id: it.id,
          order_id: it.order_id,
          recipe_id: it.recipe_id,
          product_name: it.product_name,
          quantity: Number(it.quantity) || 0,
          unit: it.unit,
          unit_price: Number(it.unit_price) || 0,
          subtotal: Number(it.subtotal) || 0,
          reference_cost_per_unit:
            it.reference_cost_per_unit !== null ? Number(it.reference_cost_per_unit) : null,
          reference_total_cost:
            it.reference_total_cost !== null ? Number(it.reference_total_cost) : null,
          notes: it.notes,
          position: it.position,
          created_at: it.created_at,
        })),
      items_count: (o.items || []).length,
      linked_plans: (o.linked_plans || [])
        .filter((lp: any) => lp.plan)
        .map((lp: any) => ({
          plan_id: lp.plan.id,
          plan_name: lp.plan.name,
          production_date: lp.plan.production_date,
          status: lp.plan.status,
        })),
      created_at: o.created_at,
      updated_at: o.updated_at,
    }

    return { data: order, error: null }
  } catch (err: any) {
    console.error('Error en getKitchenOrderByIdServer:', err)
    return { data: null, error: err.message || 'Error al consultar pedido.' }
  }
}

/**
 * Guarda o actualiza un pedido comercial y sus líneas de productos de manera atómica.
 */
export async function saveKitchenOrderServer(
  input: SaveKitchenOrderInput
): Promise<{
  data: { id: string } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para registrar pedidos.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    if (!input.delivery_date) {
      return { data: null, error: 'La fecha de entrega es obligatoria.' }
    }

    if (!input.items || input.items.length === 0) {
      return { data: null, error: 'El pedido debe contener al menos un producto.' }
    }

    // Invocación a RPC atómica
    const { data: savedId, error } = await supabase.rpc(
      'save_kitchen_order_transaction',
      {
        p_order_id: input.id || null,
        p_order_code: input.order_code?.trim() || '',
        p_client_id: input.client_id || null,
        p_client_name_snapshot: input.client_name_snapshot?.trim() || 'Cliente Ocasional',
        p_client_contact_snapshot: input.client_contact_snapshot?.trim() || '',
        p_order_date: input.order_date || new Date().toISOString().split('T')[0],
        p_delivery_date: input.delivery_date,
        p_delivery_time: input.delivery_time?.trim() || null,
        p_status: input.status || 'recibido',
        p_notes: input.notes?.trim() || '',
        p_discount_amount: input.discount_amount || 0,
        p_delivery_fee: input.delivery_fee || 0,
        p_deposit_amount: input.deposit_amount || 0,
        p_items: input.items.map((it, idx) => ({
          recipe_id: it.recipe_id || null,
          product_name: it.product_name,
          quantity: it.quantity,
          unit: it.unit || 'unidades',
          unit_price: it.unit_price,
          reference_cost_per_unit: it.reference_cost_per_unit || null,
          reference_total_cost: it.reference_total_cost || null,
          notes: it.notes || '',
          position: it.position !== undefined ? it.position : idx,
        })),
        p_status_history: input.status_history || null,
      }
    )

    if (error) {
      return { data: null, error: error.message }
    }

    revalidatePath('/cocina-pro')
    revalidatePath('/cocina-pro/pedidos')
    revalidatePath('/cocina-pro/calendario')
    revalidatePath('/cocina-pro/produccion')

    return { data: { id: savedId }, error: null }
  } catch (err: any) {
    console.error('Error en saveKitchenOrderServer:', err)
    return { data: null, error: err.message || 'Error al guardar pedido.' }
  }
}

/**
 * Actualiza el estado comercial de un pedido validando el ciclo de vida.
 */
export async function updateKitchenOrderStatusServer(
  orderId: string,
  newStatus: KitchenOrderStatus,
  note?: string
): Promise<{ success: boolean; error: string | null; warning?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    // Consultar estado actual
    const { data: order, error: fetchErr } = await supabase
      .from('kitchen_orders')
      .select('status, status_history, linked_plans:order_production_plans(plan:production_plans(status))')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !order) {
      return { success: false, error: fetchErr?.message || 'Pedido no encontrado.' }
    }

    const validation = validateOrderStatusTransition(order.status, newStatus)
    if (!validation.isValid) {
      return { success: false, error: validation.reason || 'Transición de estado inválida.' }
    }

    let warning: string | undefined = undefined
    if (newStatus === 'entregado') {
      const incompletePlans = (order.linked_plans || [])
        .map((lp: any) => lp.plan)
        .filter((p: any) => p && p.status !== 'completed')

      if (incompletePlans.length > 0) {
        warning = 'El pedido fue entregado, pero el plan de producción vinculado aún no figura completado.'
      }
    }

    const currentHistory = Array.isArray(order.status_history) ? order.status_history : []
    const newHistoryItem = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note?.trim() || `Estado actualizado a ${newStatus}`,
      user_email: user.email,
    }

    const { error: updateErr } = await supabase
      .from('kitchen_orders')
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString(),
        status_history: [...currentHistory, newHistoryItem],
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', user.id)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    revalidatePath('/cocina-pro')
    revalidatePath('/cocina-pro/pedidos')
    revalidatePath('/cocina-pro/calendario')
    revalidatePath('/cocina-pro/produccion')

    return { success: true, error: null, warning }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar estado del pedido.' }
  }
}

// ==============================================================================
// 3. INTEGRACIÓN CON PLANES DE PRODUCCIÓN
// ==============================================================================

/**
 * Vincula un pedido a un plan de producción existente.
 */
export async function linkOrderToProductionPlanServer(
  orderId: string,
  planId: string,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { error } = await supabase.rpc(
      'link_order_production_plan_transaction',
      {
        p_order_id: orderId,
        p_plan_id: planId,
        p_notes: notes || '',
      }
    )

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/cocina-pro/pedidos')
    revalidatePath('/cocina-pro/produccion')

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al vincular plan de producción.' }
  }
}

/**
 * Crea automáticamente un plan de producción a partir de los productos del pedido y lo vincula.
 */
export async function createProductionPlanFromOrderServer(
  orderId: string,
  planName?: string,
  productionDate?: string
): Promise<{ data: { planId: string } | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'No autenticado.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data: planId, error } = await supabase.rpc(
      'create_production_plan_from_order_transaction',
      {
        p_order_id: orderId,
        p_plan_name: planName || '',
        p_production_date: productionDate || null,
      }
    )

    if (error) {
      return { data: null, error: error.message }
    }

    revalidatePath('/cocina-pro/pedidos')
    revalidatePath('/cocina-pro/produccion')

    return { data: { planId }, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al crear plan de producción desde pedido.' }
  }
}
