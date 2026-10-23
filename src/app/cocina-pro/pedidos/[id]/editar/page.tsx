import React from 'react'
import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import {
  getKitchenOrderByIdServer,
  getKitchenClientsServer,
} from '@/app/actions/kitchen-orders'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { OrderEditor } from '@/components/cocina-pro/pedidos/OrderEditor'
import Link from 'next/link'
import { Crown, ArrowLeft } from 'lucide-react'

interface EditOrderPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EditOrderPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: order } = await getKitchenOrderByIdServer(id)

  if (!order) {
    return {
      title: 'Editar Pedido | Amasia',
    }
  }

  return {
    title: `Editar Pedido #${order.order_code} | Amasia`,
    description: `Modificar cantidades o productos del pedido #${order.order_code}.`,
  }
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?next=/cocina-pro/pedidos')
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-[#7f22fe] border border-violet-200/80 flex items-center justify-center mx-auto">
          <Crown className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
          Función exclusiva de Amasia Pro
        </h2>
        <p className="text-sm text-slate-600 font-sans">
          La edición de pedidos está disponible para cuentas con plan Pro activo.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/cocina-pro/pedidos"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center justify-center active:scale-[0.98]"
          >
            Volver a pedidos
          </Link>
          <Link
            href="/planes"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white shadow-xs transition-colors min-h-[44px] inline-flex items-center justify-center active:scale-[0.98]"
          >
            Ver planes Pro
          </Link>
        </div>
      </div>
    )
  }

  const { id } = await params

  const [orderRes, clientsRes, recipesRes] = await Promise.all([
    getKitchenOrderByIdServer(id),
    getKitchenClientsServer({ includeInactive: true }),
    getUserRecipesServer(),
  ])

  if (orderRes.error || !orderRes.data) {
    return notFound()
  }

  return (
    <OrderEditor
      initialOrder={orderRes.data}
      clients={clientsRes.data || []}
      recipes={recipesRes.data || []}
    />
  )
}
