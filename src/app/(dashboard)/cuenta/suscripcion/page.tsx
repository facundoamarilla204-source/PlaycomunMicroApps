import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { SuscripcionClient } from './SuscripcionClient'
import { buildMetadata } from '@/lib/metadata'
import { isProUser, getUserEffectiveSubscription } from '@/lib/pro'
import { syncUserSubscriptions } from '@/lib/subscription-sync'
import { AccountNav } from '@/components/account/AccountNav'

export const metadata = buildMetadata({
  title: 'Mi suscripción',
  path: '/cuenta/suscripcion',
  noindex: true,
})

/**
 * /cuenta/suscripcion
 *
 * Panel central de gestión de la suscripción Pro y métodos de pago.
 * Cuando el usuario regresa con ?success=true (retorno desde MP o tras abonar con tarjeta),
 * se ejecuta la sincronización autoritativa directamente con Mercado Pago.
 */
export default async function SuscripcionPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; preapproval_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?callbackUrl=/cuenta/suscripcion')
  }

  const params = await searchParams
  const isSuccess = params.success === 'true'
  const incomingPreapprovalId = params.preapproval_id

  // Si regresa de un flujo de pago, sincronizar con MP directamente antes de renderizar
  if (isSuccess) {
    try {
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await syncUserSubscriptions(adminSupabase, user.id, incomingPreapprovalId)
    } catch (e) {
      console.error('[suscripcion/page] error en sincronización directa:', e)
    }
  }

  // Evaluar estado Pro central
  const isPro = await isProUser(user.id)

  // Obtener la suscripción efectiva real del usuario (filtra archivadas, foráneas y obsoletas)
  const subscription = await getUserEffectiveSubscription(supabase, user.id)

  // Obtener métodos de pago solo si el usuario tiene una suscripción Pro o activa
  let paymentMethods: any[] = []
  if (subscription || isPro) {
    const { data: pmData } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    paymentMethods = pmData || []
  }

  // Obtener historial de pagos auténticos del usuario (excluyendo archivados/duplicados/foráneos)
  // Ordenados cronológicamente por fecha de cobro real (paid_at), más reciente primero
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      currency,
      status,
      payment_method,
      provider_payment_id,
      paid_at,
      created_at
    `)
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // Obtener precios vigentes de la tabla plans
  const { data: plans } = await supabase.from('plans').select('code, price')
  let priceMensual = 5900
  let priceAnual = 59000
  if (plans) {
    const monthlyPlan = plans.find(p => p.code === 'pro_monthly')
    const yearlyPlan = plans.find(p => p.code === 'pro_yearly')
    if (monthlyPlan) priceMensual = Number(monthlyPlan.price)
    if (yearlyPlan) priceAnual = Number(yearlyPlan.price)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full pb-16 pt-2">
      <AccountNav isPro={isPro} />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Suscripción y Pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administrá tu plan activo, ciclo de facturación y comprobantes emitidos.
          </p>
        </div>
      </header>

      <SuscripcionClient
        subscription={subscription}
        paymentMethods={paymentMethods || []}
        payments={payments || []}
        userEmail={user.email || ''}
        isPro={isPro}
        showSuccessBanner={isSuccess}
        incomingPreapprovalId={incomingPreapprovalId}
        priceMensual={priceMensual}
        priceAnual={priceAnual}
      />
    </div>
  )
}
