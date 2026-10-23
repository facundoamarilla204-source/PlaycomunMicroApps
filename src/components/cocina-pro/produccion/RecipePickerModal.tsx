'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, X, Plus, Check, BookOpen, Layers } from 'lucide-react'
import { Recipe } from '@/lib/costo-receta'

export interface RecipePickerModalProps {
  isOpen: boolean
  onClose: () => void
  recipes: Recipe[]
  alreadySelectedIds: string[]
  onSelectRecipe: (recipe: Recipe) => void
}

export function RecipePickerModal({
  isOpen,
  onClose,
  recipes,
  alreadySelectedIds,
  onSelectRecipe,
}: RecipePickerModalProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const categories = useMemo(() => {
    const set = new Set<string>()
    recipes.forEach((r) => {
      if (r.category && r.category.trim()) set.add(r.category.trim())
    })
    return Array.from(set).sort()
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchSearch =
        search.trim() === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(search.toLowerCase()))
      const matchCat = category === '' || r.category === category
      return matchSearch && matchCat
    })
  }, [recipes, search, category])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-picker-title"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        style={{ transformOrigin: 'center' }}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 id="recipe-picker-title" className="text-sm font-bold text-slate-900 leading-tight">
                Añadir recetas a la producción
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Seleccioná las recetas que vas a elaborar en este lote
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]"
            aria-label="Cerrar selección de recetas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de búsqueda y categorías */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors min-h-[44px]"
              autoFocus
            />
          </div>

          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand min-h-[44px]"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Lista de recetas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          {filteredRecipes.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No se encontraron recetas</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Verificá el texto ingresado o creá una nueva receta en tu recetario.
              </p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const isAlreadyAdded = alreadySelectedIds.includes(recipe.id || '')
              const ingredientCount = (recipe.ingredients || []).length
              const subrecipeCount = (recipe.subrecipes || []).length

              return (
                <div
                  key={recipe.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {recipe.name}
                      </span>
                      {recipe.category && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {recipe.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>
                        Rendimiento:{' '}
                        <strong className="text-slate-700 font-semibold">
                          {recipe.yield_quantity} {recipe.yield_unit}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{ingredientCount} ingredientes</span>
                      {subrecipeCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-purple-700 font-medium">
                            {subrecipeCount} {subrecipeCount === 1 ? 'subreceta' : 'subrecetas'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRecipe(recipe)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] min-w-[44px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      isAlreadyAdded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                        : 'bg-brand text-white hover:bg-brand-hover shadow-xs'
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Añadida (agregar otra)</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Pie con contador */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredRecipes.length} recetas disponibles</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors min-h-[44px]"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
