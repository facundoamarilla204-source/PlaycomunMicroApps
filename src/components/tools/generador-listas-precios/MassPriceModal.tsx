'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { X, ArrowUpRight, ArrowDownRight, Check, Percent, Calculator } from 'lucide-react'
import { Category, PriceListProduct, RoundingRule } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  products: PriceListProduct[]
  currency: string
  onApply: (params: {
    percentage: number
    increase: boolean
    categoryId?: string
    roundingRule: RoundingRule
  }) => void
}

export function MassPriceModal({
  isOpen,
  onClose,
  categories,
  products,
  currency,
  onApply
}: Props) {
  const [percentage, setPercentage] = useState<string>('10')
  const [increase, setIncrease] = useState<boolean>(true)
  const [categoryId, setCategoryId] = useState<string>('all')
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('integer')

  if (!isOpen) return null

  const pct = Math.abs(Number(percentage)) || 0
  const multiplier = increase ? (1 + pct / 100) : (1 - pct / 100)

  const applyRule = (val: number): number => {
    switch (roundingRule) {
      case 'none':
      case 'decimals':
        return Number(val.toFixed(2))
      case 'integer':
        return Math.round(val)
      case 'tens':
        return Math.round(val / 10) * 10
      case 'fifties':
        return Math.round(val / 50) * 50
      case 'hundreds':
        return Math.round(val / 100) * 100
      default:
        return Math.round(val)
    }
  }

  // Muestra de hasta 3 productos para la vista previa
  const previewProducts = products
    .filter(p => categoryId === 'all' || p.category_id === categoryId)
    .slice(0, 3)

  const handleConfirm = () => {
    if (pct <= 0) {
      alert('Ingresá un porcentaje mayor a 0')
      return
    }
    onApply({
      percentage: pct,
      increase,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      roundingRule
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Calculator size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ajuste Masivo de Precios</h3>
            <p className="text-xs text-slate-500">Actualizá precios masivamente por inflación, costos o promociones.</p>
          </div>
        </div>

        {/* Tipo de ajuste: Aumento vs Descuento */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setIncrease(true)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all border ${
              increase 
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight size={16} /> Aumento (+)
          </button>
          <button
            type="button"
            onClick={() => setIncrease(false)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all border ${
              !increase 
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowDownRight size={16} /> Descuento / Rebaja (-)
          </button>
        </div>

        {/* Porcentaje y Alcance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Porcentaje %
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 pr-8 py-2.5 text-sm font-bold text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                %
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Alcance
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
            >
              <option value="all">Toda la lista ({products.length} productos)</option>
              {categories.map(c => {
                const count = products.filter(p => p.category_id === c.id).length
                return (
                  <option key={c.id} value={c.id}>{c.name} ({count})</option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Regla de Redondeo */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Regla de Redondeo
          </label>
          <select
            value={roundingRule}
            onChange={(e) => setRoundingRule(e.target.value as RoundingRule)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
          >
            <option value="integer">Sin decimales - Número entero (Ej: $1.250)</option>
            <option value="tens">Redondear a decenas (Ej: $1.250, $1.260)</option>
            <option value="fifties">Redondear a cincuenta (Ej: $1.250, $1.300)</option>
            <option value="hundreds">Redondear a centenas (Ej: $1.200, $1.300)</option>
            <option value="decimals">Con 2 decimales (Ej: $1.250,50)</option>
            <option value="none">Sin redondeo (Cálculo directo)</option>
          </select>
        </div>

        {/* Vista previa en vivo */}
        {previewProducts.length > 0 && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <span className="font-bold text-slate-700 block mb-2">Vista previa de impacto ({currency}):</span>
            <div className="space-y-1.5">
              {previewProducts.map(p => {
                const newPrice = applyRule(p.price * multiplier)
                return (
                  <div key={p.id} className="flex justify-between items-center text-slate-600">
                    <span className="truncate max-w-[200px]">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400">${p.price.toLocaleString('es-AR')}</span>
                      <span className="font-bold text-purple-700">${newPrice.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition-all shadow-xs"
          >
            Aplicar Ajuste a {categoryId === 'all' ? 'todos los productos' : 'la categoría'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
