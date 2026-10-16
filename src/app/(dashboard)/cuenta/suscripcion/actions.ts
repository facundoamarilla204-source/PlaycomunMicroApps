'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { syncUserSubscriptions } from '@/lib/subscription-sync'

/**
 * Cancela la renovación automática de una suscripción en Mercado Pago y Supabase.
 * Preserva el current_period_end para garantizar el acceso Pro hasta el final del período pagado.
 */
export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Verificar que la suscripción pertenezca al usuario
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('provider_subscription_id, current_period_end')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .single()

  if (!sub) {
    return { error: 'Suscripción no encontrada' }
  }

  try {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    
    if (sub.provider_subscription_id && mpToken) {
      // Cancelar renovación automática en Mercado Pago (preapproval)
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

    // Actualizar base de datos local preservando el período pagado
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        provider_status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) throw error

    revalidatePath('/cuenta/suscripcion')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error cancelando suscripción:', error)
    return { error: 'Error al cancelar la suscripción' }
  }
}

/**
 * Sincroniza la suscripción del usuario autenticado consultando Mercado Pago en vivo
 * y actualizando la base de datos y la caché de Next.js.
 */
export async function syncCurrentUserSubscription(preapprovalId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', synced: false, isPro: false }
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const result = await syncUserSubscriptions(adminSupabase, user.id, preapprovalId)
  revalidatePath('/cuenta/suscripcion')
  revalidatePath('/')
  return result
}
