'use client'

import React, { useState } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import { PriceListProduct } from './types'

interface Props {
  product: PriceListProduct
  currency: string
  onUpdate: (id: string, updates: Partial<PriceListProduct>) => void
  onRemove: (id: string) => void
}

export function ProductRow({ product, currency, onUpdate, onRemove }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price.toString())
  const [description, setDescription] = useState(product.description || '')

  const handleSave = () => {
    if (!name.trim()) return
    onUpdate(product.id, {
      name: name.trim(),
      price: Number(price) || 0,
      description: description.trim() || undefined,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(product.name)
    setPrice(product.price.toString())
    setDescription(product.description || '')
    setIsEditing(false)
  }

  const badges = [
    product.code ? `Cód: ${product.code}` : null,
    product.variant ? `Talle/Var: ${product.variant}` : null,
    product.unit ? `Unidad: ${product.unit}` : null,
    product.duration ? `Duración: ${product.duration}` : null,
  ].filter(Boolean).join(' • ')

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-purple-200 bg-purple-50/40">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del producto o servicio"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1.5 sm:w-36">
            <span className="text-xs font-bold text-slate-500">{currency}</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Precio"
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción o detalle breve (opcional)"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-purple-600 focus:outline-none"
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <X size={14} /> Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700"
          >
            <Check size={14} /> Guardar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/70 transition-colors">
      <div className="flex-1 min-w-0 pr-2">
        <div className="font-semibold text-sm text-slate-800 break-words leading-tight">
          {product.name}
        </div>
        {product.description && (
          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {product.description}
          </div>
        )}
        {badges && (
          <div className="text-[11px] text-slate-400 mt-0.5 italic">
            {badges}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <span className="font-bold text-sm text-purple-700 text-right min-w-[70px]">
          {currency} ${Math.round(product.price).toLocaleString('es-AR')}
        </span>

        {/* Botón editar con área táctil cómoda */}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-center min-w-[40px] min-h-[40px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Editar producto"
        >
          <Edit2 size={15} />
        </button>

        {/* Botón eliminar con área táctil accesible de 44x44px */}
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Eliminar producto"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
