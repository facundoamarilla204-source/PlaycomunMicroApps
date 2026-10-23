import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPurchaseOrderByIdServer } from '@/app/actions/purchase-orders'
import { getSuppliersServer, getSupplierIngredientsMapServer } from '@/app/actions/suppliers'
import { getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'
import { PurchaseOrderEditor } from '@/components/cocina-pro/compras/PurchaseOrderEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Detalle de Orden de Compra · Amasia',
  description: 'Consulta y edición de orden de compra en Amasia.',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DetalleOrdenCompraPage({ params }: PageProps) {
  const { id } = await params

  const [orderRes, suppliersRes, ingredientsRes, mapRes] = await Promise.all([
    getPurchaseOrderByIdServer(id),
    getSuppliersServer(),
    getKitchenIngredientsServer(),
    getSupplierIngredientsMapServer(),
  ])

  if (!orderRes.data) {
    notFound()
  }

  const order = orderRes.data
  const suppliers = suppliersRes.data || []
  const ingredients = ingredientsRes.data || []
  const supplierMap = mapRes.data || {}

  return (
    <div className="animate-in fade-in duration-150 py-2">
      <PurchaseOrderEditor
        initialOrder={order}
        suppliers={suppliers}
        ingredients={ingredients}
        supplierIngredientsMap={supplierMap}
      />
    </div>
  )
}
