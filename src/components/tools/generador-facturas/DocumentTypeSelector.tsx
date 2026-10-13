'use client'

import React from 'react'
import { DocumentType } from './types'
import { FileText, Receipt, Wrench, FileSpreadsheet, Check } from 'lucide-react'

interface DocumentTypeOption {
  type: DocumentType
  title: string
  subtitle: string
  description: string
  badge: string
  icon: React.ElementType
  iconStyle: string
}

const DOCUMENT_OPTIONS: DocumentTypeOption[] = [
  {
    type: 'presupuesto',
    title: 'Presupuesto Comercial',
    subtitle: 'Cotización y propuesta',
    description: 'Detalle de trabajos o productos, vigencia de precios, plazos y condiciones comerciales.',
    badge: 'Propuesta previa',
    icon: FileText,
    iconStyle: 'bg-purple-100 text-purple-700',
  },
  {
    type: 'recibo',
    title: 'Recibo de Pago',
    subtitle: 'Cobro y entrega de seña',
    description: 'Importe cobrado en el acto, concepto, medio de pago, total de la operación y saldo pendiente.',
    badge: 'Constancia de cobro',
    icon: Receipt,
    iconStyle: 'bg-emerald-100 text-emerald-800',
  },
  {
    type: 'orden-trabajo',
    title: 'Orden de Trabajo',
    subtitle: 'Servicio técnico y taller',
    description: 'Recepción de equipo u objeto, diagnóstico técnico, falla manifestada, repuestos y mano de obra.',
    badge: 'Recepción y servicio',
    icon: Wrench,
    iconStyle: 'bg-blue-100 text-blue-800',
  },
  {
    type: 'factura-proforma',
    title: 'Factura Proforma',
    subtitle: 'Comprobante informativo',
    description: 'Documento previo a facturación con detalle de la operación propuesta y condiciones de pago.',
    badge: 'Comercial no fiscal',
    icon: FileSpreadsheet,
    iconStyle: 'bg-slate-200 text-slate-800',
  },
]

interface Props {
  selectedType: DocumentType
  onSelectType: (type: DocumentType) => void
}

export function DocumentTypeSelector({ selectedType, onSelectType }: Props) {
  return (
    <div className="w-full">
      <div className="mb-3.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-0.5">
          1. Tipo de documento
        </label>
        <p className="text-xs text-slate-500">
          Elegí el formato adecuado para adaptar los campos, conceptos y el diseño del PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DOCUMENT_OPTIONS.map((opt) => {
          const isSelected = selectedType === opt.type
          const Icon = opt.icon

          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => onSelectType(opt.type)}
              className={`relative flex flex-col text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/40 shadow-xs ring-1 ring-purple-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${opt.iconStyle}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {isSelected ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3 stroke-[2.5]" /> Seleccionado
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {opt.badge}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-0.5">
                {opt.title}
              </h3>
              <p className="text-xs text-slate-600 mb-2">
                {opt.subtitle}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mt-auto">
                {opt.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
