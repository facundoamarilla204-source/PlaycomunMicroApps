'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { 
  X, 
  Search, 
  FolderOpen, 
  Copy, 
  Download, 
  Trash2, 
  FileSpreadsheet, 
  Calendar, 
  Tag, 
  Crown,
  Plus
} from 'lucide-react'
import { PriceList, RubroType } from './types'
import { generatePDF } from './PDFGenerator'

interface Props {
  isOpen: boolean
  onClose: () => void
  lists: PriceList[]
  isLoading: boolean
  isPro: boolean
  preservedCount: number
  onLoadList: (list: PriceList) => void
  onDuplicateList: (id: string) => Promise<void>
  onDeleteList: (id: string) => Promise<void>
  onOpenNewList: () => void
  onOpenUpgradeModal: () => void
}

const RUBRO_NAMES: Record<RubroType, string> = {
  gastronomia: "Gastronomía",
  indumentaria: "Indumentaria",
  mayorista: "Mayoristas",
  peluqueria: "Estética y Peluquería",
  profesionales: "Profesionales",
  general: "General"
}

export function PriceListLibraryModal({
  isOpen,
  onClose,
  lists,
  isLoading,
  isPro,
  preservedCount,
  onLoadList,
  onDuplicateList,
  onDeleteList,
  onOpenNewList,
  onOpenUpgradeModal,
}: Props) {
  const [search, setSearch] = useState('')
  const [selectedRubro, setSelectedRubro] = useState<string>('todos')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredLists = lists.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.business_name && l.business_name.toLowerCase().includes(search.toLowerCase()))
    const matchesRubro = selectedRubro === 'todos' || l.rubro === selectedRubro
    return matchesSearch && matchesRubro
  })

  const handleDownload = async (list: PriceList) => {
    setDownloadingId(list.id)
    try {
      await generatePDF(list, 'download')
    } catch (e) {
      console.error("Error al descargar PDF:", e)
      alert("No se pudo compilar el PDF de esta lista.")
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setActionId(id)
    try {
      await onDuplicateList(id)
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la lista "${name}" de la nube?`)) return
    setActionId(id)
    try {
      await onDeleteList(id)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Mis Listas Guardadas</h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                  <Crown size={12} /> PRO
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestioná tus diferentes listas, abrirlas para editar, duplicalas o descargá el PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose()
                onOpenNewList()
              }}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <Plus size={14} /> Nueva Lista
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Alerta si no es Pro */}
        {!isPro && (
          <div className="m-5 rounded-xl border border-purple-200 bg-purple-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                <Crown size={16} className="text-purple-700" />
                {preservedCount > 0 ? `Tenés ${preservedCount} listas guardadas en tu cuenta` : 'Sincronizá tus listas en la nube'}
              </h4>
              <p className="text-xs text-purple-800 mt-0.5">
                {preservedCount > 0 
                  ? 'Tus registros están intactos y conservados en Supabase. Reactivá Pro para acceder a ellos.'
                  : 'Guardá múltiples listas sin pisar borradores y sincronizá entre tu PC y tu celular.'}
              </p>
            </div>
            <button
              onClick={onOpenUpgradeModal}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 shrink-0"
            >
              Pasar a Pro
            </button>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre de lista o negocio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedRubro}
              onChange={(e) => setSelectedRubro(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="todos">Todos los Rubros</option>
              {Object.entries(RUBRO_NAMES).map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenido de la biblioteca */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Cargando tus listas guardadas...</div>
          ) : !isPro && preservedCount === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <FileSpreadsheet className="mx-auto w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">Aún no tenés listas en la nube</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Creá tu lista en el editor y pulsá &quot;Guardar en la nube&quot; para conservarla de forma segura.
              </p>
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <FolderOpen className="mx-auto w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">No se encontraron listas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {search ? 'Probá con otro término de búsqueda o rubro.' : 'Guardá tu lista actual para verla reflejada aquí.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredLists.map((list) => {
                const totalItems = list.products?.length || 0
                const totalCategories = list.categories?.length || 0
                const isWorking = actionId === list.id || downloadingId === list.id

                return (
                  <div
                    key={list.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4.5 hover:border-purple-300 hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          <Tag size={11} /> {RUBRO_NAMES[list.rubro] || list.rubro}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> {list.updated_at ? new Date(list.updated_at).toLocaleDateString('es-AR') : 'Reciente'}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 leading-snug line-clamp-1">
                        {list.name}
                      </h4>

                      {list.business_name && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mb-1">
                          {list.business_name}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 mb-4">
                        <span><strong>{totalCategories}</strong> {totalCategories === 1 ? 'categoría' : 'categorías'}</span>
                        <span>•</span>
                        <span><strong>{totalItems}</strong> {totalItems === 1 ? 'producto' : 'productos'}</span>
                        <span>•</span>
                        <span className="font-semibold text-purple-700">{list.currency || 'ARS'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadList(list)
                          onClose()
                        }}
                        disabled={isWorking}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                      >
                        Abrir
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(list)}
                        disabled={isWorking}
                        className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-purple-700 transition-colors"
                        title="Descargar PDF"
                      >
                        <Download size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(list.id)}
                        disabled={isWorking}
                        className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        title="Duplicar lista"
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(list.id, list.name)}
                        disabled={isWorking}
                        className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors"
                        title="Eliminar de la nube"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
