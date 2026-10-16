'use client'

import React, { useState } from 'react'
import { Trash2, Edit2, Check, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Category, PriceListProduct } from './types'
import { ProductRow } from './ProductRow'

interface Props {
  category: Category
  products: PriceListProduct[]
  currency: string
  onUpdateCategoryName: (id: string, name: string) => void
  onRemoveCategory: (id: string) => void
  onAddProduct: (prod: Omit<PriceListProduct, 'id' | 'list_id' | 'sort_order'>) => void
  onUpdateProduct: (id: string, updates: Partial<PriceListProduct>) => void
  onRemoveProduct: (id: string) => void
}

export function CategorySection({
  category,
  products,
  currency,
  onUpdateCategoryName,
  onRemoveCategory,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
}: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(category.name)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [newProdDesc, setNewProdDesc] = useState('')

  const handleSaveTitle = () => {
    if (!title.trim()) return
    onUpdateCategoryName(category.id, title.trim())
    setIsEditingTitle(false)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProdName.trim() || !newProdPrice) {
      alert('Ingresá el nombre y el precio del producto.')
      return
    }

    onAddProduct({
      name: newProdName.trim(),
      price: Number(newProdPrice) || 0,
      description: newProdDesc.trim() || undefined,
      category_id: category.id,
    })

    setNewProdName('')
    setNewProdPrice('')
    setNewProdDesc('')
    setIsAddingItem(false)
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3">
      {/* Cabecera de Categoría */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1 text-sm font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
              title="Guardar nombre"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setTitle(category.name)
                setIsEditingTitle(false)
              }}
              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base text-slate-900">{category.name}</h3>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              title="Renombrar categoría"
            >
              <Edit2 size={13} />
            </button>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {products.length} {products.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRemoveCategory(category.id)}
            className="flex items-center justify-center min-w-[36px] min-h-[36px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar categoría"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Lista de Productos */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
          <p className="text-xs text-slate-500 italic mb-2">
            Categoría vacía — no se incluirá en el PDF hasta que agregues al menos un producto.
          </p>
          {!isAddingItem && (
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Plus size={14} /> Agregar primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((prod) => (
            <ProductRow
              key={prod.id}
              product={prod}
              currency={currency}
              onUpdate={onUpdateProduct}
              onRemove={onRemoveProduct}
            />
          ))}
        </div>
      )}

      {/* Formulario para agregar producto a esta categoría */}
      {isAddingItem ? (
        <form onSubmit={handleAddSubmit} className="mt-3 rounded-xl border border-purple-200 bg-purple-50/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-purple-900">Nuevo ítem en {category.name}</span>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-8">
              <input
                type="text"
                placeholder="Nombre del producto o servicio"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="sm:col-span-4 flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">{currency}</span>
              <input
                type="number"
                placeholder="Precio"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Descripción, detalle o presentación (opcional)"
            value={newProdDesc}
            onChange={(e) => setNewProdDesc(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-purple-600 focus:outline-none"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-xs"
            >
              Agregar a {category.name}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingItem(true)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50/20 transition-all"
        >
          <Plus size={14} /> Agregar ítem en {category.name}
        </button>
      )}
    </div>
  )
}
