'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createSubscriptionCheckout, createSubscriptionWithCard } from '@/lib/mercadopago'

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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playcomun.com'
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

    // Verificar el estado real devuelto por MP
    const mpStatus = mpResponse.status // authorized | pending | etc
    const isActive = mpStatus === 'authorized' || mpStatus === 'active'

    // Admin client para bypassar RLS en subscriptions (users no tienen INSERT)
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calcular fechas de período
    const now = new Date().toISOString()
    const nextPayment = mpResponse.next_payment_date || null
    const lastCharged = mpResponse.summarized?.last_charged_date || (isActive ? now : null)

    // Insertar la suscripción en Supabase inmediatamente
    const { data: newSub, error: subErr } = await adminSupabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        provider: 'mercadopago',
        provider_subscription_id: mpResponse.id,
        provider_plan_id: plan.provider_plan_id,
        provider_status: mpStatus,
        status: isActive ? 'active' : 'trialing',
        current_period_start: lastCharged || now,
        current_period_end: nextPayment,
      })
      .select('id')
      .single()

    if (subErr) {
      console.error('Error guardando suscripción en Supabase:', subErr)
      // No bloqueamos el flujo — el webhook puede sincronizar luego
    }

    // Si el cobro fue inmediato, registrar el pago
    if (isActive && mpResponse.summarized?.charged_amount > 0 && newSub) {
      await adminSupabase
        .from('payments')
        .insert({
          user_id: user.id,
          subscription_id: newSub.id,
          provider: 'mercadopago',
          provider_payment_id: `sub_${mpResponse.id}_1`,
          amount: mpResponse.summarized.last_charged_amount || plan.price,
          currency: 'ARS',
          status: 'approved',
          payment_method: mpResponse.payment_method_id || paymentMethodId || null,
          paid_at: lastCharged || now,
        })
    }

    // Guardar método de pago (metadata no sensible solamente)
    if (newSub) {
      // Intentar obtener info de la tarjeta del response de MP
      const cardBrand = mpResponse.payment_method_id || null
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
        .onConflict() // ignorar duplicados
    }

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
