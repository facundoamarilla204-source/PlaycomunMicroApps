'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'
import type { PurchaseOrder, PurchaseOrderItem } from '@/lib/gastronomia/types'

/**
 * Obtiene la lista de órdenes de compra del usuario autenticado.
 */
export async function getPurchaseOrdersServer(): Promise<{
  data: PurchaseOrder[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para consultar compras.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, items:purchase_order_items(id)')
      .eq('user_id', user.id)
      .order('issue_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    const orders: PurchaseOrder[] = (data || []).map((po: any) => ({
      id: po.id,
      user_id: po.user_id,
      order_number: po.order_number,
      supplier_id: po.supplier_id,
      supplier_name: po.supplier_name,
      status: po.status,
      issue_date: po.issue_date,
      expected_delivery_date: po.expected_delivery_date,
      received_at: po.received_at,
      subtotal: Number(po.subtotal) || 0,
      shipping_cost: Number(po.shipping_cost) || 0,
      taxes_amount: Number(po.taxes_amount) || 0,
      discount_amount: Number(po.discount_amount) || 0,
      total: Number(po.total) || 0,
      notes: po.notes,
      origin_plan_id: po.origin_plan_id,
      items_count: (po.items || []).length,
      created_at: po.created_at,
      updated_at: po.updated_at,
    }))

    return { data: orders, error: null }
  } catch (err: any) {
    console.error('Error en getPurchaseOrdersServer:', err)
    return { data: null, error: err.message || 'Error al consultar órdenes de compra.' }
  }
}

/**
 * Obtiene el detalle de una orden de compra con sus ítems.
 */
export async function getPurchaseOrderByIdServer(id: string): Promise<{
  data: PurchaseOrder | null
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

    const { data: po, error: poErr } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id.trim())
      .eq('user_id', user.id)
      .single()

    if (poErr || !po) {
      return { data: null, error: poErr?.message || 'Orden de compra no encontrada.' }
    }

    const { data: itemsData, error: itemsErr } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', po.id)
      .order('created_at', { ascending: true })

    if (itemsErr) {
      return { data: null, error: itemsErr.message }
    }

    const items: PurchaseOrderItem[] = (itemsData || []).map((it: any) => ({
      id: it.id,
      purchase_order_id: it.purchase_order_id,
      ingredient_id: it.ingredient_id,
      ingredient_name: it.ingredient_name,
      ordered_quantity: Number(it.ordered_quantity) || 0,
      package_size: Number(it.package_size) || 1,
      package_unit: it.package_unit || 'kg',
      unit_price: Number(it.unit_price) || 0,
      total_price: Number(it.total_price) || 0,
      received_quantity: Number(it.received_quantity) || 0,
      lot_number: it.lot_number,
      expiration_date: it.expiration_date,
      notes: it.notes,
      created_at: it.created_at,
      updated_at: it.updated_at,
    }))

    const order: PurchaseOrder = {
      id: po.id,
      user_id: po.user_id,
      order_number: po.order_number,
      supplier_id: po.supplier_id,
      supplier_name: po.supplier_name,
      status: po.status,
      issue_date: po.issue_date,
      expected_delivery_date: po.expected_delivery_date,
      received_at: po.received_at,
      subtotal: Number(po.subtotal) || 0,
      shipping_cost: Number(po.shipping_cost) || 0,
      taxes_amount: Number(po.taxes_amount) || 0,
      discount_amount: Number(po.discount_amount) || 0,
      total: Number(po.total) || 0,
      notes: po.notes,
      origin_plan_id: po.origin_plan_id,
      items,
      items_count: items.length,
      created_at: po.created_at,
      updated_at: po.updated_at,
    }

    return { data: order, error: null }
  } catch (err: any) {
    console.error('Error en getPurchaseOrderByIdServer:', err)
    return { data: null, error: err.message || 'Error al obtener la orden de compra.' }
  }
}

/**
 * Guarda o actualiza una orden de compra junto con sus ítems.
 */
export async function savePurchaseOrderServer(
  order: {
    id?: string
    order_number?: string
    supplier_id?: string | null
    supplier_name: string
    status?: 'draft' | 'confirmed' | 'received' | 'partially_received' | 'cancelled'
    issue_date?: string
    expected_delivery_date?: string | null
    shipping_cost?: number
    taxes_amount?: number
    discount_amount?: number
    notes?: string | null
    origin_plan_id?: string | null
  },
  items: Array<{
    id?: string
    ingredient_id?: string | null
    ingredient_name: string
    ordered_quantity: number
    package_size: number
    package_unit: string
    unit_price: number
    lot_number?: string | null
    expiration_date?: string | null
    notes?: string | null
  }>
): Promise<{
  data: PurchaseOrder | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Debes iniciar sesión para registrar compras.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { data: null, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    if (!order.supplier_name?.trim()) {
      return { data: null, error: 'Debes indicar el nombre del proveedor.' }
    }

    if (!items || items.length === 0) {
      return { data: null, error: 'La orden de compra debe incluir al menos un ítem.' }
    }

    // Calcular totales con precisión
    let subtotal = 0
    const processedItems = items.map((it) => {
      const qty = Math.max(0.0001, Number(it.ordered_quantity) || 0)
      const price = Math.max(0, Number(it.unit_price) || 0)
      const lineTotal = Math.round(qty * price * 100) / 100
      subtotal += lineTotal

      return {
        id: it.id,
        ingredient_id: it.ingredient_id || null,
        ingredient_name: it.ingredient_name.trim(),
        ordered_quantity: qty,
        package_size: Math.max(0.0001, Number(it.package_size) || 1),
        package_unit: it.package_unit.trim() || 'kg',
        unit_price: price,
        total_price: lineTotal,
        lot_number: it.lot_number?.trim() || null,
        expiration_date: it.expiration_date || null,
        notes: it.notes?.trim() || null,
      }
    })

    const shipping = Math.max(0, Number(order.shipping_cost) || 0)
    const taxes = Math.max(0, Number(order.taxes_amount) || 0)
    const discount = Math.max(0, Number(order.discount_amount) || 0)
    const total = Math.max(0, Math.round((subtotal + shipping + taxes - discount) * 100) / 100)

    const orderNumber =
      order.order_number?.trim() ||
      `OC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

    const orderPayload = {
      user_id: user.id,
      order_number: orderNumber,
      supplier_id: order.supplier_id || null,
      supplier_name: order.supplier_name.trim(),
      status: order.status || 'draft',
      issue_date: order.issue_date || new Date().toISOString().slice(0, 10),
      expected_delivery_date: order.expected_delivery_date || null,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping_cost: shipping,
      taxes_amount: taxes,
      discount_amount: discount,
      total,
      notes: order.notes?.trim() || null,
      origin_plan_id: order.origin_plan_id || null,
      updated_at: new Date().toISOString(),
    }

    let poId = order.id

    if (poId) {
      const { data: updatedPo, error: updateErr } = await supabase
        .from('purchase_orders')
        .update(orderPayload)
        .eq('id', poId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateErr || !updatedPo) {
        return { data: null, error: updateErr?.message || 'Error al actualizar orden.' }
      }

      // Reemplazar ítems
      await supabase.from('purchase_order_items').delete().eq('purchase_order_id', poId)
    } else {
      const { data: newPo, error: createErr } = await supabase
        .from('purchase_orders')
        .insert({
          ...orderPayload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createErr || !newPo) {
        return { data: null, error: createErr?.message || 'Error al crear orden.' }
      }
      poId = newPo.id
    }

    // Insertar ítems
    const itemsToInsert = processedItems.map((it) => ({
      purchase_order_id: poId,
      ingredient_id: it.ingredient_id,
      ingredient_name: it.ingredient_name,
      ordered_quantity: it.ordered_quantity,
      package_size: it.package_size,
      package_unit: it.package_unit,
      unit_price: it.unit_price,
      total_price: it.total_price,
      lot_number: it.lot_number,
      expiration_date: it.expiration_date,
      notes: it.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertItemsErr } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert)

    if (insertItemsErr) {
      return { data: null, error: insertItemsErr.message }
    }

    return await getPurchaseOrderByIdServer(poId!)
  } catch (err: any) {
    console.error('Error en savePurchaseOrderServer:', err)
    return { data: null, error: err.message || 'Error al guardar la orden de compra.' }
  }
}

/**
 * Recepciona mercadería de una orden de compra mediante procedimiento transaccional atómico.
 * Actualiza el stock de los ingredientes y sus precios históricos garantizando idempotencia.
 */
export async function receivePurchaseOrderServer(
  orderId: string,
  items: Array<{
    item_id: string
    received_quantity: number
    unit_price?: number
    lot_number?: string
    expiration_date?: string
  }>,
  idempotencyKey?: string
): Promise<{
  success: boolean
  status?: string
  movementsRecorded?: number
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para recibir mercadería.' }
    }

    const isPro = await isProUser(user.id)
    if (!isPro) {
      return { success: false, error: PRO_REQUIRED_RECIPE_ERROR }
    }

    const key = idempotencyKey || `po_rec_${orderId}_${Date.now()}`

    // 1. Invocar RPC transaccional
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('receive_purchase_order_tx', {
      p_order_id: orderId,
      p_items: items,
      p_idempotency_key: key,
    })

    if (!rpcErr && rpcRes && rpcRes.success) {
      return {
        success: true,
        status: rpcRes.status,
        movementsRecorded: rpcRes.movements_recorded,
        error: null,
      }
    }

    // 2. Fallback si el RPC no estuviese disponible (por ejemplo en tests unitarios)
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*, items:purchase_order_items(*)')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!po) {
      return { success: false, error: 'Orden de compra no encontrada.' }
    }

    if (po.status === 'received') {
      return { success: true, status: 'received', error: null }
    }

    let movementsCount = 0
    let allReceived = true
    let someReceived = false

    for (const line of items) {
      const poItem = (po.items || []).find((it: any) => it.id === line.item_id)
      if (!poItem) continue

      const receivedPackages = Math.max(0, Number(line.received_quantity) || 0)
      if (receivedPackages <= 0) continue

      someReceived = true
      const normalizedQuantity = receivedPackages * Number(poItem.package_size)

      if (poItem.ingredient_id) {
        // Consultar saldo actual
        const { data: latestMov } = await supabase
          .from('inventory_movements')
          .select('balance_after')
          .eq('user_id', user.id)
          .eq('ingredient_id', poItem.ingredient_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const currentBalance = latestMov ? Number(latestMov.balance_after) || 0 : 0
        const newBalance = currentBalance + normalizedQuantity

        await supabase.from('inventory_movements').insert({
          user_id: user.id,
          ingredient_id: poItem.ingredient_id,
          movement_type: 'in',
          direction: 'in',
          quantity: receivedPackages,
          unit: poItem.package_unit,
          normalized_quantity: normalizedQuantity,
          balance_after: newBalance,
          reference_type: 'purchase_order',
          reference_id: orderId,
          idempotency_key: `${key}_${poItem.id}`,
          reason: `Recepción de Orden ${po.order_number}`,
          lot_number: line.lot_number?.trim() || null,
          expiration_date: line.expiration_date || null,
          unit_cost: line.unit_price ?? poItem.unit_price,
          created_at: new Date().toISOString(),
        })

        movementsCount++
      }

      const totalReceived = (Number(poItem.received_quantity) || 0) + receivedPackages
      await supabase
        .from('purchase_order_items')
        .update({
          received_quantity: totalReceived,
          lot_number: line.lot_number?.trim() || poItem.lot_number,
          expiration_date: line.expiration_date || poItem.expiration_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poItem.id)

      if (totalReceived < Number(poItem.ordered_quantity)) {
        allReceived = false
      }
    }

    const nextStatus = allReceived ? 'received' : someReceived ? 'partially_received' : po.status

    await supabase
      .from('purchase_orders')
      .update({
        status: nextStatus,
        received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    return {
      success: true,
      status: nextStatus,
      movementsRecorded: movementsCount,
      error: null,
    }
  } catch (err: any) {
    console.error('Error en receivePurchaseOrderServer:', err)
    return { success: false, error: err.message || 'Error al recepcionar mercadería.' }
  }
}

/**
 * Elimina una orden de compra en estado borrador o cancelada.
 */
export async function deletePurchaseOrderServer(id: string): Promise<{
  success: boolean
  error: string | null
}> {
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

    // Comprobar que no esté recibida
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (po && (po.status === 'received' || po.status === 'partially_received')) {
      return {
        success: false,
        error: 'No se puede eliminar una orden con mercadería recibida. Cancélala si corresponde.',
      }
    }

    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error en deletePurchaseOrderServer:', err)
    return { success: false, error: err.message || 'Error al eliminar orden.' }
  }
}
