'use client'

import React, { useState } from 'react'
import { Copy, Trash2, FileDown, RefreshCw, Pencil, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import { Recipe, calculateRecipeFinancials, formatCurrency } from '@/lib/costo-receta'
import { exportSingleRecipePdf } from '@/lib/recipePdf'

interface RecipeCardProps {
  recipe: Recipe
  onEdit: (recipe: Recipe) => void
  onDuplicate: (recipe: Recipe) => void
  onDeleteRequest: (id: string) => void
}

export function RecipeCard({
  recipe,
  onEdit,
  onDuplicate,
  onDeleteRequest,
}: RecipeCardProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const financials = calculateRecipeFinancials(recipe)

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      await exportSingleRecipePdf(recipe)
    } catch (err) {
      console.error('Error generando PDF de la receta:', err)
      alert('Hubo un error al generar el PDF. Por favor intentá nuevamente.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const updatedDateStr = recipe.updated_at
    ? new Date(recipe.updated_at).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div className="p-5 border-b border-neutral-100 bg-neutral-50/60">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-neutral-900 truncate" title={recipe.name}>
              {recipe.name || 'Receta sin título'}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
              {recipe.category && (
                <span className="inline-flex items-center gap-1 font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3" />
                  {recipe.category}
                </span>
              )}
              {updatedDateStr && <span>Act: {updatedDateStr}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Body: Financial KPIs requested by user */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5 text-sm">
          {/* Rinde */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-neutral-500">Rinde:</span>
            <span className="font-semibold text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded-md text-xs sm:text-sm">
              {recipe.yield_quantity} {recipe.yield_unit}
            </span>
          </div>

          {/* Costo total */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-neutral-500">Costo total:</span>
            <span className="font-medium text-neutral-700">
              {formatCurrency(financials.totalCost)}
            </span>
          </div>

          {/* Costo unitario */}
          <div className="flex justify-between items-center py-0.5 border-t border-dashed border-neutral-200 pt-2 font-medium">
            <span className="text-neutral-600">Costo unitario:</span>
            <span className="text-neutral-900 font-bold">
              {formatCurrency(financials.unitCost)}
            </span>
          </div>

          {/* Precio de venta sugerido */}
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Precio de Venta
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                {recipe.pricing_mode === 'margin'
                  ? `${recipe.target_margin}% margen`
                  : `+${recipe.target_markup}% recargo`}
              </span>
            </div>
            <div className="flex justify-between items-baseline mt-0.5">
              <span className="text-xl font-extrabold text-emerald-600">
                {formatCurrency(financials.suggestedPrice)}
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                Gana {formatCurrency(financials.profitPerUnit)}/u
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="p-3.5 bg-neutral-50/90 border-t border-neutral-100 flex items-center gap-1.5">
        <button
          onClick={() => onEdit(recipe)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm font-semibold text-neutral-700 hover:text-brand hover:border-brand/40 hover:bg-brand/5 shadow-2xs transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          title="Descargar Ficha en PDF"
          aria-label="Descargar PDF"
          className="p-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-brand hover:border-brand/40 hover:bg-brand/5 shadow-2xs transition-colors disabled:opacity-50"
        >
          {downloadingPdf ? (
            <RefreshCw className="h-4 w-4 animate-spin text-brand" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={() => onDuplicate(recipe)}
          title="Duplicar receta"
          aria-label="Duplicar receta"
          className="p-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-2xs transition-colors"
        >
          <Copy className="h-4 w-4" />
        </button>

        <button
          onClick={() => recipe.id && onDeleteRequest(recipe.id)}
          title="Eliminar receta"
          aria-label="Eliminar receta"
          className="p-2 bg-red-50 border border-red-200/80 rounded-xl text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
