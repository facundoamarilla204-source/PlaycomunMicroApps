'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDocumentState } from './useDocumentState'
import { DocumentTypeSelector } from './DocumentTypeSelector'
import { PartyDetailsForm } from './PartyDetailsForm'
import { DocMetaForm } from './DocMetaForm'
import { LineItemsTable } from './LineItemsTable'
import { TotalsAndTaxForm } from './TotalsAndTaxForm'
import { CustomizationForm } from './CustomizationForm'
import { LiveDocumentPreview } from './LiveDocumentPreview'
import { ShareModal } from './ShareModal'
import { generateDocumentPdf } from './pdfGenerator'
import { formatCurrencyAmount } from './math'
import {
  Download,
  Share2,
  RotateCcw,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'

export function GeneradorFacturasTool() {
  const {
    doc,
    totals,
    isLoadedFromStorage,
    isDemoActive,
    setDocumentType,
    setCurrency,
    updateEmisor,
    updateCliente,
    updateDocGeneral,
    updatePresupuestoMeta,
    updateReciboMeta,
    updateOrdenTrabajoMeta,
    updateFacturaProformaMeta,
    addLineItem,
    duplicateLineItem,
    removeLineItem,
    updateLineItem,
    loadSample,
    resetDocument,
  } = useDocumentState()

  const [activeTabMobile, setActiveTabMobile] = useState<'editor' | 'preview'>('editor')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Descarga del PDF
  const handleDownloadPdf = async () => {
    setIsGenerating(true)
    try {
      await generateDocumentPdf(doc, 'download')
      showToast(`¡Documento PDF ${doc.number} descargado con éxito!`)
    } catch (err) {
      console.error('Error generando PDF:', err)
      showToast('Hubo un error al generar el PDF. Por favor intentá nuevamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Compartir nativo o abrir modal
  const handleShare = async () => {
    setIsGenerating(true)
    try {
      const blob = await generateDocumentPdf(doc, 'blob')
      if (blob instanceof Blob && typeof navigator !== 'undefined' && navigator.share) {
        const file = new File([blob], `${doc.type}-${doc.number}.pdf`, {
          type: 'application/pdf',
        })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${doc.type.toUpperCase()} N° ${doc.number}`,
            text: `Documento comercial emitido por ${doc.emisor.name || 'nuestro negocio'}.`,
            files: [file],
          })
          setIsGenerating(false)
          return
        }
      }
    } catch {
      // Fallback a modal de compartir
    } finally {
      setIsGenerating(false)
    }

    setIsShareModalOpen(true)
  }

  return (
    <div className="w-full">
      {/* TOAST FLOTANTE DE NOTIFICACIÓN */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN PARA LIMPIAR / NUEVO DOCUMENTO */}
      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold text-slate-900">
                  ¿Empezar un documento nuevo?
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Se limpiarán los datos cargados en el formulario y el borrador guardado en el navegador.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetDocument()
                    setShowConfirmReset(false)
                    showToast('Formulario restablecido a nuevo.')
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                >
                  Sí, vaciar datos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        doc={doc}
        totals={totals}
        onDownloadPdf={handleDownloadPdf}
        onShareNative={handleShare}
      />

      {/* HEADER DE HERRAMIENTA CON BARRA DE ACCIONES RÁPIDAS */}
      <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {isLoadedFromStorage && !isDemoActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Borrador recuperado
            </span>
          )}
          {isDemoActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <FileText className="w-3 h-3 text-slate-500" />
              Datos de ejemplo cargados
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadSample(doc.type)
              showToast('Ejemplo demostrativo cargado.')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
            title="Cargar datos de ejemplo para este tipo de documento"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            Cargar ejemplo
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Vaciar formulario para empezar desde cero"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nuevo documento
          </button>
        </div>
      </div>

      {/* SELECTOR SEGMENTADO PARA MÓVIL (< lg) */}
      <div className="lg:hidden mb-5">
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTabMobile('editor')}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTabMobile === 'editor'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            1. Formulario
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMobile('preview')}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTabMobile === 'preview'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            2. Vista Previa ({formatCurrencyAmount(totals.grandTotal, doc.currency)})
          </button>
        </div>
      </div>

      {/* DISPOSICIÓN PRINCIPAL: 2 COLUMNAS EN ESCRITORIO / TABS EN MÓVIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: FORMULARIO PASO A PASO (lg:col-span-7) */}
        <div
          className={`space-y-6 lg:col-span-7 ${
            activeTabMobile === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* PASO 1: TIPO DE DOCUMENTO */}
          <DocumentTypeSelector
            selectedType={doc.type}
            onSelectType={(newType) => {
              setDocumentType(newType)
              showToast(`Cambiado a ${newType}`)
            }}
          />

          {/* PASO 2: EMISOR Y CLIENTE */}
          <PartyDetailsForm
            emisor={doc.emisor}
            cliente={doc.cliente}
            onUpdateEmisor={updateEmisor}
            onUpdateCliente={updateCliente}
          />

          {/* PASO 3: METADATOS Y CONDICIONES ESPECÍFICAS */}
          <DocMetaForm
            doc={doc}
            onUpdateGeneral={updateDocGeneral}
            onSetCurrency={setCurrency}
            onUpdatePresupuesto={updatePresupuestoMeta}
            onUpdateRecibo={updateReciboMeta}
            onUpdateOrdenTrabajo={updateOrdenTrabajoMeta}
            onUpdateFacturaProforma={updateFacturaProformaMeta}
          />

          {/* PASO 4: LÍNEAS DE PRODUCTOS / SERVICIOS */}
          <LineItemsTable
            items={doc.items}
            currency={doc.currency}
            docType={doc.type}
            onAddItem={addLineItem}
            onDuplicateItem={duplicateLineItem}
            onRemoveItem={removeLineItem}
            onUpdateItem={updateLineItem}
          />

          {/* PASO 5: TOTALES, DESCUENTOS E IMPUESTOS */}
          <TotalsAndTaxForm
            totals={totals}
            currency={doc.currency}
            globalDiscountPercent={doc.globalDiscountPercent}
            applyTax={doc.applyTax}
            taxRate={doc.taxRate}
            onUpdateGeneral={updateDocGeneral}
          />

          {/* PASO 6: PERSONALIZACIÓN VISUAL Y PIE DE PÁGINA */}
          <CustomizationForm
            designTemplate={doc.designTemplate}
            accentColor={doc.accentColor}
            footerNotes={doc.footerNotes}
            onUpdateGeneral={updateDocGeneral}
          />

          {/* BOTÓN EN MÓVIL PARA PASAR A VISTA PREVIA */}
          <div className="lg:hidden pt-2">
            <button
              type="button"
              onClick={() => setActiveTabMobile('preview')}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Revisar Vista Previa y Descargar ({formatCurrencyAmount(totals.grandTotal, doc.currency)})
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA EN VIVO STICKY (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-24 space-y-4 ${
            activeTabMobile === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          <LiveDocumentPreview
            doc={doc}
            totals={totals}
            isGenerating={isGenerating}
            onDownloadPdf={handleDownloadPdf}
            onShareDoc={handleShare}
          />
        </div>
      </div>

      {/* BARRA FLOTANTE FIJA EN MÓVIL PARA DESCARGA RÁPIDA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <div className="text-left">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">
            Total {doc.currency}
          </span>
          <span className="text-sm font-extrabold text-slate-900">
            {formatCurrencyAmount(totals.grandTotal, doc.currency)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
