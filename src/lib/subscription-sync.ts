import crypto from 'crypto'
import { SupabaseClient } from '@supabase/supabase-js'

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210'

/**
 * Realiza peticiones autenticadas a la API oficial de Mercado Pago
 */
export async function mpFetch(path: string, options: RequestInit = {}) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN || MP_TOKEN
  const resp = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => '')
    console.error(`[MP API Error] ${path} returned ${resp.status}:`, errorText)
    return null
  }
  return resp.json()
}

/**
 * Verificación oficial de firma HMAC-SHA256 para Webhooks de Mercado Pago
 * Manifest: `id:${dataId};request-id:${xRequestId};ts:${ts};`
 */
export function verifyMercadoPagoSignature(
  headers: Headers | Record<string, string | null | undefined>,
  searchParams?: URLSearchParams,
  bodyDataId?: string | number
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    // Si no está configurado el secret (ej. tests o dev local), se permite
    return true
  }

  const getHeader = (key: string): string | null => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(key)
    }
    const rec = headers as Record<string, string | null | undefined>
    return rec[key] || rec[key.toLowerCase()] || null
  }

  const signature = getHeader('x-signature')
  const reqId = getHeader('x-request-id')

  if (!signature || !reqId) return false

  // dataId puede venir en query param (data.id o id) o en el body
  const dataId = searchParams?.get('data.id') || searchParams?.get('id') || bodyDataId
  if (!dataId) return false

  try {
    const parts = signature.split(',')
    let ts = '', v1 = ''
    parts.forEach(part => {
      const [key, value] = part.split('=')
      if (key?.trim() === 'ts') ts = value?.trim()
      if (key?.trim() === 'v1') v1 = value?.trim()
    })

    if (!ts || !v1) return false

    const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`
    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')

    // Comparación segura en tiempo constante
    const calculatedBuf = Buffer.from(calculatedHash, 'hex')
    const v1Buf = Buffer.from(v1, 'hex')

    if (calculatedBuf.length !== v1Buf.length) return false
    return crypto.timingSafeEqual(calculatedBuf, v1Buf)
  } catch (err) {
    console.error('[verifyMercadoPagoSignature] Error:', err)
    return false
  }
}

/**
 * Sincroniza una suscripción de Mercado Pago (preapproval) en Supabase
 * Es idempotente y preserva el período pagado si la renovación fue cancelada
 */
export async function syncSubscriptionFromMp(
  adminSupabase: SupabaseClient,
  mpSubId: string,
  options?: { fallbackUserId?: string }
): Promise<{ success: boolean; subscriptionId?: string; status?: string }> {
  const subDetails = await mpFetch(`/preapproval/${mpSubId}`)
  if (!subDetails) {
    return { success: false }
  }

  const userId = subDetails.external_reference || options?.fallbackUserId
  if (!userId) {
    console.warn(`[syncSubscriptionFromMp] No se encontró user_id para sub ${mpSubId}`)
    return { success: false }
  }

  // Mapear status de MP al enum de la DB: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired'
  let newStatus: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired'
  switch (subDetails.status) {
    case 'authorized':
    case 'active':
      newStatus = 'active'
      break
    case 'paused':
      newStatus = 'paused'
      break
    case 'cancelled':
      newStatus = 'cancelled'
      break
    case 'pending':
      newStatus = 'trialing'
      break
    default:
      newStatus = 'active'
  }

  // Determinar plan (anual o mensual)
  const mpPlanId = subDetails.preapproval_plan_id
  const isAnual = subDetails.auto_recurring?.frequency === 12
  const planCode = isAnual ? 'pro_yearly' : 'pro_monthly'

  const { data: plan } = await adminSupabase
    .from('plans')
    .select('id, price, currency')
    .eq('code', planCode)
    .single()

  if (!plan) {
    console.error(`[syncSubscriptionFromMp] Plan ${planCode} no encontrado en DB`)
    return { success: false }
  }

  const periodStart = subDetails.summarized?.last_charged_date || subDetails.date_created
  const periodEnd = subDetails.next_payment_date

  // Buscar suscripción existente por ID de proveedor
  const { data: existingSub } = await adminSupabase
    .from('subscriptions')
    .select('id, current_period_end, cancelled_at, status')
    .eq('provider_subscription_id', mpSubId)
    .maybeSingle()

  // Si se canceló la renovación pero MP ya no envía next_payment_date,
  // preservamos el current_period_end ya confirmado para respetar el período pagado.
  const resolvedPeriodEnd = periodEnd || existingSub?.current_period_end || null
  const resolvedCancelledAt = subDetails.status === 'cancelled'
    ? (existingSub?.cancelled_at || new Date().toISOString())
    : null

  let localSubId: string

  if (existingSub) {
    await adminSupabase
      .from('subscriptions')
      .update({
        provider_status: subDetails.status,
        status: newStatus,
        current_period_start: periodStart || undefined,
        current_period_end: resolvedPeriodEnd || undefined,
        cancelled_at: resolvedCancelledAt,
      })
      .eq('id', existingSub.id)
    localSubId = existingSub.id
  } else {
    const { data: newSub, error: insertErr } = await adminSupabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        provider: 'mercadopago',
        provider_subscription_id: mpSubId,
        provider_plan_id: mpPlanId || null,
        provider_status: subDetails.status,
        status: newStatus,
        current_period_start: periodStart || null,
        current_period_end: resolvedPeriodEnd,
        cancelled_at: resolvedCancelledAt,
      })
      .select('id')
      .single()

    if (insertErr || !newSub) {
      console.error('[syncSubscriptionFromMp] Error insertando suscripción:', insertErr)
      return { success: false }
    }
    localSubId = newSub.id
  }

  // Si hubo cobros efectivos registrados en MP, registrar el pago de forma idempotente
  if (
    subDetails.summarized?.charged_quantity > 0 &&
    subDetails.summarized?.last_charged_amount > 0
  ) {
    const paymentKey = `sub_${mpSubId}_${subDetails.summarized.charged_quantity}`
    const { data: existingPayment } = await adminSupabase
      .from('payments')
      .select('id')
      .eq('provider_payment_id', paymentKey)
      .maybeSingle()

    if (!existingPayment) {
      await adminSupabase
        .from('payments')
        .insert({
          user_id: userId,
          subscription_id: localSubId,
          provider: 'mercadopago',
          provider_payment_id: paymentKey,
          amount: subDetails.summarized.last_charged_amount,
          currency: subDetails.auto_recurring?.currency_id || 'ARS',
          status: 'approved',
          payment_method: subDetails.payment_method_id || null,
          paid_at: subDetails.summarized.last_charged_date || new Date().toISOString(),
        })
    }
  }

  return { success: true, subscriptionId: localSubId, status: newStatus }
}

/**
 * Sincroniza un pago individual de Mercado Pago (/v1/payments/{id})
 * Maneja renovaciones automáticas, estados de pago y revocaciones por reembolso o contracargo
 */
export async function syncPaymentFromMp(
  adminSupabase: SupabaseClient,
  mpPaymentId: string | number
): Promise<{ success: boolean; status?: string }> {
  const paymentDetails = await mpFetch(`/v1/payments/${mpPaymentId}`)
  if (!paymentDetails) return { success: false }

  // 1. Identificar la suscripción asociada
  let mpSubId =
    paymentDetails.metadata?.preapproval_id ||
    paymentDetails.metadata?.subscription_id ||
    paymentDetails.point_of_interaction?.transaction_data?.subscription_id ||
    paymentDetails.order?.id

  let localSub: { id: string; user_id: string } | null = null

  if (mpSubId) {
    const { data } = await adminSupabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('provider_subscription_id', String(mpSubId))
      .maybeSingle()
    localSub = data
  }

  // Si no se encontró por ID de sub directo pero tiene external_reference (user_id)
  if (!localSub && paymentDetails.external_reference) {
    const { data } = await adminSupabase
      .from('subscriptions')
      .select('id, user_id, provider_subscription_id')
      .eq('user_id', paymentDetails.external_reference)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      localSub = { id: data.id, user_id: data.user_id }
      if (!mpSubId && data.provider_subscription_id) {
        mpSubId = data.provider_subscription_id
      }
    }
  }

  if (!localSub) {
    console.warn(`[syncPaymentFromMp] No se encontró suscripción para pago MP ${mpPaymentId}`)
    return { success: false }
  }

  // 2. Mapear estado al enum payment_status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled' | 'in_process'
  let payStatus: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled' | 'in_process'
  switch (paymentDetails.status) {
    case 'approved':
      payStatus = 'approved'
      break
    case 'rejected':
      payStatus = 'rejected'
      break
    case 'refunded':
    case 'charged_back':
      payStatus = 'refunded'
      break
    case 'cancelled':
      payStatus = 'cancelled'
      break
    case 'in_process':
      payStatus = 'in_process'
      break
    default:
      payStatus = 'pending'
  }

  // 3. Upsert idempotente del pago
  const providerPaymentId = String(mpPaymentId)
  const { data: existingPayment } = await adminSupabase
    .from('payments')
    .select('id')
    .eq('provider_payment_id', providerPaymentId)
    .maybeSingle()

  if (existingPayment) {
    await adminSupabase
      .from('payments')
      .update({ status: payStatus })
      .eq('id', existingPayment.id)
  } else {
    await adminSupabase
      .from('payments')
      .insert({
        user_id: localSub.user_id,
        subscription_id: localSub.id,
        provider: 'mercadopago',
        provider_payment_id: providerPaymentId,
        amount: paymentDetails.transaction_amount,
        currency: paymentDetails.currency_id || 'ARS',
        status: payStatus,
        payment_method: paymentDetails.payment_method_id || null,
        paid_at: paymentDetails.date_approved || new Date().toISOString(),
      })
  }

  // 4. Si el pago fue aprobado, renovar y sincronizar período en la suscripción
  if (payStatus === 'approved' && mpSubId) {
    await syncSubscriptionFromMp(adminSupabase, String(mpSubId), { fallbackUserId: localSub.user_id })
  }

  // 5. Si el pago falló o fue rechazado, marcar estado past_due
  if (payStatus === 'rejected') {
    await adminSupabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        provider_status: 'rejected'
      })
      .eq('id', localSub.id)
  }

  // 6. Si hubo reembolso o contracargo, revocar acceso Pro inmediatamente
  if (paymentDetails.status === 'refunded' || paymentDetails.status === 'charged_back') {
    await adminSupabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        provider_status: paymentDetails.status,
        current_period_end: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', localSub.id)
  }

  return { success: true, status: payStatus }
}

/**
 * Sincroniza un evento de factura recurrente (subscription_authorized_payment)
 */
export async function syncAuthorizedPaymentFromMp(
  adminSupabase: SupabaseClient,
  authorizedPaymentId: string | number
): Promise<{ success: boolean; preapprovalId?: string }> {
  const authPayment = await mpFetch(`/authorized_payments/${authorizedPaymentId}`)
  if (!authPayment) return { success: false }

  const preapprovalId = authPayment.preapproval_id
  if (preapprovalId) {
    await syncSubscriptionFromMp(adminSupabase, preapprovalId)
  }

  if (authPayment.payment?.id) {
    await syncPaymentFromMp(adminSupabase, authPayment.payment.id)
  }

  return { success: true, preapprovalId }
}

/**
 * Sincroniza las suscripciones de un usuario consultando MP y Supabase
 * Diseñado para invocarse directamente desde Server Components o API Routes
 */
export async function syncUserSubscriptions(
  adminSupabase: SupabaseClient,
  userId: string,
  preapprovalId?: string
): Promise<{
  synced: boolean
  isPro: boolean
  subscriptionId?: string | null
  message: string
}> {
  let mpSubscriptions: any[] = []

  if (preapprovalId) {
    const sub = await mpFetch(`/preapproval/${preapprovalId}`)
    if (sub && sub.external_reference === userId) {
      mpSubscriptions = [sub]
    }
  } else {
    const searchData = await mpFetch(`/preapproval/search?external_reference=${userId}&limit=10`)
    if (searchData?.results?.length) {
      mpSubscriptions = searchData.results.filter(
        (s: any) => ['authorized', 'active', 'cancelled', 'paused', 'pending'].includes(s.status)
      )
    }
  }

  if (mpSubscriptions.length === 0) {
    // Comprobar si ya es Pro en la base de datos
    const { data: isProDb } = await adminSupabase.rpc('is_pro_user', { check_user_id: userId })
    return {
      synced: false,
      isPro: !!isProDb,
      message: 'No se encontraron suscripciones activas en Mercado Pago'
    }
  }

  let lastSubId: string | null = null
  for (const mpSub of mpSubscriptions) {
    const res = await syncSubscriptionFromMp(adminSupabase, mpSub.id, { fallbackUserId: userId })
    if (res.success && res.subscriptionId) {
      lastSubId = res.subscriptionId
    }
  }

  // Evaluar estado final en Supabase
  const { data: isProFinal } = await adminSupabase.rpc('is_pro_user', { check_user_id: userId })

  return {
    synced: true,
    isPro: !!isProFinal,
    subscriptionId: lastSubId,
    message: isProFinal ? 'Suscripción Pro activa' : 'Suscripción procesada'
  }
}
