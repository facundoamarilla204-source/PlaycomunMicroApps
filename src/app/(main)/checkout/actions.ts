'use server'

import { createClient } from '@/utils/supabase/server'
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const returnUrl = baseUrl.includes('localhost') 
      ? 'https://www.playcomun.com/cuenta/suscripcion?success=true' 
      : `${baseUrl}/cuenta/suscripcion?success=true`

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

  const planCode = planType === 'anual' ? 'pro_yearly' : 'pro_monthly'
  const { data: plan } = await supabase.from('plans').select('*').eq('code', planCode).single()

  if (!plan || !plan.provider_plan_id) {
    return { error: 'Plan no configurado' }
  }

  try {
    const response = await createSubscriptionWithCard({
      token,
      payerEmail,
      userId: user.id,
      preapprovalPlanId: plan.provider_plan_id
    })

    if (response.id) {
      // The subscription was created. MP will charge the card immediately in the background.
      // We also save the payment_method locally to show it in the UI.
      await supabase.from('payment_methods').insert({
        user_id: user.id,
        provider: 'mercadopago',
        type: 'card',
        provider_card_id: token, // This is temporary, we might update it via webhook later if needed
        is_default: true,
      })

      return { success: true, id: response.id }
    }
    return { error: 'No se pudo crear la suscripción con tarjeta' }
  } catch (error: any) {
    console.error('Card Subscription error:', error)
    return { error: error.message || 'Error al procesar la suscripción' }
  }
}
