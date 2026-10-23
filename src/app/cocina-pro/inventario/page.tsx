import type { Metadata } from 'next'
import { getIngredientStockSummariesServer } from '@/app/actions/inventory'
import { InventoryStockTable } from '@/components/cocina-pro/inventario/InventoryStockTable'
import { Boxes, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inventario y Existencias · Amasia',
  description:
    'Control de existencias reales, auditoría cronológica de movimientos y rotación de insumos en Amasia.',
}

export default async function CocinaProInventarioPage() {
  const result = await getIngredientStockSummariesServer()
  const summaries = result.data || []

  // Extraer categorías únicas
  const categories = Array.from(
    new Set(summaries.map((s) => s.category).filter(Boolean) as string[])
  ).sort()

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <header className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans font-bold text-xs text-[#7f22fe] uppercase tracking-wider">
                Amasia
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Control de Stock</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="h-6 w-6 text-brand shrink-0" />
              <span>Inventario y existencias</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
              Supervisá las existencias reales en tu almacén, realizá recuentos físicos periódicos y auditá cada entrada, salida y ajuste con trazabilidad inmutable.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/cocina-pro/ingredientes"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px]"
            >
              <span>Ver biblioteca de insumos</span>
            </Link>
            <Link
              href="/cocina-pro/compras/nueva"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva compra</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Tabla e Historial */}
      <InventoryStockTable
        initialSummaries={summaries}
        categories={categories}
      />
    </div>
  )
}
