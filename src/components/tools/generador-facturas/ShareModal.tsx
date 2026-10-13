'use client'

import React, { useState } from 'react'
import { CommercialDocument } from './types'
import { DocumentTotals, formatCurrencyAmount } from './math'
import { X, Share2, Download, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  doc: CommercialDocument
  totals: DocumentTotals
  onDownloadPdf: () => void
  onShareNative: () => void
}

export function ShareModal({
  isOpen,
  onClose,
  doc,
  totals,
  onDownloadPdf,
  onShareNative,
}: Props) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const docTypeName = {
    presupuesto: 'Presupuesto',
    recibo: 'Recibo de Pago',
    'orden-trabajo': 'Orden de Trabajo',
    'factura-proforma': 'Factura Proforma',
  }[doc.type]

  const totalFormatted = formatCurrencyAmount(totals.grandTotal, doc.currency)
  const clientName = doc.cliente.name || 'Cliente'
  const emisorName = doc.emisor.name || 'Nuestro equipo'

  // Mensaje predeterminado para WhatsApp
  const shareMessage = `¡Hola ${clientName}! Te comparto el ${docTypeName} N° ${doc.number} emitido por ${emisorName}. Total: ${totalFormatted}. Podés revisar el PDF adjunto.`

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // noop
    }
  }

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(shareMessage)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Compartir {docTypeName}
            </h3>
            <p className="text-xs text-slate-500">
              N° {doc.number} • Total {totalFormatted}
            </p>
          </div>
        </div>

        {/* ACCIÓN RECOMENDADA: DESCARGAR Y ENVIAR */}
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200/80 space-y-2">
          <span className="text-xs font-bold text-purple-900 block">
            Paso 1: Descargá el PDF auténtico
          </span>
          <p className="text-xs text-purple-800 leading-relaxed">
            El archivo se guarda en tu dispositivo con texto seleccionable y diseño profesional listo para adjuntar en WhatsApp, correo o imprimir.
          </p>
          <button
            type="button"
            onClick={() => {
              onDownloadPdf()
            }}
            className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar archivo PDF ahora
          </button>
        </div>

        {/* COMPARTIR NATIVO O WHATSAPP */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-800 block">
            Paso 2: Compartir con el cliente
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onShareNative}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-purple-600" />
              Menú nativo del celular
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Abrir WhatsApp
            </button>
          </div>

          {/* TEXTO SUGERIDO PARA PEGAR */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">
                Texto de mensaje sugerido:
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar texto
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-700 italic select-all bg-white p-2 rounded border border-slate-200">
              &quot;{shareMessage}&quot;
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
