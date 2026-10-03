import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutClient } from './CheckoutClient'

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
      />
    </div>
  )
}
