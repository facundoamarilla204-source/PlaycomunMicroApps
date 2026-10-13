'use client'

import React from 'react'
import { CommercialDocument } from './types'
import { DocumentTotals, formatCurrencyAmount } from './math'
import {
  Download,
  Share2,
  FileText,
  AlertTriangle,
  Building2,
  User,
  CheckCircle2,
  Printer,
} from 'lucide-react'

interface Props {
  doc: CommercialDocument
  totals: DocumentTotals
  isGenerating: boolean
  onDownloadPdf: () => void
  onShareDoc: () => void
}

export function LiveDocumentPreview({
  doc,
  totals,
  isGenerating,
  onDownloadPdf,
  onShareDoc,
}: Props) {
  const accent = doc.accentColor || '#7C3AED'

  const docTitleMap: Record<string, string> = {
    presupuesto: 'PRESUPUESTO',
    recibo: 'RECIBO DE PAGO',
    'orden-trabajo': 'ORDEN DE TRABAJO',
    'factura-proforma': 'FACTURA PROFORMA',
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE ACCIONES DE VISTA PREVIA */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">
            Vista previa del documento
          </span>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline">
            Formato A4
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onShareDoc}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Compartir o enviar por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DOCUMENT SHEET CANVAS (SIMULACIÓN A4 RESPONSIVE) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-5 sm:p-7 relative overflow-hidden transition-all text-slate-800 text-xs">
        {/* BANDA DECORATIVA SEGÚN PLANTILLA */}
        {doc.designTemplate === 'modern' && (
          <div
            className="absolute top-0 left-0 right-0 h-2.5"
            style={{ backgroundColor: accent }}
          />
        )}

        {/* ALERTA OBLIGATORIA FACTURA PROFORMA */}
        {doc.type === 'factura-proforma' && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-[10px] text-red-800 font-semibold text-center uppercase tracking-wide flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            Documento Comercial Informativo • No válido como Factura Fiscal (Sin valor fiscal ARCA)
          </div>
        )}

        {/* ENCABEZADO: EMISOR Y TÍTULO */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3">
            {doc.emisor.logo ? (
              <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.emisor.logo}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-lg"
                style={{ backgroundColor: accent }}
              >
                {doc.emisor.name ? doc.emisor.name.charAt(0).toUpperCase() : 'P'}
              </div>
            )}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {doc.emisor.name || 'Nombre del Emisor'}
              </h2>
              {doc.emisor.taxId && (
                <p className="text-[11px] text-slate-500">CUIT/ID: {doc.emisor.taxId}</p>
              )}
              {doc.emisor.address && (
                <p className="text-[11px] text-slate-500">
                  {[doc.emisor.address, doc.emisor.city].filter(Boolean).join(', ')}
                </p>
              )}
              {doc.emisor.phone && (
                <p className="text-[11px] text-slate-500">Tel: {doc.emisor.phone}</p>
              )}
              {doc.emisor.email && (
                <p className="text-[11px] text-slate-500">Email: {doc.emisor.email}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span
              className="inline-block text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-md text-white mb-1"
              style={{ backgroundColor: accent }}
            >
              {docTitleMap[doc.type] || 'DOCUMENTO'}
            </span>
            <div className="text-sm font-bold text-slate-900">
              N° {doc.number || '0001'}
            </div>
            <div className="text-[11px] text-slate-500">
              Fecha: {doc.issueDate || '—'}
            </div>
            <div className="text-[11px] font-semibold text-slate-600">
              Moneda: {doc.currency}
            </div>
          </div>
        </div>

        {/* CLIENTE Y CONDICIONES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span
              className="block text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: accent }}
            >
              Cliente / Destinatario
            </span>
            <div className="font-bold text-slate-900 text-xs">
              {doc.cliente.name || 'Cliente no especificado'}
            </div>
            {doc.cliente.taxId && (
              <div className="text-[11px] text-slate-600">ID/CUIT: {doc.cliente.taxId}</div>
            )}
            {doc.cliente.phone && (
              <div className="text-[11px] text-slate-600">Tel: {doc.cliente.phone}</div>
            )}
            {doc.cliente.email && (
              <div className="text-[11px] text-slate-600">Email: {doc.cliente.email}</div>
            )}
            {doc.cliente.address && (
              <div className="text-[11px] text-slate-600">{doc.cliente.address}</div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span
              className="block text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: accent }}
            >
              Condiciones y Plazos
            </span>

            {doc.type === 'presupuesto' && (
              <div className="space-y-0.5 text-[11px] text-slate-700">
                <p>
                  <strong>Validez:</strong> {doc.presupuestoMeta.validityDays || 15} días
                </p>
                {doc.presupuestoMeta.deliveryTime && (
                  <p>
                    <strong>Entrega:</strong> {doc.presupuestoMeta.deliveryTime}
                  </p>
                )}
                {doc.presupuestoMeta.commercialTerms && (
                  <p className="text-[10px] text-slate-500">
                    {doc.presupuestoMeta.commercialTerms}
                  </p>
                )}
              </div>
            )}

            {doc.type === 'recibo' && (
              <div className="space-y-0.5 text-[11px] text-slate-700">
                <p>
                  <strong>Medio:</strong> {doc.reciboMeta.paymentMethod?.toUpperCase()}
                </p>
                <p>
                  <strong>Saldo restante:</strong>{' '}
                  <span className="font-bold text-emerald-700">
                    {formatCurrencyAmount(doc.reciboMeta.pendingBalance || 0, doc.currency)}
                  </span>
                </p>
              </div>
            )}

            {doc.type === 'orden-trabajo' && (
              <div className="space-y-0.5 text-[11px] text-slate-700">
                {doc.ordenTrabajoMeta.targetDeliveryDate && (
                  <p>
                    <strong>Fecha prevista:</strong>{' '}
                    {doc.ordenTrabajoMeta.targetDeliveryDate}
                  </p>
                )}
                {doc.ordenTrabajoMeta.warrantyTerms && (
                  <p>
                    <strong>Garantía:</strong> {doc.ordenTrabajoMeta.warrantyTerms}
                  </p>
                )}
              </div>
            )}

            {doc.type === 'factura-proforma' && (
              <div className="space-y-0.5 text-[11px] text-slate-700">
                {doc.facturaProformaMeta.validityUntil && (
                  <p>
                    <strong>Vence:</strong> {doc.facturaProformaMeta.validityUntil}
                  </p>
                )}
                {doc.facturaProformaMeta.paymentConditions && (
                  <p className="text-[10px] text-slate-500">
                    {doc.facturaProformaMeta.paymentConditions}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RECUADROS ESPECÍFICOS DE RECIBO / ORDEN DE TRABAJO */}
        {doc.type === 'recibo' && (
          <div className="mb-4 p-4 rounded-xl text-white shadow-xs" style={{ backgroundColor: accent }}>
            <span className="block text-[10px] font-bold tracking-wider uppercase opacity-85">
              Importe Recibido en este Acto
            </span>
            <div className="text-xl sm:text-2xl font-black mt-0.5">
              {formatCurrencyAmount(doc.reciboMeta.amountPaid || 0, doc.currency)}
            </div>
            {doc.reciboMeta.paymentConcept && (
              <p className="text-xs opacity-95 mt-1 pt-1 border-t border-white/20">
                En concepto de: {doc.reciboMeta.paymentConcept}
              </p>
            )}
          </div>
        )}

        {doc.type === 'orden-trabajo' && (
          <div className="mb-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
            <div className="font-bold text-blue-900">
              Equipo: {doc.ordenTrabajoMeta.equipmentOrTarget || 'No especificado'}{' '}
              {doc.ordenTrabajoMeta.brandModel && `• ${doc.ordenTrabajoMeta.brandModel}`}{' '}
              {doc.ordenTrabajoMeta.identifierNumber && `(${doc.ordenTrabajoMeta.identifierNumber})`}
            </div>
            {doc.ordenTrabajoMeta.reportedIssue && (
              <p className="text-slate-700">
                <strong>Motivo / Falla:</strong> {doc.ordenTrabajoMeta.reportedIssue}
              </p>
            )}
            {doc.ordenTrabajoMeta.technicalDiagnosis && (
              <p className="text-slate-600 text-[11px]">
                <strong>Diagnóstico preliminar:</strong>{' '}
                {doc.ordenTrabajoMeta.technicalDiagnosis}
              </p>
            )}
          </div>
        )}

        {/* TABLA DE CONCEPTOS / ÍTEMS */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className="text-white font-bold"
                style={{ backgroundColor: doc.designTemplate === 'minimal' ? '#475569' : accent }}
              >
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-2.5">Descripción</th>
                <th className="py-2 px-2.5 w-14 text-center">Cant.</th>
                <th className="py-2 px-2.5 w-24 text-right">Unitario</th>
                {doc.type !== 'orden-trabajo' && (
                  <th className="py-2 px-2.5 w-16 text-center">Desc.</th>
                )}
                <th className="py-2 px-2.5 w-24 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doc.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2.5 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 font-medium text-slate-800">
                    {item.description || 'Concepto sin detalle'}
                  </td>
                  <td className="py-2 px-2.5 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">
                    {formatCurrencyAmount(item.unitPrice, doc.currency, false)}
                  </td>
                  {doc.type !== 'orden-trabajo' && (
                    <td className="py-2 px-2.5 text-center text-slate-500">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                    </td>
                  )}
                  <td className="py-2 px-2.5 text-right font-semibold text-slate-900">
                    {formatCurrencyAmount(item.subtotal, doc.currency, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALES */}
        <div className="flex flex-col items-end my-4 pt-2 border-t border-slate-200 text-xs space-y-1">
          <div className="flex justify-between w-60 text-slate-600">
            <span>Subtotal:</span>
            <span>{formatCurrencyAmount(totals.rawSubtotal, doc.currency)}</span>
          </div>

          {totals.linesDiscountTotal > 0 && (
            <div className="flex justify-between w-60 text-red-600">
              <span>Descuentos líneas:</span>
              <span>-{formatCurrencyAmount(totals.linesDiscountTotal, doc.currency)}</span>
            </div>
          )}

          {doc.globalDiscountPercent > 0 && (
            <div className="flex justify-between w-60 text-red-600">
              <span>Descuento ({doc.globalDiscountPercent}%):</span>
              <span>-{formatCurrencyAmount(totals.globalDiscountAmount, doc.currency)}</span>
            </div>
          )}

          {doc.applyTax && doc.taxRate > 0 && (
            <div className="flex justify-between w-60 text-slate-700">
              <span>IVA ({doc.taxRate}%):</span>
              <span>+{formatCurrencyAmount(totals.taxAmount, doc.currency)}</span>
            </div>
          )}

          <div
            className="flex justify-between w-64 pt-2 pb-1.5 px-3 mt-1.5 rounded-lg text-white font-extrabold text-sm"
            style={{ backgroundColor: accent }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrencyAmount(totals.grandTotal, doc.currency)}</span>
          </div>
        </div>

        {/* NOTAS Y OBSERVACIONES */}
        {doc.footerNotes && (
          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
            <strong className="block text-slate-800 font-semibold mb-0.5">
              Observaciones:
            </strong>
            <p className="whitespace-pre-line leading-relaxed">{doc.footerNotes}</p>
          </div>
        )}

        {/* FIRMA */}
        <div className="mt-8 pt-6 flex justify-end">
          <div className="text-center w-52 border-t border-slate-400 pt-1.5 text-[11px] text-slate-500">
            {doc.type === 'recibo'
              ? (doc.reciboMeta.receiverSignatureTitle || 'Firma y Aclaración')
              : doc.type === 'orden-trabajo'
              ? 'Conformidad del Cliente'
              : 'Firma / Conformidad'}
          </div>
        </div>

        {/* PIE DE PÁGINA INFORMATIVO */}
        <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
          <span>PlayComún Online • playcomun.com</span>
          <span>Documento comercial de gestión interna</span>
        </div>
      </div>
    </div>
  )
}
