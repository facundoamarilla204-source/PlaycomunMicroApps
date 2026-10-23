import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { getKitchenClientsServer } from '@/app/actions/kitchen-orders'
import { ClientsDirectory } from '@/components/cocina-pro/clientes/ClientsDirectory'
import Link from 'next/link'
import { Crown, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Directorio de Clientes | Amasia',
  description: 'Gestión de clientes y contactos comerciales para pedidos en Amasia.',
}

export default async function KitchenClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar?next=/cocina-pro/clientes')
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
          El directorio de clientes, pedidos comerciales y calendario de entregas están disponibles para cuentas con plan Pro activo.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/cocina-pro"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center justify-center active:scale-[0.98]"
          >
            Volver al inicio
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

  const { data: clients, error } = await getKitchenClientsServer({ includeInactive: true })

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-red-600">
          Ocurrió un error al cargar los clientes: {error}
        </p>
        <Link
          href="/cocina-pro"
          className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel principal
        </Link>
      </div>
    )
  }

  return <ClientsDirectory initialClients={clients || []} />
}
