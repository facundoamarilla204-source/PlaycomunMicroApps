'use client'

import React, { useState } from 'react'
import Link from 'next/link'
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
import { DocumentHistoryModal } from './DocumentHistoryModal'
import { ClientSelectModal } from './ClientSelectModal'
import { ProductSelectModal } from './ProductSelectModal'
import { BusinessProfileModal } from './BusinessProfileModal'
import { ProFeatureModal, ProFeatureKey } from './ProFeatureModal'
import { generateDocumentPdf } from './pdfGenerator'
import { formatCurrencyAmount } from './math'
import { validateCommercialDocument } from './validation'
import { DocumentType } from './types'
import {
  Download,
  Share2,
  RotateCcw,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  Users,
  Package,
  Building2,
  Save,
  Crown,
  FileCheck,
  Sparkles,
} from 'lucide-react'

export interface GeneradorFacturasToolProps {
  initialType?: DocumentType
  lockType?: boolean
}

export function GeneradorFacturasTool({
  initialType = 'presupuesto',
  lockType = false,
}: GeneradorFacturasToolProps) {
  const {
    doc,
    setDoc,
    profile,
    clients,
    products,
    historyDocs,
    totals,
    isAuthenticated,
    isPro,
    isLoadedFromStorage,
    isDemoActive,
    isTypeLocked,
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
    applyClient,
    applyProduct,
    saveDocument,
    duplicateDocument,
    deleteDocument,
    saveClient,
    deleteClient,
    saveProduct,
    deleteProduct,
    saveBusinessProfile,
    loadSample,
    resetDocument,
  } = useDocumentState({ initialType, lockType })

  // Estados de interfaz y modales
  const [activeTabMobile, setActiveTabMobile] = useState<'editor' | 'preview'>('editor')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingDoc, setIsSavingDoc] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [proModalFeature, setProModalFeature] = useState<ProFeatureKey | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3800)
  }

  // Interceptar acciones Pro
  const handleOpenHistory = () => {
    if (!isPro) {
      setProModalFeature('history')
    } else {
      setIsHistoryModalOpen(true)
    }
  }

  const handleOpenClients = () => {
    if (!isPro) {
      setProModalFeature('clients')
    } else {
      setIsClientModalOpen(true)
    }
  }

  const handleOpenProducts = () => {
    if (!isPro) {
      setProModalFeature('products')
    } else {
      setIsProductModalOpen(true)
    }
  }

  const handleOpenProfile = () => {
    if (!isPro) {
      setProModalFeature('business_profile')
    } else {
      setIsProfileModalOpen(true)
    }
  }

  // Guardado explícito del documento en la nube
  const handleSaveDocument = async () => {
    if (!isPro) {
      setProModalFeature('cloud_save')
      return
    }

    const validation = validateCommercialDocument(doc)
    if (!validation.isValid) {
      showToast(`⚠️ ${validation.errors[0]}`)
      return
    }

    setIsSavingDoc(true)
    try {
      const res = await saveDocument(doc.status || 'borrador')
      if (res.success) {
        showToast(`Documento ${doc.type.toUpperCase()} N° ${doc.number || ''} guardado en tu cuenta Pro.`)
      } else {
        showToast(res.error || 'No se pudo guardar el documento.')
      }
    } catch {
      showToast('Ocurrió un error inesperado al guardar.')
    } finally {
      setIsSavingDoc(false)
    }
  }

  // Descarga del PDF con validación previa
  const handleDownloadPdf = async () => {
    const validation = validateCommercialDocument(doc)
    if (!validation.isValid) {
      showToast(`⚠️ ${validation.errors[0]}`)
      return
    }

    setIsGenerating(true)
    try {
      await generateDocumentPdf(doc, 'download', { isPro })
      if (isPro) {
        // Auto-actualizar estado a enviado en la cuenta Pro
        void saveDocument(doc.status === 'borrador' ? 'enviado' : doc.status)
      }
      showToast(`¡Documento PDF ${doc.number || ''} descargado con éxito!`)
    } catch (err) {
      console.error('Error generando PDF:', err)
      showToast('Hubo un error al generar el PDF. Por favor intentá nuevamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Compartir nativo o abrir modal
  const handleShare = async () => {
    const validation = validateCommercialDocument(doc)
    if (!validation.isValid) {
      showToast(`⚠️ ${validation.errors[0]}`)
      return
    }

    setIsGenerating(true)
    try {
      const blob = await generateDocumentPdf(doc, 'blob', { isPro })
      if (blob instanceof Blob && typeof navigator !== 'undefined' && navigator.share) {
        const file = new File([blob], `${doc.type}-${doc.number || 'doc'}.pdf`, {
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

  // Guardado rápido de cliente desde el formulario
  const handleQuickSaveClient = async () => {
    if (!isPro) {
      setProModalFeature('clients')
      return
    }
    if (!doc.cliente.name.trim()) {
      showToast('Ingresá al menos el nombre o razón social del cliente.')
      return
    }
    const res = await saveClient({
      name: doc.cliente.name,
      taxId: doc.cliente.taxId || undefined,
      phone: doc.cliente.phone || undefined,
      email: doc.cliente.email || undefined,
      address: doc.cliente.address || undefined,
      city: doc.cliente.city || undefined,
      notes: undefined,
    })
    if (res.success) {
      showToast(`Cliente «${doc.cliente.name}» agregado a tu agenda Pro.`)
    } else {
      showToast(res.error || 'No se pudo guardar el cliente.')
    }
  }

  // Guardado rápido de producto desde una línea del documento
  const handleQuickSaveProduct = async (item: {
    description: string
    unitPrice: number
    discountPercent: number
  }) => {
    if (!isPro) {
      setProModalFeature('products')
      return
    }
    if (!item.description.trim()) {
      showToast('La línea debe tener una descripción para guardarse en el catálogo.')
      return
    }
    const res = await saveProduct({
      name: item.description,
      description: undefined,
      defaultUnitPrice: item.unitPrice,
      defaultDiscountPercent: item.discountPercent,
      category: undefined,
      isActive: true,
    })
    if (res.success) {
      showToast(`«${item.description}» guardado en tu catálogo de productos Pro.`)
    } else {
      showToast(res.error || 'No se pudo guardar el producto.')
    }
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
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium max-w-md border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL EXPLICATIVO DE FUNCIONES PRO */}
      <ProFeatureModal
        isOpen={Boolean(proModalFeature)}
        onClose={() => setProModalFeature(null)}
        featureKey={proModalFeature || 'cloud_save'}
        isAuthenticated={isAuthenticated}
      />

      {/* MODALES DEL SISTEMA PRO */}
      {isPro && (
        <>
          <DocumentHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            documents={historyDocs}
            isAuthenticated={isAuthenticated}
            onLoadDocument={(docToLoad) => {
              setDoc(docToLoad)
              showToast(`Cargado ${docToLoad.type.toUpperCase()} N° ${docToLoad.number}`)
            }}
            onDuplicateDocument={async (docToDup) => {
              const res = await duplicateDocument(docToDup)
              if (res.success) {
                showToast('Documento duplicado con una nueva numeración correlativa en la nube.')
              }
            }}
            onDeleteDocument={async (id) => {
              const res = await deleteDocument(id)
              if (res.success) {
                showToast('Documento eliminado de tu historial Pro.')
              }
            }}
          />

          <ClientSelectModal
            isOpen={isClientModalOpen}
            onClose={() => setIsClientModalOpen(false)}
            clients={clients}
            onSelectClient={(selected) => {
              applyClient(selected)
              showToast(`Cliente «${selected.name}» aplicado al formulario.`)
            }}
            onSaveClient={async (cli) => {
              const res = await saveClient(cli)
              if (res.success) {
                showToast('Cliente guardado en tu agenda Pro.')
              } else {
                showToast(res.error || 'Error al guardar cliente.')
              }
            }}
            onDeleteClient={async (id) => {
              const res = await deleteClient(id)
              if (res.success) {
                showToast('Cliente eliminado de la agenda Pro.')
              }
            }}
          />

          <ProductSelectModal
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            products={products}
            currency={doc.currency}
            onSelectProduct={(prod) => {
              applyProduct(prod)
              showToast(`«${prod.name}» insertado en el detalle.`)
            }}
            onSaveProduct={async (prod) => {
              const res = await saveProduct(prod)
              if (res.success) {
                showToast('Producto/servicio guardado en tu catálogo Pro.')
              } else {
                showToast(res.error || 'Error al guardar producto.')
              }
            }}
            onDeleteProduct={async (id) => {
              const res = await deleteProduct(id)
              if (res.success) {
                showToast('Producto retirado del catálogo Pro.')
              }
            }}
          />

          <BusinessProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={profile || {
              name: '',
              taxId: '',
              phone: '',
              email: '',
              address: '',
              city: '',
              logo: '',
              defaultCurrency: 'ARS',
              defaultTemplate: 'modern',
              defaultAccentColor: '#7C3AED',
              defaultNotes: '',
            }}
            onSaveProfile={async (prof) => {
              const res = await saveBusinessProfile(prof)
              if (res.success) {
                showToast('Perfil comercial guardado de forma permanente en tu cuenta Pro.')
              } else {
                showToast(res.error || 'Error al guardar perfil.')
                throw new Error(res.error || 'Error al guardar perfil.')
              }
            }}
          />
        </>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA NUEVO DOCUMENTO */}
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
                  Se limpiará el formulario activo de la sesión actual.
                  {isPro
                    ? ' Tu perfil comercial y catálogos en la nube se mantendrán intactos.'
                    : ' Los datos no guardados de esta pestaña se descartarán.'}
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
                    void resetDocument()
                    setShowConfirmReset(false)
                    showToast('Nuevo documento iniciado.')
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer"
                >
                  Sí, nuevo documento
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

      {/* BARRA SUPERIOR DE HERRAMIENTA */}
      <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* IDENTIFICACIÓN DEL DOCUMENTO */}
          <div className="flex flex-wrap items-center gap-2">
            {isTypeLocked ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200/80">
                <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                Presupuesto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                Documento comercial
              </span>
            )}

            {isPro && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                title="Cuenta Pro activa"
              >
                <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                Pro
              </span>
            )}

            {isLoadedFromStorage && !isDemoActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Borrador recuperado
              </span>
            )}

            {isDemoActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <FileText className="w-3 h-3 text-amber-600" />
                Ejemplo
              </span>
            )}
          </div>

          {/* ACCIONES Y CATÁLOGOS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              title={isPro ? 'Ver comprobantes guardados' : 'Historial de comprobantes (Función Pro)'}
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Historial</span>
              {isPro && historyDocs.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {historyDocs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenClients}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              title={isPro ? 'Gestionar clientes guardados' : 'Agenda de clientes (Función Pro)'}
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Clientes</span>
              {isPro && clients.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {clients.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenProducts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              title={isPro ? 'Gestionar productos y servicios' : 'Catálogo de productos (Función Pro)'}
            >
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Productos</span>
              {isPro && products.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {products.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              title={isPro ? 'Configurar datos de emisor y logo' : 'Datos del emisor y logo (Función Pro)'}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Mi Negocio</span>
            </button>

            {isPro ? (
              <button
                type="button"
                onClick={handleSaveDocument}
                disabled={isSavingDoc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                title="Guardar en tu cuenta"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDoc ? 'Guardando...' : 'Guardar'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setProModalFeature('cloud_save')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                title="Guardar en tu cuenta (Función Pro)"
              >
                <Save className="w-3.5 h-3.5 text-purple-600" />
                <span>Guardar</span>
                <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-200/60 px-1 py-0.2 rounded">Pro</span>
              </button>
            )}
          </div>
        </div>

        {/* ACCIONES DE BORRADOR DE SESIÓN */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="text-[11px] text-slate-500">
            {!isPro ? (
              <span className="flex items-center gap-2">
                <span>Borrador: {doc.number || 'Sin guardar'}</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setProModalFeature('white_label')}
                  className="text-purple-700 hover:text-purple-900 font-medium hover:underline cursor-pointer"
                >
                  Descargar PDF sin marca de agua
                </button>
              </span>
            ) : (
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Comprobante #{doc.number}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadSample(doc.type)
                showToast('Ejemplo demostrativo cargado.')
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              Cargar ejemplo
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Nuevo documento
            </button>
          </div>
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

      {/* DISPOSICIÓN PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: FORMULARIO PASO A PASO */}
        <div
          className={`space-y-6 lg:col-span-7 ${
            activeTabMobile === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* PASO 1: TIPO DE DOCUMENTO */}
          {!isTypeLocked && (
            <DocumentTypeSelector
              selectedType={doc.type}
              onSelectType={(newType) => {
                void setDocumentType(newType)
                showToast(`Cambiado a ${newType}`)
              }}
            />
          )}

          {/* PASO 2: EMISOR Y CLIENTE */}
          <PartyDetailsForm
            emisor={doc.emisor}
            cliente={doc.cliente}
            onUpdateEmisor={updateEmisor}
            onUpdateCliente={updateCliente}
            onOpenProfileModal={handleOpenProfile}
            onOpenClientModal={handleOpenClients}
            onSaveClientQuick={handleQuickSaveClient}
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
            onOpenProductModal={handleOpenProducts}
            onSaveProductQuick={handleQuickSaveProduct}
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

        {/* COLUMNA DERECHA: VISTA PREVIA EN VIVO STICKY */}
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

          {/* AVISO INFORMATIVO DE MARCA SEGÚN MODALIDAD */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            {isPro ? (
              <p className="text-[11px] text-purple-900 font-semibold flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Tu PDF se descarga en marca blanca profesional sin marcas de PlayComún.
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                📄 La versión gratuita incluye la mención de PlayComún en el pie del PDF.{' '}
                <button
                  type="button"
                  onClick={() => setProModalFeature('white_label')}
                  className="text-purple-600 hover:underline font-semibold"
                >
                  Pasate a Pro para marca blanca
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BARRA FLOTANTE FIJA EN MÓVIL */}
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
