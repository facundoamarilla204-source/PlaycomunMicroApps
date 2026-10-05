'use client';

import { Expense } from './types';
import { Pencil, Trash2, Calendar, CreditCard, Tag } from 'lucide-react';

import { User } from '@supabase/supabase-js';

type Props = {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  user: User | null;
};

export function ExpenseList({ expenses, isLoading, onEdit, onDelete, user }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  if (!user && expenses.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No hay gastos</h3>
        <p className="text-slate-500">Iniciá sesión y empezá a registrar tus gastos para verlos acá.</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Todavía no cargaste gastos</h3>
        <p className="text-slate-500">Agregá tu primer gasto usando el formulario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {expenses.map(expense => (
        <div 
          key={expense.id} 
          className="group p-4 lg:p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between sm:justify-start gap-4 mb-1">
              <h4 className="font-semibold text-slate-900 truncate text-lg">
                {expense.description}
              </h4>
              <span className="font-bold text-neutral-900 sm:hidden">
                ${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-2">
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                <Tag className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{expense.category}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{new Date(expense.expense_date + 'T00:00:00').toLocaleDateString('es-AR')}</span>
              </div>
              
              {expense.payment_method && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>{expense.payment_method}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pt-3 sm:pt-0 border-t sm:border-0 border-slate-200 mt-2 sm:mt-0">
            <span className="font-bold text-xl text-neutral-900 hidden sm:block whitespace-nowrap">
              ${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(expense)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que querés eliminar este gasto?')) {
                    onDelete(expense.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
