'use client'

import React, { useState, useEffect } from 'react'
import { Expense, ExpenseInsert, MovementType, PAYMENT_METHODS } from './types'
import { Plus, Save, X, ArrowDownRight, ArrowUpRight, Settings2 } from 'lucide-react'
import { formatLocalDate } from '@/lib/control-gastos'

interface Props {
  onAdd: (movement: Omit<ExpenseInsert, 'user_id' | 'id'>) => Promise<{ success: boolean; error?: string }>
  onUpdate: (id: string, updates: Partial<Expense>) => Promise<{ success: boolean; error?: string }>
  editingExpense: Expense | null
  onCancelEdit: () => void
  getCategoriesForType: (type: MovementType) => string[]
  onOpenCategoryModal: () => void
}

export function ExpenseForm({
  onAdd,
  onUpdate,
  editingExpense,
  onCancelEdit,
  getCategoriesForType,
  onOpenCategoryModal,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [movementType, setMovementType] = useState<MovementType>('expense')
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    payment_method: PAYMENT_METHODS[0] as string,
    expense_date: formatLocalDate(new Date()),
    notes: '',
  })

  // Obtener categorías válidas para el tipo actual
  const availableCategories = getCategoriesForType(movementType)

  // Asegurar categoría seleccionada por defecto
  useEffect(() => {
    if (!editingExpense) {
      if (!formData.category || !availableCategories.includes(formData.category)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData((prev) => ({
          ...prev,
          category: availableCategories[0] || 'Otros',
        }))
      }
    }
  }, [movementType, availableCategories, editingExpense, formData.category])

  // Cargar movimiento en edición
  useEffect(() => {
    if (editingExpense) {
      const type = editingExpense.type === 'income' ? 'income' : 'expense'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMovementType(type)
      setFormData({
        amount: editingExpense.amount.toString(),
        description: editingExpense.description,
        category: editingExpense.category,
        payment_method: editingExpense.payment_method || PAYMENT_METHODS[0],
        expense_date: editingExpense.expense_date,
        notes: editingExpense.notes || '',
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        amount: '',
        description: '',
        notes: '',
      }))
    }
  }, [editingExpense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const amountNum = parseFloat(formData.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Por favor, ingresá un importe válido mayor a 0.')
      setIsSubmitting(false)
      return
    }

    if (!formData.description.trim()) {
      setError('La descripción es obligatoria.')
      setIsSubmitting(false)
      return
    }

    const payload = {
      type: movementType,
      amount: amountNum,
      description: formData.description.trim(),
      category: formData.category || availableCategories[0] || 'Otros',
      payment_method: formData.payment_method,
      expense_date: formData.expense_date,
      notes: formData.notes.trim() || null,
    }

    let result
    if (editingExpense) {
      result = await onUpdate(editingExpense.id, payload)
    } else {
      result = await onAdd(payload)
    }

    if (result.success) {
      if (!editingExpense) {
        setFormData((prev) => ({ ...prev, amount: '', description: '', notes: '' }))
      } else {
        onCancelEdit()
      }
    } else if (result.error) {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-900">
          {editingExpense
            ? `Editar ${movementType === 'income' ? 'Ingreso' : 'Gasto'}`
            : 'Nuevo Movimiento'}
        </h2>
        {editingExpense && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Cancelar edición"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selector de Tipo: Gasto / Ingreso */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setMovementType('expense')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            movementType === 'expense'
              ? 'bg-white text-rose-700 shadow-xs ring-1 ring-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-rose-600" />
          <span>Gasto</span>
        </button>

        <button
          type="button"
          onClick={() => setMovementType('income')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            movementType === 'income'
              ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span>Ingreso</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Importe */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Importe ($) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-base font-bold text-slate-900"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Descripción <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm"
          placeholder={movementType === 'income' ? 'Ej: Sueldo mensual, Cobro factura' : 'Ej: Supermercado, Alquiler'}
          required
        />
      </div>

      {/* Categoría y Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Categoría <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={onOpenCategoryModal}
              className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
              title="Administrar categorías"
            >
              <Settings2 className="w-3 h-3" />
              <span>Gestionar</span>
            </button>
          </div>
          <select
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm"
            required
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, expense_date: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm"
            required
          />
        </div>
      </div>

      {/* Medio de pago */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Medio de Pago</label>
        <select
          value={formData.payment_method}
          onChange={(e) => setFormData((prev) => ({ ...prev, payment_method: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm"
        >
          {PAYMENT_METHODS.map((pm) => (
            <option key={pm} value={pm}>
              {pm}
            </option>
          ))}
        </select>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          rows={2}
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm resize-none"
          placeholder="Detalles o comentarios extra..."
        />
      </div>

      {/* Botón Guardar / Agregar */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none mt-2 shadow-xs cursor-pointer ${
          movementType === 'income'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-slate-900 hover:bg-slate-800'
        }`}
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : editingExpense ? (
          <>
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>{movementType === 'income' ? 'Agregar Ingreso' : 'Agregar Gasto'}</span>
          </>
        )}
      </button>
    </form>
  )
}
