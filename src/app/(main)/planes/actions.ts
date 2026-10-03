'use server'

import { createClient } from '@/utils/supabase/server'
import { createSubscriptionCheckout } from '@/lib/mercadopago'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(planType: 'mensual' | 'anual') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { url: '/ingresar?callbackUrl=/planes' }
  }

  if (planType !== 'mensual' && planType !== 'anual') {
    return { error: 'Tipo de plan no válido' }
  }

  // Ensure we have user email
  const userEmail = user.email
  if (!userEmail) {
    throw new Error('Email no encontrado')
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const returnUrl = baseUrl.includes('localhost') 
      ? 'https://www.playcomun.com/cuenta?success=true' 
      : `${baseUrl}/cuenta?success=true`

    const checkout = await createSubscriptionCheckout({
      planType: planType,
      payerEmail: userEmail,
      userId: user.id,
      returnUrl: returnUrl
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
