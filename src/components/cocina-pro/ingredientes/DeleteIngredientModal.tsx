'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { KitchenIngredient } from '@/lib/gastronomia/types'
import { deleteKitchenIngredientServer } from '@/app/actions/kitchen-ingredients'

export function DeleteIngredientModal({
  isOpen,
  onClose,
  ingredient,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  ingredient: KitchenIngredient | null
  onSuccess: (deletedId: string) => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setIsDeleting(false)
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting, onClose])

  if (!isOpen || !ingredient) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteKitchenIngredientServer(ingredient.id)
      if (res.error || !res.success) {
        setError(res.error || 'Error al eliminar el ingrediente.')
      } else {
        onSuccess(ingredient.id)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Reintentá nuevamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                ¿Eliminar {ingredient.name}?
              </h2>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Esta acción eliminará el insumo de tu biblioteca personal.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1 text-slate-700 hover:text-slate-900 rounded-lg"
              aria-label="Cerrar confirmación"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Preservación de recetas:</strong> Las recetas que referencian este ingrediente conservarán sus cantidades, costos unitarios y cálculos históricos intactos. Únicamente se desvinculará de la biblioteca de compras.
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors min-h-[44px] cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <span>Confirmar eliminación</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
