'use client'

import React from 'react'
import { CurrencyCode, CommercialDocument } from './types'
import { DocumentTotals, formatCurrencyAmount } from './math'
import { Percent, Receipt, Calculator } from 'lucide-react'

interface Props {
  totals: DocumentTotals
  currency: CurrencyCode
  globalDiscountPercent: number
  applyTax: boolean
  taxRate: number
  onUpdateGeneral: (field: keyof CommercialDocument, value: unknown) => void
}

export function TotalsAndTaxForm({
  totals,
  currency,
  globalDiscountPercent,
  applyTax,
  taxRate,
  onUpdateGeneral,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            5. Descuentos e impuestos
          </h3>
          <p className="text-[11px] text-slate-500">
            Ajustes generales e impuestos opcionales sin condición fiscal asumida
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* CONFIGURACIÓN DE DESCUENTO E IMPUESTOS OPCIONALES */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-purple-600" />
                Descuento global sobre el total (%)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={globalDiscountPercent || ''}
                onChange={(e) =>
                  onUpdateGeneral('globalDiscountPercent', Number(e.target.value) || 0)
                }
                placeholder="0"
                className="w-32 px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
              <span className="text-xs text-slate-500">
                {globalDiscountPercent > 0
                  ? `Se descuenta ${globalDiscountPercent}% al subtotal`
                  : 'Sin descuento general'}
              </span>
            </div>
          </div>

          {/* IMPUESTO OPCIONAL CONFIGURABLE */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="toggle-tax"
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <input
                  id="toggle-tax"
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => onUpdateGeneral('applyTax', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <Receipt className="w-4 h-4 text-slate-500" />
                Desglosar impuesto / IVA (Opcional)
              </label>
              <span className="text-[10px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                No fiscal
              </span>
            </div>

            {applyTax && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-3">
                <label className="text-xs text-slate-600 font-medium">Alícuota:</label>
                <select
                  value={taxRate}
                  onChange={(e) => onUpdateGeneral('taxRate', Number(e.target.value))}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value={21}>21% (IVA General)</option>
                  <option value={10.5}>10.5% (IVA Reducido)</option>
                  <option value={27}>27% (Servicios)</option>
                  <option value={0}>0% (Exento)</option>
                </select>
                <span className="text-[10px] text-slate-500">
                  Cálculo informativo para cotización
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RESUMEN DE TOTALES CALCULADO */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 pb-1.5 border-b border-slate-200">
            <span>Subtotal de líneas:</span>
            <span className="font-semibold text-slate-800">
              {formatCurrencyAmount(totals.rawSubtotal, currency)}
            </span>
          </div>

          {totals.linesDiscountTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-red-600">
              <span>Descuentos en ítems:</span>
              <span className="font-semibold">
                -{formatCurrencyAmount(totals.linesDiscountTotal, currency)}
              </span>
            </div>
          )}

          {globalDiscountPercent > 0 && (
            <div className="flex items-center justify-between text-xs text-red-600">
              <span>Descuento global ({globalDiscountPercent}%):</span>
              <span className="font-semibold">
                -{formatCurrencyAmount(totals.globalDiscountAmount, currency)}
              </span>
            </div>
          )}

          {applyTax && taxRate > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span>IVA ({taxRate}%):</span>
              <span className="font-semibold text-slate-800">
                +{formatCurrencyAmount(totals.taxAmount, currency)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-purple-600" />
              TOTAL A PAGAR:
            </span>
            <span className="text-lg font-extrabold text-purple-700">
              {formatCurrencyAmount(totals.grandTotal, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
