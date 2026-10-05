import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SuscripcionClient } from './SuscripcionClient'
import { cancelSubscription } from './actions'

export default async function SuscripcionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?callbackUrl=/cuenta/suscripcion')
  }

  // Obtener la suscripción actual (activa o cancelada que todavía no venció)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      current_period_start,
      current_period_end,
      trial_start_at,
      trial_end_at,
      cancelled_at,
      created_at,
      provider_subscription_id,
      plans(
        id,
        name,
        code,
        price,
        currency
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Obtener métodos de pago
  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Obtener historial de pagos
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-bold text-slate-800">Suscripción y Pagos</h1>
      </div>

      <SuscripcionClient 
        subscription={subscription} 
        paymentMethods={paymentMethods || []} 
        payments={payments || []}
        userEmail={user.email || ''}
      />
    </div>
  )
}
