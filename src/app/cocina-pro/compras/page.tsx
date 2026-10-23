import type { Metadata } from 'next'
import { getPurchaseOrdersServer } from '@/app/actions/purchase-orders'
import { PurchaseOrdersList } from '@/components/cocina-pro/compras/PurchaseOrdersList'
import { ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Órdenes de Compra · Amasia',
  description:
    'Planificá compras a proveedores, gestioná pedidos y recepcioná mercadería en almacén con Amasia.',
}

export default async function CocinaProComprasPage() {
  const result = await getPurchaseOrdersServer()
  const orders = result.data || []

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <header className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-sans font-bold text-xs text-[#7f22fe] uppercase tracking-wider">
              Amasia
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Compras</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-brand shrink-0" />
            <span>Órdenes de compra y recepción</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Emití pedidos a proveedores, verificá los precios pagados y confirmá la recepción de mercadería con ingreso automático e idempotente al inventario.
          </p>
        </div>
      </header>

      {/* Lista de Órdenes */}
      <PurchaseOrdersList initialOrders={orders} />
    </div>
  )
}
