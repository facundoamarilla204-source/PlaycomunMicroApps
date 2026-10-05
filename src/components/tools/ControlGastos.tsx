'use client';

import { useState, useMemo } from 'react';
import { useExpenses } from './control-gastos/useExpenses';
import { ExpenseForm } from './control-gastos/ExpenseForm';
import { ExpenseList } from './control-gastos/ExpenseList';
import { ExpenseSummary } from './control-gastos/ExpenseSummary';
import { Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS } from './control-gastos/types';
import { User } from '@supabase/supabase-js';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export function ControlGastos({ user }: { user: User | null }) {
  const { expenses, isLoading, error, addExpense, updateExpense, deleteExpense } = useExpenses(user);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('este-mes'); // 'hoy', 'esta-semana', 'este-mes', 'mes-anterior', 'todos'
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('mas-recientes'); // 'mas-recientes', 'mas-antiguos', 'mayor-monto', 'menor-monto'

  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.description.toLowerCase().includes(q));
    }

    // Category
    if (categoryFilter !== 'Todas') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Payment Method
    if (paymentFilter !== 'Todos') {
      result = result.filter(e => e.payment_method === paymentFilter);
    }

    // Period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    result = result.filter(e => {
      const expDate = new Date(e.expense_date + 'T00:00:00');
      
      if (period === 'hoy') {
        return expDate.getTime() === today.getTime();
      }
      if (period === 'esta-semana') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return expDate >= startOfWeek;
      }
      if (period === 'este-mes') {
        return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
      }
      if (period === 'mes-anterior') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return expDate.getMonth() === lastMonth.getMonth() && expDate.getFullYear() === lastMonth.getFullYear();
      }
      return true; // 'todos'
    });

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.expense_date + 'T00:00:00').getTime();
      const dateB = new Date(b.expense_date + 'T00:00:00').getTime();
      
      if (sortBy === 'mas-recientes') return dateB - dateA;
      if (sortBy === 'mas-antiguos') return dateA - dateB;
      if (sortBy === 'mayor-monto') return b.amount - a.amount;
      if (sortBy === 'menor-monto') return a.amount - b.amount;
      
      return 0;
    });

    return result;
  }, [expenses, searchQuery, period, categoryFilter, paymentFilter, sortBy]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-4 font-sora">
          Control de Gastos
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          Registrá y organizá tus gastos diarios de forma rápida. 
          Conocé en qué se va tu dinero y empezá a ahorrar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Lado Izquierdo: Formulario */}
        <div className="lg:col-span-4 bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
          <ExpenseForm 
            user={user}
            onAdd={addExpense}
            onUpdate={updateExpense}
            editingExpense={editingExpense}
            onCancelEdit={() => setEditingExpense(null)}
          />
        </div>

        {/* Lado Derecho: Resumen y Lista */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <ExpenseSummary expenses={filteredExpenses} />
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-neutral-900 font-sora">Tus Gastos</h3>
              
              {/* Barra de búsqueda simple */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar gastos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                />
              </div>

              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium
                  ${showFilters ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>

            {/* Filtros Expandibles */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Período</label>
                  <select 
                    value={period} onChange={e => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="hoy">Hoy</option>
                    <option value="esta-semana">Esta semana</option>
                    <option value="este-mes">Este mes</option>
                    <option value="mes-anterior">Mes anterior</option>
                    <option value="todos">Todos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Categoría</label>
                  <select 
                    value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="Todas">Todas</option>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Pago</label>
                  <select 
                    value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="Todos">Todos</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Ordenar por</label>
                  <select 
                    value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="mas-recientes">Más recientes</option>
                    <option value="mas-antiguos">Más antiguos</option>
                    <option value="mayor-monto">Mayor monto</option>
                    <option value="menor-monto">Menor monto</option>
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}
            
            <ExpenseList 
              expenses={filteredExpenses}
              isLoading={isLoading}
              onEdit={setEditingExpense}
              onDelete={deleteExpense}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
