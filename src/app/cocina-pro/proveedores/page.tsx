import type { Metadata } from 'next'
import { getSuppliersServer } from '@/app/actions/suppliers'
import { SuppliersList } from '@/components/cocina-pro/proveedores/SuppliersList'
import { Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Proveedores y Abastecimiento · Amasia',
  description:
    'Gestioná proveedores, presentaciones comerciales de compra y acuerdos de precios en Amasia.',
}

export default async function CocinaProProveedoresPage() {
  const result = await getSuppliersServer()
  const suppliers = result.data || []

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
            <span className="text-xs text-slate-500 font-medium">Abastecimiento</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-brand shrink-0" />
            <span>Proveedores comerciales</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Mantené organizada tu red de proveedores, asociá presentaciones por bulto y consultá a quién comprarle cada ingrediente al mejor costo.
          </p>
        </div>
      </header>

      {/* Lista de Proveedores */}
      <SuppliersList initialSuppliers={suppliers} />
    </div>
  )
}
