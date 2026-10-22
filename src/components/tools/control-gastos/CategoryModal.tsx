'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Plus, Pencil, Trash2, Check, Tag } from 'lucide-react'
import { CustomCategory, MovementType } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  customCategories: CustomCategory[]
  onAddCategory: (name: string, type: MovementType) => { success: boolean; error?: string }
  onRenameCategory: (id: string, newName: string) => { success: boolean; error?: string }
  onDeleteCategory: (id: string, reassignTo: string) => { success: boolean; error?: string }
}

export function CategoryModal({
  isOpen,
  onClose,
  customCategories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: Props) {
  const [activeTab, setActiveTab] = useState<MovementType>('expense')
  const [newCatName, setNewCatName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredCategories = customCategories.filter((c) => c.type === activeTab)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = onAddCategory(newCatName, activeTab)
    if (res.success) {
      setNewCatName('')
    } else {
      setError(res.error || 'Error al agregar categoría')
    }
  }

  const startEdit = (cat: CustomCategory) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setError(null)
  }

  const saveEdit = (id: string) => {
    setError(null)
    const res = onRenameCategory(id, editName)
    if (res.success) {
      setEditingId(null)
      setEditName('')
    } else {
      setError(res.error || 'Error al renombrar categoría')
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `¿Eliminar categoría "${name}"? Los movimientos que la usen se reasignarán a "Otros".`
      )
    ) {
      const res = onDeleteCategory(id, activeTab === 'income' ? 'Otros Ingresos' : 'Otros')
      if (!res.success) {
        setError(res.error || 'Error al eliminar categoría')
      }
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10 font-sans"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Administrar Categorías
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('expense')
                setError(null)
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'expense'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Categorías de Gastos
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('income')
                setError(null)
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'income'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Categorías de Ingresos
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder={`Nueva categoría de ${activeTab === 'expense' ? 'gasto' : 'ingreso'}...`}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </form>

          {/* Category List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Categorías Personalizadas ({filteredCategories.length})
            </p>

            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aún no creaste categorías personalizadas para {activeTab === 'expense' ? 'gastos' : 'ingresos'}. Se utilizan las predeterminadas del sistema.
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors"
                >
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-sm bg-white border border-purple-400 rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(cat.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                        title="Guardar nombre"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-200 rounded-md"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Renombrar categoría"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
