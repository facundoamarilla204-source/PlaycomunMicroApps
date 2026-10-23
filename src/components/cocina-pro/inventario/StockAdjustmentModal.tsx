'use client'

import { useState } from 'react'
import { X, ArrowUpDown, AlertCircle, Check } from 'lucide-react'
import type { IngredientStockSummary } from '@/lib/gastronomia/types'
import { adjustIngredientStockServer } from '@/app/actions/inventory'

interface StockAdjustmentModalProps {
  ingredient: IngredientStockSummary
  onClose: () => void
  onSuccess: (newBalance: number) => void
}

export function StockAdjustmentModal({
  ingredient,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [newQuantity, setNewQuantity] = useState<string>(
    ingredient.current_balance.toString()
  )
  const [reasonCategory, setReasonCategory] = useState<string>(
    ingredient.current_balance === 0 ? 'Inventario inicial' : 'Recuento físico periódico'
  )
  const [customReason, setCustomReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedQty = parseFloat(newQuantity)
  const isValid = !isNaN(parsedQty) && parsedQty >= 0
  const diff = isValid ? parsedQty - ingredient.current_balance : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setError('Ingresá una cantidad válida mayor o igual a cero.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const finalReason =
      reasonCategory === 'Otro'
        ? customReason.trim() || 'Ajuste manual de inventario'
        : `${reasonCategory}${customReason.trim() ? ': ' + customReason.trim() : ''}`

    const res = await adjustIngredientStockServer(
      ingredient.ingredient_id,
      parsedQty,
      ingredient.package_unit,
      finalReason
    )

    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      onSuccess(res.newBalance !== undefined ? res.newBalance : parsedQty)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-adjustment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100vh-2rem)] shadow-xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <ArrowUpDown className="h-4 w-4" />
            </div>
            <div>
              <h3 id="modal-adjustment-title" className="text-sm font-bold text-slate-900">
                Ajustar inventario físico
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[260px]">
                {ingredient.ingredient_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block">Saldo actual en sistema</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {Number(ingredient.current_balance).toLocaleString('es-AR', {
                  maximumFractionDigits: 3,
                })}{' '}
                {ingredient.package_unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Diferencia calculada</span>
              <span
                className={`font-mono font-bold text-sm ${
                  diff > 0
                    ? 'text-emerald-700'
                    : diff < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}{' '}
                {ingredient.package_unit}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-qty"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Cantidad contada físicamente ({ingredient.package_unit})
            </label>
            <input
              id="new-qty"
              type="number"
              step="any"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
              placeholder="0.00"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Establece el nuevo saldo real sin perder el registro de los movimientos anteriores.
            </p>
          </div>

          <div>
            <label
              htmlFor="reason-category"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Motivo del ajuste
            </label>
            <select
              id="reason-category"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            >
              <option value="Recuento físico periódico">Recuento físico periódico</option>
              <option value="Inventario inicial">Inventario inicial</option>
              <option value="Merma no registrada">Merma o pérdida en almacén</option>
              <option value="Materia prima caducada">Materia prima caducada / dañada</option>
              <option value="Corrección de pesaje">Corrección de pesaje o unidad</option>
              <option value="Otro">Otro motivo</option>
            </select>
          </div>

          {reasonCategory === 'Otro' && (
            <div>
              <label
                htmlFor="custom-reason"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Detalle del motivo
              </label>
              <input
                id="custom-reason"
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explicación detallada para auditoría..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-lg shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirmar ajuste</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
