'use client'

import React from 'react'
import { CurrencyCode, DocumentLineItem, DocumentType } from './types'
import { formatCurrencyAmount } from './math'
import { Plus, Copy, Trash2, Layers } from 'lucide-react'

interface Props {
  items: DocumentLineItem[]
  currency: CurrencyCode
  docType: DocumentType
  onAddItem: () => void
  onDuplicateItem: (id: string) => void
  onRemoveItem: (id: string) => void
  onUpdateItem: (id: string, field: keyof DocumentLineItem, value: string | number) => void
}

export function LineItemsTable({
  items,
  currency,
  docType,
  onAddItem,
  onDuplicateItem,
  onRemoveItem,
  onUpdateItem,
}: Props) {
  const getSectionTitle = () => {
    switch (docType) {
      case 'orden-trabajo':
        return '4. Mano de obra, repuestos y materiales'
      case 'recibo':
        return '4. Conceptos incluidos en el pago'
      default:
        return '4. Detalle de productos y servicios'
    }
  }

  const getItemPlaceholder = () => {
    switch (docType) {
      case 'orden-trabajo':
        return 'Ej. Mano de obra cambio de módulo / Repuesto SSD NVMe 1TB'
      case 'recibo':
        return 'Ej. Servicio de pintura integral / Anticipo por honorarios profesionales'
      default:
        return 'Ej. Diseño de sitio web responsive / Provisión de luminarias LED'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{getSectionTitle()}</h3>
          <p className="text-[11px] text-slate-500">
            Agregá, duplicá o modificá las líneas con cálculo automático en tiempo real
          </p>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar línea
        </button>
      </div>

      {/* DESKTOP TABLE VIEW (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Descripción o Tarea *</th>
              <th className="py-2.5 px-3 w-20 text-center">Cant.</th>
              <th className="py-2.5 px-3 w-32 text-right">Precio Unit.</th>
              <th className="py-2.5 px-3 w-24 text-center">Desc. (%)</th>
              <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
              <th className="py-2.5 px-3 w-20 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                  {index + 1}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                    placeholder={getItemPlaceholder()}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-slate-900 text-center bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice || ''}
                    onChange={(e) => onUpdateItem(item.id, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-900 text-right bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discountPercent || ''}
                    onChange={(e) => onUpdateItem(item.id, 'discountPercent', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-slate-900 text-center bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                  />
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                  {formatCurrencyAmount(item.subtotal, currency)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateItem(item.id)}
                      title="Duplicar línea"
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      title="Eliminar línea"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS VIEW (< md) */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Ítem #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDuplicateItem(item.id)}
                  title="Duplicar"
                  className="p-1 text-slate-500 hover:text-purple-600 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  title="Eliminar"
                  className="p-1 text-slate-500 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                placeholder={getItemPlaceholder()}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Precio Unit.
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.unitPrice || ''}
                  onChange={(e) => onUpdateItem(item.id, 'unitPrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 text-xs text-right rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Desc. (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.discountPercent || ''}
                  onChange={(e) => onUpdateItem(item.id, 'discountPercent', e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-xs font-semibold">
              <span className="text-slate-500">Subtotal de la línea:</span>
              <span className="text-purple-700 font-bold">
                {formatCurrencyAmount(item.subtotal, currency)}
              </span>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddItem}
          className="w-full py-2.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar otra línea de concepto
        </button>
      </div>
    </div>
  )
}
