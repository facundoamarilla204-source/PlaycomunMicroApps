'use client'

import React, { useState } from 'react'
import { 
  Download, 
  Plus, 
  Cloud, 
  Calculator, 
  FileSpreadsheet, 
  FolderOpen, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { usePriceLists } from '../generador-listas-precios/usePriceLists'
import { generatePDF } from '../generador-listas-precios/PDFGenerator'
import { PriceListHeader } from '../generador-listas-precios/PriceListHeader'
import { CategorySection } from '../generador-listas-precios/CategorySection'
import { MassPriceModal } from '../generador-listas-precios/MassPriceModal'
import { PriceListLibraryModal } from '../generador-listas-precios/PriceListLibraryModal'
import { ProUpgradeModal } from '../generador-listas-precios/ProUpgradeModal'

export default function GeneradorListasContent() {
  const {
    activeList,
    initNewList,
    loadList,
    updateListName,
    updateBusinessName,
    updateContactInfo,
    updateCurrency,
    updateRubro,
    updateLogoUrl,
    addCategory,
    updateCategory,
    removeCategory,
    addProduct,
    updateProduct,
    removeProduct,
    updatePricesMassively,
    saveToCloud,
    deleteCloudList,
    duplicateCloudList,
    savedLists,
    loadingSavedLists,
    userStatus,
    savingCloud,
    loading,
  } = usePriceLists()

  const [newCatName, setNewCatName] = useState('')
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isMassPriceOpen, setIsMassPriceOpen] = useState(false)
  const [isProModalOpen, setIsProModalOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    addCategory(newCatName.trim())
    setNewCatName('')
    showToast('Categoría creada correctamente')
  }

  const handleDownloadPDF = async () => {
    if (!activeList || activeList.products.length === 0) {
      alert('Agregá al menos un producto a tu lista para generar el PDF.')
      return
    }
    setDownloadingPdf(true)
    try {
      await generatePDF(activeList, 'download')
      showToast('PDF generado y descargado con éxito')
    } catch (err) {
      console.error('Error al generar PDF:', err)
      alert('Hubo un error al generar el PDF. Verificá los datos ingresados.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleSaveCloudClick = async () => {
    if (!userStatus.isAuthenticated || !userStatus.isPro) {
      setIsProModalOpen(true)
      return
    }

    const res = await saveToCloud()
    if (res.isProRequired) {
      setIsProModalOpen(true)
    } else if (res.success) {
      showToast('¡Lista guardada en la nube con éxito!')
    } else if (res.error) {
      alert(`Error al guardar: ${res.error}`)
    }
  }

  const handleNewListPrompt = () => {
    if (activeList && activeList.products.length > 0) {
      if (!confirm('¿Querés iniciar una nueva lista limpia? Se vaciarán los campos para que empieces desde cero.')) {
        return
      }
    }
    initNewList(activeList?.rubro || 'general', 'Nueva Lista de Precios')
    showToast('Nueva lista iniciada')
  }

  if (loading || !activeList) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <span>Cargando editor de listas de precios...</span>
        </div>
      </div>
    )
  }

  const totalProducts = activeList.products.length
  const totalCategories = activeList.categories.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-28 md:pb-12">
      {/* Notificación Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid principal: Editor central + Panel lateral */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        
        {/* COLUMNA PRINCIPAL DEL EDITOR */}
        <div className="flex-1 space-y-6">
          
          {/* Cabecera de la lista con configuración de marca y moneda */}
          <PriceListHeader
            list={activeList}
            isPro={userStatus.isPro}
            savedCount={savedLists.length}
            onUpdateName={updateListName}
            onUpdateBusinessName={updateBusinessName}
            onUpdateContactInfo={updateContactInfo}
            onUpdateCurrency={updateCurrency}
            onUpdateRubro={updateRubro}
            onUpdateLogoUrl={updateLogoUrl}
            onNewList={handleNewListPrompt}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenUpgradeModal={() => setIsProModalOpen(true)}
          />

          {/* Formulario para Crear Nueva Categoría */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Organización por Categorías
            </h3>
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Nueva categoría (ej: Bebidas, Entradas, Calzado, Servicios Básicos)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <Plus size={16} /> Crear Categoría
              </button>
            </form>
          </div>

          {/* Listado de Categorías con sus respectivos productos */}
          {totalCategories === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">Tu lista aún no tiene categorías</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                Creá una primera categoría arriba para empezar a organizar tus productos y servicios.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeList.categories.map((category) => {
                const catProducts = activeList.products.filter(p => p.category_id === category.id)
                return (
                  <CategorySection
                    key={category.id}
                    category={category}
                    products={catProducts}
                    currency={activeList.currency || 'ARS'}
                    onUpdateCategoryName={updateCategory}
                    onRemoveCategory={removeCategory}
                    onAddProduct={addProduct}
                    onUpdateProduct={updateProduct}
                    onRemoveProduct={removeProduct}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL (Acciones, PDF y Ajuste de Precios) */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-xs lg:sticky lg:top-24 space-y-6">
            
            {/* Acción Principal: Descargar PDF */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 mb-1 block">
                Descarga de Documento
              </span>
              <h3 className="font-bold text-base text-slate-900 mb-1">Descargar Lista en PDF</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Formato hoja A4 optimizado con el diseño de <strong>{activeList.rubro}</strong>. Las categorías vacías se omiten automáticamente.
              </p>
              
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf || totalProducts === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-bold text-sm text-white shadow-xs hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download size={18} />
                {downloadingPdf ? 'Compilando PDF...' : 'Descargar PDF'}
              </button>
            </div>

            {/* Acción Pro: Guardado en la nube */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Persistencia Multi-dispositivo
                </span>
                <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                  PRO
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Guardar en la Nube</h4>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Conservá esta lista en tu cuenta sin riesgo de perderla al borrar caché o cambiar de equipo.
              </p>

              <button
                type="button"
                onClick={handleSaveCloudClick}
                disabled={savingCloud}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 font-bold text-xs text-purple-900 hover:bg-purple-100 transition-colors shadow-2xs"
              >
                <Cloud size={16} className="text-purple-600" />
                {savingCloud ? 'Guardando...' : (userStatus.isPro ? 'Guardar Cambios en la Nube' : 'Guardar en mi Cuenta (PRO)')}
              </button>
            </div>

            {/* Ajuste Masivo de Precios */}
            <div className="pt-5 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                Herramienta Comercial
              </span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Ajuste Masivo de Precios</h4>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Aumentá o rebajá precios por porcentaje con reglas de redondeo inteligente.
              </p>
              
              <button
                type="button"
                onClick={() => setIsMassPriceOpen(true)}
                disabled={totalProducts === 0}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Calculator size={15} /> Configurar Ajuste Masivo
              </button>
            </div>

            {/* Resumen de contenido */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{totalCategories} {totalCategories === 1 ? 'categoría' : 'categorías'}</span>
              <span>•</span>
              <span>{totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}</span>
              <span>•</span>
              <span className="font-bold text-purple-700">{activeList.currency || 'ARS'}</span>
            </div>

          </div>
        </div>

      </div>

      {/* BARRA FLOTANTE FIJA PARA MÓVILES (Garantiza acceso rápido al PDF y acciones) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 px-4 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf || totalProducts === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-bold text-xs text-white shadow-xs disabled:opacity-50"
          >
            <Download size={16} />
            {downloadingPdf ? 'Generando...' : 'Descargar PDF'}
          </button>

          <button
            type="button"
            onClick={() => setIsMassPriceOpen(true)}
            disabled={totalProducts === 0}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-700"
            title="Ajuste masivo"
          >
            <Calculator size={18} />
          </button>

          <button
            type="button"
            onClick={handleSaveCloudClick}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-purple-50 border border-purple-200 text-purple-700"
            title="Guardar en la nube"
          >
            <Cloud size={18} />
          </button>
        </div>
      </div>

      {/* MODAL DE AJUSTE MASIVO DE PRECIOS */}
      <MassPriceModal
        isOpen={isMassPriceOpen}
        onClose={() => setIsMassPriceOpen(false)}
        categories={activeList.categories}
        products={activeList.products}
        currency={activeList.currency || 'ARS'}
        onApply={(params) => {
          updatePricesMassively(params)
          showToast('Precios actualizados masivamente')
        }}
      />

      {/* MODAL DE BIBLIOTECA PRO DE LISTAS */}
      <PriceListLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        lists={savedLists}
        isLoading={loadingSavedLists}
        isPro={userStatus.isPro}
        preservedCount={userStatus.preservedCount}
        onLoadList={(list) => {
          loadList(list)
          showToast(`Lista "${list.name}" cargada en el editor`)
        }}
        onDuplicateList={async (id) => {
          const res = await duplicateCloudList(id)
          if (res) {
            showToast('Lista duplicada en la nube con éxito')
          }
        }}
        onDeleteList={async (id) => {
          const ok = await deleteCloudList(id)
          if (ok) {
            showToast('Lista eliminada de la nube')
          }
        }}
        onOpenNewList={handleNewListPrompt}
        onOpenUpgradeModal={() => {
          setIsLibraryOpen(false)
          setIsProModalOpen(true)
        }}
      />

      {/* MODAL DE BENEFICIOS PRO / UPGRADE */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        preservedCount={userStatus.preservedCount}
      />
    </div>
  )
}
