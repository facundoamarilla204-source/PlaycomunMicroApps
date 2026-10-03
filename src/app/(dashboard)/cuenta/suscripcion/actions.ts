'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Verificar que la suscripción pertenezca al usuario
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('provider_subscription_id')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .single()

  if (!sub) {
    return { error: 'Suscripción no encontrada' }
  }

  try {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    
    if (sub.provider_subscription_id && mpToken) {
      // Cancelar en Mercado Pago (preapproval)
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${sub.provider_subscription_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      })
      
      if (!mpResponse.ok) {
        console.error('Error cancelando en MP:', await mpResponse.text())
        // Continuamos de todos modos para actualizar la base de datos local
      }
    }

    // Actualizar base de datos local
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) throw error

    revalidatePath('/cuenta/suscripcion')
    return { success: true }
  } catch (error: any) {
    console.error('Error cancelando suscripción:', error)
    return { error: 'Error al cancelar la suscripción' }
  }
}
