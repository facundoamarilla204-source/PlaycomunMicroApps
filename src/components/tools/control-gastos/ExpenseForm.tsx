'use client';

import { useState, useEffect } from 'react';
import { Expense, ExpenseInsert, EXPENSE_CATEGORIES, PAYMENT_METHODS } from './types';
import { Plus, Save, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';

type Props = {
  user: User | null;
  onAdd: (expense: Omit<ExpenseInsert, 'user_id'>) => Promise<{ success: boolean; error?: string; redirect?: boolean }>;
  onUpdate: (id: string, updates: Partial<Expense>) => Promise<{ success: boolean; error?: string }>;
  editingExpense: Expense | null;
  onCancelEdit: () => void;
};

export function ExpenseForm({ user, onAdd, onUpdate, editingExpense, onCancelEdit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: EXPENSE_CATEGORIES[0] as string,
    payment_method: PAYMENT_METHODS[0] as string,
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (editingExpense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        amount: editingExpense.amount.toString(),
        description: editingExpense.description,
        category: editingExpense.category,
        payment_method: editingExpense.payment_method || PAYMENT_METHODS[0],
        expense_date: editingExpense.expense_date,
        notes: editingExpense.notes || '',
      });
    } else {
      // Clear form
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        amount: '',
        description: '',
        notes: '',
      }));
    }
  }, [editingExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Por favor, ingresá un monto válido mayor a 0.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('La descripción es obligatoria.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      amount: amountNum,
      description: formData.description.trim(),
      category: formData.category,
      payment_method: formData.payment_method,
      expense_date: formData.expense_date,
      notes: formData.notes.trim() || null,
    };

    let result;
    if (editingExpense) {
      result = await onUpdate(editingExpense.id, payload);
    } else {
      result = await onAdd(payload);
    }

    if (result.success) {
      if (!editingExpense) {
        setFormData(prev => ({ ...prev, amount: '', description: '', notes: '' }));
      } else {
        onCancelEdit();
      }
    } else if (result.error) {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-neutral-900 font-sora">
          {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
        </h2>
        {editingExpense && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Cancelar edición"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Monto ($) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-lg font-semibold"
          placeholder="Ej: 15000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Descripción <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
          placeholder="Ej: Supermercado Coto"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white appearance-none"
            required
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Medio de Pago
        </label>
        <select
          value={formData.payment_method}
          onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white appearance-none"
        >
          {PAYMENT_METHODS.map(pm => (
            <option key={pm} value={pm}>{pm}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notas Adicionales (Opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 hover:bg-white min-h-[80px] resize-y"
          placeholder="Detalles extra..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-2"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : editingExpense ? (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        ) : (
          <>
            {user ? <Plus className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {user ? 'Agregar Gasto' : 'Iniciar Sesión para Guardar'}
          </>
        )}
      </button>
    </form>
  );
}
