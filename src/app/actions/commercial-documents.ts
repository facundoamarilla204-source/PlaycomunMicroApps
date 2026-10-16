'use server'

import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import {
  BusinessProfile,
  CommercialClient,
  CommercialDocument,
  CommercialProduct,
  DocumentType,
} from '@/components/tools/generador-facturas/types'
import { calculateDocumentTotals } from '@/components/tools/generador-facturas/math'

const PRO_REQUIRED_ERROR = 'Esta función de persistencia requiere una suscripción Pro activa.'

/**
 * Consulta el estado de autenticación y nivel de suscripción Pro del usuario en el servidor.
 */
export async function getCommercialUserStatusServer(): Promise<{
  isAuthenticated: boolean
  isPro: boolean
  userId: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isAuthenticated: false, isPro: false, userId: null }
  }

  const isPro = await isProUser(user.id)
  return { isAuthenticated: true, isPro, userId: user.id }
}

// ==========================================
// 1. BUSINESS PROFILE (EMISOR) - SOLO PRO
// ==========================================
export async function getBusinessProfileServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: null, error: PRO_REQUIRED_ERROR }

  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching business profile:', error)
    return { data: null, error: error.message }
  }

  if (!data) return { data: null, error: null }

  const profile: BusinessProfile = {
    id: data.id,
    name: data.name,
    taxId: data.tax_id || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    city: data.city || '',
    logo: data.logo_url || '',
    defaultCurrency: data.default_currency || 'ARS',
    defaultTemplate: data.default_template || 'modern',
    defaultAccentColor: data.default_accent_color || '#7C3AED',
    defaultNotes: data.default_notes || '',
    updatedAt: data.updated_at,
  }

  return { data: profile, error: null }
}

export async function saveBusinessProfileServer(profile: BusinessProfile) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: null, error: PRO_REQUIRED_ERROR }

  const payload = {
    user_id: user.id,
    name: profile.name.trim(),
    tax_id: profile.taxId?.trim() || null,
    phone: profile.phone?.trim() || null,
    email: profile.email?.trim() || null,
    address: profile.address?.trim() || null,
    city: profile.city?.trim() || null,
    logo_url: profile.logo || null,
    default_currency: profile.defaultCurrency || 'ARS',
    default_template: profile.defaultTemplate || 'modern',
    default_accent_color: profile.defaultAccentColor || '#7C3AED',
    default_notes: profile.defaultNotes?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('business_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Error saving business profile:', error)
    return { data: null, error: error.message }
  }

  const savedProfile: BusinessProfile = {
    id: data.id,
    name: data.name,
    taxId: data.tax_id || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    city: data.city || '',
    logo: data.logo_url || '',
    defaultCurrency: data.default_currency || 'ARS',
    defaultTemplate: data.default_template || 'modern',
    defaultAccentColor: data.default_accent_color || '#7C3AED',
    defaultNotes: data.default_notes || '',
    updatedAt: data.updated_at,
  }

  return { data: savedProfile, error: null }
}

// ==========================================
// 2. CLIENTES (AGENDA) - SOLO PRO
// ==========================================
export async function getCommercialClientsServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: [], error: PRO_REQUIRED_ERROR }

  const { data, error } = await supabase
    .from('commercial_clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching clients:', error)
    return { data: [], error: error.message }
  }

  const mapped: CommercialClient[] = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    taxId: c.tax_id || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
    notes: c.notes || '',
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }))

  return { data: mapped, error: null }
}

export async function saveCommercialClientServer(client: Partial<CommercialClient>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: null, error: PRO_REQUIRED_ERROR }

  if (!client.name?.trim()) {
    return { data: null, error: 'El nombre del cliente es obligatorio' }
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    name: client.name.trim(),
    tax_id: client.taxId?.trim() || null,
    phone: client.phone?.trim() || null,
    email: client.email?.trim() || null,
    address: client.address?.trim() || null,
    city: client.city?.trim() || null,
    notes: client.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (client.id && !client.id.startsWith('client-')) {
    payload.id = client.id
  }

  const { data, error } = await supabase
    .from('commercial_clients')
    .upsert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error saving client:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteCommercialClientServer(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { success: false, error: PRO_REQUIRED_ERROR }

  const { error } = await supabase
    .from('commercial_clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting client:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==========================================
// 3. PRODUCTOS Y SERVICIOS - SOLO PRO
// ==========================================
export async function getCommercialProductsServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: [], error: PRO_REQUIRED_ERROR }

  const { data, error } = await supabase
    .from('commercial_products')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return { data: [], error: error.message }
  }

  const mapped: CommercialProduct[] = (data || []).map((p) => {
    const discount = Number(p.default_discount) || 0
    return {
      id: p.id,
      name: p.name,
      description: p.description || '',
      defaultUnitPrice: Number(p.default_unit_price) || 0,
      defaultDiscountPercent: discount,
      defaultDiscount: discount,
      category: p.category || '',
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  })

  return { data: mapped, error: null }
}

export async function saveCommercialProductServer(product: Partial<CommercialProduct>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: null, error: PRO_REQUIRED_ERROR }

  if (!product.name?.trim()) {
    return { data: null, error: 'El nombre del producto es obligatorio' }
  }

  const discountVal = product.defaultDiscountPercent ?? product.defaultDiscount ?? 0

  const payload: Record<string, unknown> = {
    user_id: user.id,
    name: product.name.trim(),
    description: product.description?.trim() || null,
    default_unit_price: Number(product.defaultUnitPrice) || 0,
    default_discount: Number(discountVal) || 0,
    category: product.category?.trim() || null,
    is_active: product.isActive !== false,
    updated_at: new Date().toISOString(),
  }

  if (product.id && !product.id.startsWith('prod-')) {
    payload.id = product.id
  }

  const { data, error } = await supabase
    .from('commercial_products')
    .upsert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error saving product:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteCommercialProductServer(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { success: false, error: PRO_REQUIRED_ERROR }

  const { error } = await supabase
    .from('commercial_products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==========================================
// 4. NUMERACIÓN ATÓMICA PERSISTENTE - SOLO PRO
// ==========================================
export async function getNextDocumentNumberServer(type: DocumentType, customPrefix?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: null, error: PRO_REQUIRED_ERROR }

  const { data, error } = await supabase.rpc('get_next_document_number', {
    p_user_id: user.id,
    p_type: type,
    p_custom_prefix: customPrefix || null,
  })

  if (error) {
    console.error('Error generating document number:', error)
    return { data: null, error: error.message }
  }

  return { data: data as string, error: null }
}

// ==========================================
// 5. DOCUMENTOS COMERCIALES - SOLO PRO
// ==========================================
export async function getCommercialDocumentsServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: [], error: PRO_REQUIRED_ERROR }

  const { data, error } = await supabase
    .from('commercial_documents')
    .select(`
      *,
      commercial_document_items (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching commercial documents:', error)
    return { data: [], error: error.message }
  }

  const mapped: CommercialDocument[] = (data || []).map((row) => {
    const rawItems = (row.commercial_document_items || []) as Array<{
      id: string
      description: string
      quantity: number
      unit_price: number
      discount_percent: number
      subtotal: number
      sort_order: number
    }>
    rawItems.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

    return {
      id: row.id,
      type: row.type as DocumentType,
      number: row.number,
      issueDate: row.issue_date,
      currency: row.currency,
      emisor: row.emisor_snapshot,
      cliente: row.client_snapshot,
      items: rawItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unit_price) || 0,
        discountPercent: Number(item.discount_percent) || 0,
        subtotal: Number(item.subtotal) || 0,
      })),
      globalDiscountPercent: Number(row.global_discount_percent) || 0,
      applyTax: Boolean(row.apply_tax),
      taxRate: Number(row.tax_rate) || 21,
      presupuestoMeta: row.presupuesto_meta || undefined,
      reciboMeta: row.recibo_meta || undefined,
      ordenTrabajoMeta: row.orden_trabajo_meta || undefined,
      facturaProformaMeta: row.factura_proforma_meta || undefined,
      designTemplate: row.design_template || 'modern',
      accentColor: row.accent_color || '#7C3AED',
      footerNotes: row.footer_notes || '',
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })

  return { data: mapped, error: null }
}

export async function saveCommercialDocumentServer(doc: CommercialDocument) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { data: null, error: PRO_REQUIRED_ERROR }

  if (!doc.items || doc.items.length === 0) {
    return { data: null, error: 'El documento debe contener al menos una línea' }
  }

  // 1. Obtener número correlativo si no viene asignado o es temporal
  let docNumber = doc.number
  if (!docNumber || docNumber.includes('TMP') || docNumber.includes('BORRADOR')) {
    const nextRes = await getNextDocumentNumberServer(doc.type)
    if (nextRes.error || !nextRes.data) {
      return { data: null, error: 'Error al reservar numeración correlativa en la nube' }
    }
    docNumber = nextRes.data
  }

  const totals = calculateDocumentTotals(
    doc.items,
    doc.globalDiscountPercent,
    doc.applyTax,
    doc.taxRate
  )

  const docPayload: Record<string, unknown> = {
    user_id: user.id,
    type: doc.type,
    number: docNumber,
    issue_date: doc.issueDate,
    currency: doc.currency,
    emisor_snapshot: doc.emisor,
    client_snapshot: doc.cliente,
    items_subtotal: totals.rawSubtotal,
    global_discount_percent: doc.globalDiscountPercent || 0,
    global_discount_amount: totals.globalDiscountAmount,
    taxable_base: totals.taxableBase,
    apply_tax: doc.applyTax || false,
    tax_rate: doc.taxRate || 21,
    tax_amount: totals.taxAmount,
    grand_total: totals.grandTotal,
    design_template: doc.designTemplate || 'modern',
    accent_color: doc.accentColor || '#7C3AED',
    footer_notes: doc.footerNotes?.trim() || null,
    status: doc.status || 'borrador',
    presupuesto_meta: doc.type === 'presupuesto' ? doc.presupuestoMeta : null,
    recibo_meta: doc.type === 'recibo' ? doc.reciboMeta : null,
    orden_trabajo_meta: doc.type === 'orden-trabajo' ? doc.ordenTrabajoMeta : null,
    factura_proforma_meta: doc.type === 'factura-proforma' ? doc.facturaProformaMeta : null,
    updated_at: new Date().toISOString(),
  }

  const isExistingUuid = doc.id && !doc.id.startsWith('doc-') && !doc.id.startsWith('cloud-')
  if (isExistingUuid) {
    docPayload.id = doc.id
  }

  // 2. Guardar cabecera del documento
  const { data: savedDoc, error: docError } = await supabase
    .from('commercial_documents')
    .upsert(docPayload)
    .select()
    .single()

  if (docError || !savedDoc) {
    console.error('Error saving document header:', docError)
    return { data: null, error: docError?.message || 'Error guardando documento' }
  }

  // 3. Reemplazar líneas de ítems garantizando snapshot
  await supabase
    .from('commercial_document_items')
    .delete()
    .eq('document_id', savedDoc.id)

  const itemsPayload = doc.items.map((item, index) => ({
    document_id: savedDoc.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount_percent: item.discountPercent || 0,
    subtotal: item.subtotal,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('commercial_document_items')
    .insert(itemsPayload)

  if (itemsError) {
    console.error('Error inserting document items:', itemsError)
  }

  return {
    data: {
      ...doc,
      id: savedDoc.id,
      number: docNumber,
      updatedAt: savedDoc.updated_at,
    },
    error: null,
  }
}

export async function deleteCommercialDocumentServer(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { success: false, error: PRO_REQUIRED_ERROR }

  const { error } = await supabase
    .from('commercial_documents')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting document:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==========================================
// 6. IMPORTACIÓN MANUAL CONFIRMADA A LA NUBE
// ==========================================
export async function importLocalDataToCloudServer(payload: {
  documents: CommercialDocument[]
  clients: Partial<CommercialClient>[]
  products: Partial<CommercialProduct>[]
  profile?: BusinessProfile | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const isPro = await isProUser(user.id)
  if (!isPro) return { success: false, error: PRO_REQUIRED_ERROR }

  try {
    if (payload.profile && payload.profile.name) {
      await saveBusinessProfileServer(payload.profile)
    }

    for (const c of payload.clients) {
      if (c.name) {
        await saveCommercialClientServer(c)
      }
    }

    for (const p of payload.products) {
      if (p.name) {
        await saveCommercialProductServer(p)
      }
    }

    for (const d of payload.documents) {
      await saveCommercialDocumentServer(d)
    }

    return { success: true, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al importar'
    return { success: false, error: msg }
  }
}
