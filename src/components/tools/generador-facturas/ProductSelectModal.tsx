'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { CommercialProduct, CurrencyCode } from './types'
import { formatCurrencyAmount } from './math'
import { Package, Search, Plus, Trash2, X, Tag } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  products: CommercialProduct[]
  currency: CurrencyCode
  onSelectProduct: (product: CommercialProduct) => void
  onSaveProduct: (product: Omit<CommercialProduct, 'id'> & { id?: string }) => Promise<void>
  onDeleteProduct: (id: string) => Promise<void>
}

export function ProductSelectModal({
  isOpen,
  onClose,
  products,
  currency,
  onSelectProduct,
  onSaveProduct,
  onDeleteProduct,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultUnitPrice, setDefaultUnitPrice] = useState<number | ''>('')
  const [defaultDiscount, setDefaultDiscount] = useState<number | ''>('')
  const [category, setCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const filtered = products.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)
    try {
      await onSaveProduct({
        name: name.trim(),
        description: description.trim(),
        defaultUnitPrice: Number(defaultUnitPrice) || 0,
        defaultDiscount: Number(defaultDiscount) || 0,
        category: category.trim(),
        isActive: true,
      })
      setName('')
      setDescription('')
      setDefaultUnitPrice('')
      setDefaultDiscount('')
      setCategory('')
      setIsCreating(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Catálogo de Productos y Servicios</h3>
              <p className="text-xs text-slate-500">Insertá ítems frecuentes en tu comprobante</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">
          {!isCreating ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar producto, repuesto o servicio..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Ítem
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No hay productos ni servicios guardados</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Podés crear conceptos reutilizables con precios preestablecidos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((product) => (
                    <div
                      key={product.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                          {product.category && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              <Tag className="w-2.5 h-2.5" />
                              {product.category}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{product.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="font-extrabold text-emerald-700">
                            {formatCurrencyAmount(product.defaultUnitPrice, currency)}
                          </span>
                          {product.defaultDiscount ? (
                            <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded">
                              Desc: {product.defaultDiscount}%
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(product)
                            onClose()
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Insertar línea
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`¿Eliminar "${product.name}" del catálogo?`)) {
                              onDeleteProduct(product.id)
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Registrar Producto o Servicio</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Volver al listado
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nombre o Tarea *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Mano de obra cambio de pantalla / Mantenimiento preventivo"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Descripción detallada (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle técnico, insumos incluidos, alcance de la garantía..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={defaultUnitPrice}
                    onChange={(e) => setDefaultUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={defaultDiscount}
                    onChange={(e) => setDefaultDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Mano de obra / Repuestos"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
