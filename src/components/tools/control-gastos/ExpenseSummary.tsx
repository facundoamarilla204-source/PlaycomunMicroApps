'use client';

import { useMemo } from 'react';
import { Expense } from './types';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';

export function ExpenseSummary({ expenses }: { expenses: Expense[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const summary = useMemo(() => {
    let totalMonth = 0;
    let maxExpense = 0;
    let totalOverall = 0;

    const categoryTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      totalOverall += exp.amount;
      
      const expDate = new Date(exp.expense_date + 'T00:00:00');
      if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
        totalMonth += exp.amount;
        if (exp.amount > maxExpense) maxExpense = exp.amount;
        
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }
    });

    const avgExpense = expenses.length > 0 ? totalOverall / expenses.length : 0;
    
    // Top category this month
    let topCategory = 'Ninguna';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (amount > topCategoryAmount) {
        topCategory = cat;
        topCategoryAmount = amount;
      }
    });

    return { totalMonth, maxExpense, avgExpense, topCategory };
  }, [expenses, currentMonth, currentYear]);

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-purple-300" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Total del Mes</h3>
        </div>
        <p className="text-3xl font-extrabold tracking-tight font-sora text-white">
          {formatter.format(summary.totalMonth)}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-500">
          <TrendingUp className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mayor Gasto (Mes)</h3>
        </div>
        <p className="text-2xl font-bold text-slate-900 font-sora">
          {formatter.format(summary.maxExpense)}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-500">
          <PieChart className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría Principal</h3>
        </div>
        <p className="text-2xl font-bold text-slate-900 font-sora truncate" title={summary.topCategory}>
          {summary.topCategory}
        </p>
      </div>
    </div>
  );
}
