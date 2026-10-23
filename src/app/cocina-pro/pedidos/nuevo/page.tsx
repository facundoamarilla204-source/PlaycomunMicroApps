import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { getKitchenClientsServer } from '@/app/actions/kitchen-orders'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { OrderEditor } from '@/components/cocina-pro/pedidos/OrderEditor'
import Link from 'next/link'
import { Crown, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nuevo Pedido | Amasia',
  description: 'Crear un nuevo pedido comercial con productos, precios acordados y entrega en Amasia.',
}

interface NewOrderPageProps {
  searchParams: Promise<{
    clientId?: string
  }>
}

export default async function NewKitchenOrderPage({ searchParams }: NewOrderPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?next=/cocina-pro/pedidos/nuevo')
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
          La creación de pedidos comerciales está disponible para cuentas con plan Pro activo.
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

  const resolvedSearchParams = await searchParams
  const preselectedClientId = resolvedSearchParams.clientId

  // Cargar clientes activos y recetas del usuario en paralelo
  const [clientsRes, recipesRes] = await Promise.all([
    getKitchenClientsServer({ includeInactive: false }),
    getUserRecipesServer(),
  ])

  if (clientsRes.error && !clientsRes.data) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-red-600">
          Error al cargar clientes: {clientsRes.error}
        </p>
        <Link
          href="/cocina-pro/pedidos"
          className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a pedidos
        </Link>
      </div>
    )
  }

  return (
    <OrderEditor
      clients={clientsRes.data || []}
      recipes={recipesRes.data || []}
      preselectedClientId={preselectedClientId}
    />
  )
}
