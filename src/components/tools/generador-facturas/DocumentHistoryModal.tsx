'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { CommercialDocument, DocumentStatus, DocumentType } from './types'
import { formatCurrencyAmount } from './math'
import { generateDocumentPdf } from './pdfGenerator'
import {
  History,
  Search,
  Filter,
  Download,
  Edit3,
  Copy,
  Trash2,
  X,
  FileText,
  Receipt,
  Wrench,
  FileSpreadsheet,
  Cloud,
  HardDrive,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  documents: CommercialDocument[]
  isAuthenticated: boolean
  onLoadDocument: (doc: CommercialDocument) => void
  onDuplicateDocument: (doc: CommercialDocument) => void
  onDeleteDocument: (id: string) => Promise<void>
  onUpdateStatus?: (id: string, newStatus: DocumentStatus) => Promise<void>
}

const TYPE_LABELS: Record<DocumentType, { label: string; icon: React.ElementType; color: string }> = {
  presupuesto: { label: 'Presupuesto', icon: FileText, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  recibo: { label: 'Recibo', icon: Receipt, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'orden-trabajo': { label: 'Orden de Trabajo', icon: Wrench, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  'factura-proforma': { label: 'Factura Proforma', icon: FileSpreadsheet, color: 'text-slate-700 bg-slate-100 border-slate-200' },
}

const STATUS_LABELS: Record<DocumentStatus, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  enviado: { label: 'Enviado', color: 'bg-sky-50 text-sky-700 border border-sky-200' },
  aceptado: { label: 'Aceptado', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  cobrado: { label: 'Cobrado', color: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold' },
  vencido: { label: 'Vencido', color: 'bg-amber-50 text-amber-800 border border-amber-200' },
  cancelado: { label: 'Cancelado', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
}

export function DocumentHistoryModal({
  isOpen,
  onClose,
  documents,
  isAuthenticated,
  onLoadDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onUpdateStatus,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cliente?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'todos' || d.type === selectedType
    const matchesStatus = selectedStatus === 'todos' || (d.status || 'borrador') === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleDownload = async (doc: CommercialDocument) => {
    setDownloadingId(doc.id)
    try {
      await generateDocumentPdf(doc, 'download')
    } catch (err) {
      console.error('Error al descargar PDF:', err)
      alert('Hubo un error al generar el PDF del documento guardado.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Historial de Comprobantes</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  {isAuthenticated ? (
                    <>
                      <Cloud className="w-3 h-3 text-sky-500" /> Nube Supabase
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3 h-3 text-slate-500" /> Almacenamiento local
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {documents.length} {documents.length === 1 ? 'documento registrado' : 'documentos registrados'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="py-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° o nombre de cliente..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
            >
              <option value="todos">Todos los tipos</option>
              <option value="presupuesto">Presupuestos</option>
              <option value="recibo">Recibos de pago</option>
              <option value="orden-trabajo">Órdenes de trabajo</option>
              <option value="factura-proforma">Facturas proforma</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aceptado">Aceptado</option>
              <option value="cobrado">Cobrado</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* LISTADO DE DOCUMENTOS */}
        <div className="overflow-y-auto flex-1 py-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No se encontraron documentos</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Los comprobantes que guardes o descargues aparecerán listados aquí para fácil acceso y re-emisión.
              </p>
            </div>
          ) : (
            filtered.map((doc) => {
              const meta = TYPE_LABELS[doc.type] || TYPE_LABELS.presupuesto
              const Icon = meta.icon
              const statusKey = doc.status || 'borrador'
              const statusCfg = STATUS_LABELS[statusKey] || STATUS_LABELS.borrador

              const grandTotal = doc.items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0)

              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{doc.number}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span>
                          Cliente: <strong className="text-slate-700">{doc.cliente?.name || 'Consumidor final'}</strong>
                        </span>
                        <span>Fecha: {doc.issueDate || '—'}</span>
                        <span>{doc.items.length} {doc.items.length === 1 ? 'concepto' : 'conceptos'}</span>
                      </div>
                    </div>
                  </div>

                  {/* IMPORTE Y ACCIONES */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Total</span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {formatCurrencyAmount(grandTotal, doc.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadDocument(doc)
                          onClose()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Abrir y editar documento"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onDuplicateDocument(doc)
                          onClose()
                        }}
                        className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="Duplicar como nuevo comprobante con nueva numeración"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`¿Estás seguro de eliminar el documento ${doc.number}? Esta acción no se puede deshacer.`)) {
                            await onDeleteDocument(doc.id)
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </div>
  )
}
