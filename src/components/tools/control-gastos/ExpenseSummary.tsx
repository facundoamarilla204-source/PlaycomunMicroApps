'use client'

import React, { useMemo } from 'react'
import { Expense } from './types'
import { TrendingUp, TrendingDown, Wallet, Tag } from 'lucide-react'
import { calculateMovementsSummary } from '@/lib/control-gastos'

interface Props {
  expenses: Expense[]
  periodLabel?: string
}

export function ExpenseSummary({ expenses, periodLabel }: Props) {
  const summary = useMemo(() => {
    return calculateMovementsSummary(expenses)
  }, [expenses])

  const formatter = useMemo(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }, [])

  const isPositiveBalance = summary.netBalance >= 0

  return (
    <div className="space-y-3 font-sans">
      {/* 3 Tarjetas Principales de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Total Ingresos */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Ingresos</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              {summary.incomeCount} {summary.incomeCount === 1 ? 'reg.' : 'regs.'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight truncate tabular-nums">
            {formatter.format(summary.totalIncome)}
          </p>
        </div>

        {/* 2. Total Gastos */}
        <div className="bg-gradient-to-br from-rose-50/80 to-white border border-rose-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-rose-800">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Gastos</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
              {summary.expenseCount} {summary.expenseCount === 1 ? 'reg.' : 'regs.'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-950 tracking-tight truncate tabular-nums">
            {formatter.format(summary.totalExpense)}
          </p>
        </div>

        {/* 3. Saldo Neto (Ingresos - Gastos) */}
        <div
          className={`border rounded-2xl p-4 sm:p-5 shadow-xs text-white transition-colors ${
            isPositiveBalance
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-slate-800'
              : 'bg-gradient-to-br from-red-950 via-slate-900 to-rose-950 border-rose-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-purple-200">
              <Wallet className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Saldo Neto
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPositiveBalance
                  ? 'bg-purple-800/60 text-purple-200'
                  : 'bg-rose-900/80 text-rose-200'
              }`}
            >
              {isPositiveBalance ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate text-white tabular-nums">
            {formatter.format(summary.netBalance)}
          </p>
        </div>
      </div>

      {/* Franja secundaria de contexto */}
      {summary.totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Período evaluado:</span>
            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              {periodLabel || 'Filtro actual'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {summary.topExpenseCategory !== 'Ninguna' && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Mayor categoría de gasto:</span>
                <span className="font-bold text-slate-900">
                  {summary.topExpenseCategory} ({formatter.format(summary.topExpenseCategoryAmount)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
