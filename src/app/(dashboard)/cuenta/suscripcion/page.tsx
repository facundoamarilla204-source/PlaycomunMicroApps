import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SuscripcionClient } from './SuscripcionClient'
import { cancelSubscription } from './actions'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Mi suscripción',
  path: '/cuenta/suscripcion',
  noindex: true,
})

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full space-y-6">
      <div className="flex flex-col gap-2 pb-5 border-b border-slate-200/80">
        <a 
          href="/cuenta" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors w-fit py-1"
        >
          <span>← Volver a mi cuenta</span>
        </a>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Suscripción y Pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administrá tu plan activo, métodos de pago e historial de comprobantes.
          </p>
        </div>
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
