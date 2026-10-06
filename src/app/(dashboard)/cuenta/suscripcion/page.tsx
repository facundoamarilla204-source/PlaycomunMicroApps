import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SuscripcionClient } from './SuscripcionClient'
import { cancelSubscription } from './actions'

/**
 * /cuenta/suscripcion
 *
 * Cuando el usuario llega con ?success=true (retorno desde MP o después de pagar
 * con tarjeta), llamamos al endpoint de sincronización para asegurarnos de que
 * Supabase refleje el estado real de MP, sin depender de que el webhook haya
 * llegado.
 *
 * La sincronización es idempotente: si la suscripción ya está en Supabase,
 * solo actualiza los datos sin crear duplicados.
 */
export default async function SuscripcionPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string, preapproval_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?callbackUrl=/cuenta/suscripcion')
  }

  const params = await searchParams
  const isSuccess = params.success === 'true'
  const incomingPreapprovalId = params.preapproval_id

  // Si el usuario regresa con ?success=true, sincronizar con MP antes de leer Supabase
  if (isSuccess) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playcomun.com'
      const body: Record<string, string> = {}
      if (incomingPreapprovalId) {
        body.preapproval_id = incomingPreapprovalId
      }
      await fetch(`${baseUrl}/api/subscriptions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pasamos el cookie de sesión para que el endpoint pueda autenticar al usuario
          Cookie: (await import('next/headers')).cookies().toString(),
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
    } catch (e) {
      console.error('[suscripcion/page] sync error:', e)
      // No bloqueamos la carga de la página si sync falla
    }
  }

  // Obtener la suscripción más reciente (activa, cancelada o expirada)
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
        currency,
        billing_interval
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
        showSuccessBanner={isSuccess}
      />
    </div>
  )
}
