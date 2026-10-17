'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createSubscriptionCheckout, createSubscriptionWithCard } from '@/lib/mercadopago'
import { syncSubscriptionFromMp } from '@/lib/subscription-sync'

export async function createCheckoutSession(planType: 'mensual' | 'anual') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { url: '/ingresar?callbackUrl=/checkout' }
  }

  if (planType !== 'mensual' && planType !== 'anual') {
    return { error: 'Tipo de plan no válido' }
  }

  // Verificar que el usuario no tenga ya una suscripción activa
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (existingSub) {
    return { url: '/cuenta/suscripcion' }
  }

  const planCode = planType === 'anual' ? 'pro_yearly' : 'pro_monthly'
  const { data: plan } = await supabase.from('plans').select('*').eq('code', planCode).single()

  if (!plan || !plan.provider_plan_id) {
    return { error: 'Plan no encontrado en el sistema' }
  }

  const userEmail = user.email
  if (!userEmail) {
    return { error: 'Email no encontrado' }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playcomun.online'
    const returnUrl = `${baseUrl}/cuenta/suscripcion?success=true`

    const checkout = await createSubscriptionCheckout({
      payerEmail: userEmail,
      userId: user.id,
      returnUrl,
      planTitle: plan.name || 'Suscripción PlayComun Pro',
      price: plan.price,
      frequency: planType === 'anual' ? 12 : 1,
      frequencyType: 'months'
    })

    if (checkout.initPoint) {
      return { url: checkout.initPoint }
    } else {
      return { error: 'No se pudo generar el link de pago' }
    }
  } catch (error: any) {
    console.error('Checkout error:', error)
    return { error: error.message || 'Error al procesar el pago' }
  }
}

export async function createCardSubscription({
  planType,
  token,
  payerEmail,
  paymentMethodId,
  issuerId,
  identification
}: {
  planType: 'mensual' | 'anual',
  token: string,
  payerEmail: string,
  paymentMethodId: string,
  issuerId: string,
  identification: any
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Verificar idempotencia: si ya es Pro, no crear otra suscripción
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (existingSub) {
    return { success: true, alreadyPro: true }
  }

  const planCode = planType === 'anual' ? 'pro_yearly' : 'pro_monthly'
  const { data: plan } = await supabase.from('plans').select('*').eq('code', planCode).single()

  if (!plan || !plan.provider_plan_id) {
    return { error: 'Plan no configurado' }
  }

  try {
    const mpResponse = await createSubscriptionWithCard({
      token,
      payerEmail,
      userId: user.id,
      preapprovalPlanId: plan.provider_plan_id
    })

    if (!mpResponse.id) {
      return { error: 'No se pudo crear la suscripción con tarjeta' }
    }

    const mpStatus = mpResponse.status // authorized | pending | etc
    const isActive = mpStatus === 'authorized' || mpStatus === 'active'

    // Sincronizar en Supabase utilizando la lógica central unificada
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await syncSubscriptionFromMp(adminSupabase, mpResponse.id, { fallbackUserId: user.id })

    // Guardar método de pago (metadata no sensible solamente)
    const cardBrand = mpResponse.payment_method_id || paymentMethodId || null
    await adminSupabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        provider: 'mercadopago',
        type: 'card',
        provider_card_id: mpResponse.card_id || null,
        brand: cardBrand,
        is_default: true,
      })

    return {
      success: true,
      id: mpResponse.id,
      status: mpStatus,
      isActive
    }
  } catch (error: any) {
    console.error('Card Subscription error:', error)
    return { error: error.message || 'Error al procesar la suscripción' }
  }
}
