'use client'

import { Plus, Trash2, Package } from 'lucide-react'
import { AdditionalCost, formatCurrency } from '@/lib/costo-receta'

export function RecipeAdditionalCostsSection({
  additionalCosts,
  onChange,
}: {
  additionalCosts: AdditionalCost[]
  onChange: (updated: AdditionalCost[]) => void
}) {
  const handleAdd = () => {
    const newCost: AdditionalCost = {
      id: crypto.randomUUID(),
      name: '',
      amount: 0,
    }
    onChange([...additionalCosts, newCost])
  }

  const handleUpdate = (index: number, patch: Partial<AdditionalCost>) => {
    const updated = [...additionalCosts]
    updated[index] = { ...updated[index], ...patch }
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    onChange(additionalCosts.filter((_, i) => i !== index))
  }

  const totalAdditional = additionalCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Costos adicionales y packaging ({additionalCosts.length})
            </h2>
            {totalAdditional > 0 && (
              <span className="text-xs font-bold text-slate-800">
                Total: {formatCurrency(totalAdditional)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Mano de obra directa, bandejas, bolsas, etiquetas, gas o electricidad proporcional al lote.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors shadow-xs min-h-[44px] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar concepto</span>
        </button>
      </div>

      {additionalCosts.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl my-2">
          <Package className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-700">
            Sin costos adicionales registrados
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Opcional: podés imputar envoltorios, cajas o servicios de horneado.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {additionalCosts.map((cost, idx) => (
            <div
              key={cost.id || idx}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={cost.name}
                  onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                  placeholder="Concepto (ej: Caja microcorrugado 25x25)..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                />
              </div>

              <div className="w-36">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cost.amount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      handleUpdate(idx, { amount: isNaN(val) ? 0 : val })
                    }}
                    placeholder="0"
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                aria-label="Eliminar costo adicional"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
