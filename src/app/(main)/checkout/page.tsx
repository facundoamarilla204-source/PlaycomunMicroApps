import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutClient } from './CheckoutClient'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Finalizar compra',
  path: '/checkout',
  noindex: true,
})

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?callbackUrl=/checkout')
  }

  // Get active subscription if any
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plans(code)')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()

  if (subscription) {
    redirect('/cuenta/suscripcion')
  }

  // Await search parameters explicitly in Next.js 15
  const params = await searchParams
  const initialPlan = params?.plan === 'anual' ? 'anual' : 'mensual'

  // Fetch prices from plans table
  const { data: plans } = await supabase.from('plans').select('code, price')
  let priceMensual = 5900
  let priceAnual = 59000
  if (plans) {
    const monthlyPlan = plans.find(p => p.code === 'pro_monthly')
    const yearlyPlan = plans.find(p => p.code === 'pro_yearly')
    if (monthlyPlan) priceMensual = monthlyPlan.price
    if (yearlyPlan) priceAnual = yearlyPlan.price
  }

  const mpPublicKey =
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
    process.env.MERCADOPAGO_PUBLIC_KEY ||
    process.env.MP_PUBLIC_KEY ||
    ''

  return (
    <div className="container mx-auto px-4 pt-28 pb-12 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-800">
          Completá tu suscripción a <span className="text-amber-500">Pro</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium">
          Estás a un paso de desbloquear todo el potencial de PlayComun sin límites.
        </p>
      </div>

      <CheckoutClient 
        userEmail={user.email || ''} 
        userId={user.id} 
        initialPlan={initialPlan} 
        priceMensual={priceMensual}
        priceAnual={priceAnual}
        publicKey={mpPublicKey}
      />
    </div>
  )
}
