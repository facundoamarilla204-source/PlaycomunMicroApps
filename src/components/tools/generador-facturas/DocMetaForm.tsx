'use client'

import React from 'react'
import {
  CommercialDocument,
  CurrencyCode,
  DocumentType,
} from './types'
import { CURRENCIES, formatCurrencyAmount } from './math'
import { Calendar, Hash, Coins, ShieldAlert, Clock, CreditCard, Wrench } from 'lucide-react'

interface Props {
  doc: CommercialDocument
  onUpdateGeneral: (field: keyof CommercialDocument, value: unknown) => void
  onSetCurrency: (currency: CurrencyCode) => void
  onUpdatePresupuesto: (field: string, value: unknown) => void
  onUpdateRecibo: (field: string, value: unknown) => void
  onUpdateOrdenTrabajo: (field: string, value: unknown) => void
  onUpdateFacturaProforma: (field: string, value: unknown) => void
}

export function DocMetaForm({
  doc,
  onUpdateGeneral,
  onSetCurrency,
  onUpdatePresupuesto,
  onUpdateRecibo,
  onUpdateOrdenTrabajo,
  onUpdateFacturaProforma,
}: Props) {
  const currentCurrency = doc.currency

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            3. Fechas, numeración y condiciones
          </h3>
          <p className="text-[11px] text-slate-500">
            Identificación interna, moneda y plazos comerciales
          </p>
        </div>
      </div>

      {/* BLOQUE GENERAL: NÚMERO, FECHA Y MONEDA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-purple-600" />
              Número interno
            </span>
          </label>
          <input
            type="text"
            value={doc.number}
            onChange={(e) => onUpdateGeneral('number', e.target.value)}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            placeholder="PRE-0001"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">Identificador editable</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              Fecha de emisión
            </span>
          </label>
          <input
            type="date"
            value={doc.issueDate}
            onChange={(e) => onUpdateGeneral('issueDate', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-purple-600" />
              Moneda
            </span>
          </label>
          <select
            value={currentCurrency}
            onChange={(e) => onSetCurrency(e.target.value as CurrencyCode)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all cursor-pointer font-medium"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BLOQUE ESPECÍFICO SEGÚN TIPO DE DOCUMENTO */}

      {/* 1. PRESUPUESTO */}
      {doc.type === 'presupuesto' && (
        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
            <Clock className="w-4 h-4 text-purple-600" />
            Condiciones comerciales del presupuesto
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Validez de la oferta (días)
              </label>
              <input
                type="number"
                min="1"
                value={doc.presupuestoMeta.validityDays || 15}
                onChange={(e) => onUpdatePresupuesto('validityDays', Number(e.target.value) || 15)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ej: 15 días corridos</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plazo estimado de entrega / ejecución
              </label>
              <input
                type="text"
                value={doc.presupuestoMeta.deliveryTime || ''}
                onChange={(e) => onUpdatePresupuesto('deliveryTime', e.target.value)}
                placeholder="Ej. 7 a 10 días hábiles"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Forma y condiciones de pago
            </label>
            <input
              type="text"
              value={doc.presupuestoMeta.commercialTerms || ''}
              onChange={(e) => onUpdatePresupuesto('commercialTerms', e.target.value)}
              placeholder="Ej. 50% de anticipo al aceptar y 50% contra entrega final"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>
        </div>
      )}

      {/* 2. RECIBO DE PAGO */}
      {doc.type === 'recibo' && (
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Detalle de la cobranza y medios de pago
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Concepto del cobro *
            </label>
            <input
              type="text"
              value={doc.reciboMeta.paymentConcept}
              onChange={(e) => onUpdateRecibo('paymentConcept', e.target.value)}
              placeholder="Ej. Anticipo del 50% por servicio de diseño / Cancelación cuota 2"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medio de pago
              </label>
              <select
                value={doc.reciboMeta.paymentMethod}
                onChange={(e) => onUpdateRecibo('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia bancaria</option>
                <option value="mercadopago">Mercado Pago / Billetera virtual</option>
                <option value="debito">Tarjeta de débito</option>
                <option value="credito">Tarjeta de crédito</option>
                <option value="otro">Otro medio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Importe recibido en este acto *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={doc.reciboMeta.amountPaid || ''}
                onChange={(e) => onUpdateRecibo('amountPaid', Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-emerald-300 bg-white text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Importe total de la operación
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={doc.reciboMeta.totalOperationAmount || ''}
                onChange={(e) => onUpdateRecibo('totalOperationAmount', Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Total acordado</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-200 text-xs">
            <span className="text-slate-600">
              Saldo pendiente restante:{' '}
              <strong className="text-emerald-700 text-sm">
                {formatCurrencyAmount(doc.reciboMeta.pendingBalance || 0, doc.currency)}
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-[11px]">Leyenda de firma:</label>
              <input
                type="text"
                value={doc.reciboMeta.receiverSignatureTitle || 'Firma y Aclaración'}
                onChange={(e) => onUpdateRecibo('receiverSignatureTitle', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDEN DE TRABAJO */}
      {doc.type === 'orden-trabajo' && (
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Wrench className="w-4 h-4 text-blue-600" />
            Datos técnicos del equipo u objeto a intervenir
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Equipo / Objeto / Vehículo *
              </label>
              <input
                type="text"
                value={doc.ordenTrabajoMeta.equipmentOrTarget}
                onChange={(e) => onUpdateOrdenTrabajo('equipmentOrTarget', e.target.value)}
                placeholder="Ej. Notebook Lenovo / Gol Trend 2018"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marca y Modelo
              </label>
              <input
                type="text"
                value={doc.ordenTrabajoMeta.brandModel || ''}
                onChange={(e) => onUpdateOrdenTrabajo('brandModel', e.target.value)}
                placeholder="Ej. ThinkPad E14 Gen 2"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° de serie / Patente / IMEI
              </label>
              <input
                type="text"
                value={doc.ordenTrabajoMeta.identifierNumber || ''}
                onChange={(e) => onUpdateOrdenTrabajo('identifierNumber', e.target.value)}
                placeholder="Ej. S/N: PF-28K901"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problema manifestado por el cliente *
              </label>
              <textarea
                rows={2}
                value={doc.ordenTrabajoMeta.reportedIssue}
                onChange={(e) => onUpdateOrdenTrabajo('reportedIssue', e.target.value)}
                placeholder="Detalle de la falla o motivo de ingreso manifestado..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnóstico preliminar / Tareas técnicas
              </label>
              <textarea
                rows={2}
                value={doc.ordenTrabajoMeta.technicalDiagnosis || ''}
                onChange={(e) => onUpdateOrdenTrabajo('technicalDiagnosis', e.target.value)}
                placeholder="Diagnóstico del taller o plan de trabajo..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha prevista de retiro / entrega
              </label>
              <input
                type="date"
                value={doc.ordenTrabajoMeta.targetDeliveryDate || ''}
                onChange={(e) => onUpdateOrdenTrabajo('targetDeliveryDate', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condiciones de garantía técnica
              </label>
              <input
                type="text"
                value={doc.ordenTrabajoMeta.warrantyTerms || ''}
                onChange={(e) => onUpdateOrdenTrabajo('warrantyTerms', e.target.value)}
                placeholder="Ej. 90 días sobre mano de obra"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. FACTURA PROFORMA */}
      {doc.type === 'factura-proforma' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Aviso legal obligatorio:</strong> La factura proforma es una cotización previa de carácter informativo y comercial. No es una factura fiscal habilitada por ARCA (ex-AFIP), no genera crédito fiscal ni reemplaza a un comprobante oficial de venta.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de validez de la proforma
              </label>
              <input
                type="date"
                value={doc.facturaProformaMeta.validityUntil || ''}
                onChange={(e) => onUpdateFacturaProforma('validityUntil', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condiciones de pago acordadas
              </label>
              <input
                type="text"
                value={doc.facturaProformaMeta.paymentConditions || ''}
                onChange={(e) => onUpdateFacturaProforma('paymentConditions', e.target.value)}
                placeholder="Ej. Transferencia previa al despacho de mercadería"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
