'use client'

import React, { useState } from 'react'
import { Expense } from './types'
import {
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  SearchX,
} from 'lucide-react'
import { DeleteConfirmModal } from './DeleteConfirmModal'

interface Props {
  expenses: Expense[]
  isLoading: boolean
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function ExpenseList({ expenses, isLoading, onEdit, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const activeMovementToDelete = expenses.find((e) => e.id === deletingId)

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await onDelete(deletingId)
      setDeletingId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl w-full" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 font-sora mb-1">
          No hay movimientos registrados
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No encontramos movimientos que coincidan con los filtros aplicados. Podés ajustar el período o registrar uno nuevo desde el formulario.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
        {expenses.map((movement) => {
          const isIncome = movement.type === 'income'

          return (
            <div
              key={movement.id}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
            >
              {/* Contenido Izquierdo */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isIncome
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                  }`}
                >
                  {isIncome ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between sm:justify-start gap-3 mb-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {movement.description}
                    </h4>

                    {/* Monto en móvil */}
                    <span
                      className={`font-extrabold text-sm sm:hidden whitespace-nowrap ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'} $
                      {movement.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[120px]">{movement.category}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{movement.expense_date}</span>
                    </div>

                    {movement.payment_method && (
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>{movement.payment_method}</span>
                      </div>
                    )}

                    {movement.notes && (
                      <div
                        className="flex items-center gap-1 text-slate-400 max-w-xs truncate"
                        title={movement.notes}
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{movement.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido Derecho: Monto y Acciones */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <span
                  className={`font-extrabold text-base hidden sm:block whitespace-nowrap ${
                    isIncome ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {isIncome ? '+' : '-'} $
                  {movement.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(movement)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar movimiento"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(movement.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar movimiento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de confirmación de eliminación accesible */}
      <DeleteConfirmModal
        isOpen={!!deletingId}
        movementDescription={
          activeMovementToDelete
            ? `${activeMovementToDelete.description} ($ ${activeMovementToDelete.amount.toLocaleString('es-AR')})`
            : undefined
        }
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
