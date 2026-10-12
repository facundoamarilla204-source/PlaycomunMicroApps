'use client'

import React, { useState, useMemo } from 'react'
import { FileText, Plus, RefreshCw, FileDown, Search, ChefHat, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Recipe } from '@/lib/costo-receta'
import { exportAllRecipesPdf } from '@/lib/recipePdf'
import { RecipeCard } from './RecipeCard'

interface RecipeListProps {
  user: User | null
  recipes: Recipe[]
  fetching: boolean
  onNewRecipe: () => void
  onEditRecipe: (recipe: Recipe) => void
  onDuplicateRecipe: (recipe: Recipe) => void
  onDeleteRecipeRequest: (id: string) => void
  onGoToAuth: () => void
}

export function RecipeList({
  user,
  recipes,
  fetching,
  onNewRecipe,
  onEditRecipe,
  onDuplicateRecipe,
  onDeleteRecipeRequest,
  onGoToAuth,
}: RecipeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [exportingAllPdf, setExportingAllPdf] = useState(false)

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes
    const q = searchTerm.toLowerCase().trim()
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q))
    )
  }, [recipes, searchTerm])

  const handleExportAll = async () => {
    if (recipes.length === 0) return
    try {
      setExportingAllPdf(true)
      const listToExport = filteredRecipes.length > 0 ? filteredRecipes : recipes
      await exportAllRecipesPdf(listToExport)
    } catch (err) {
      console.error('Error exportando catálogo PDF:', err)
      alert('Hubo un error al exportar el catálogo. Por favor intentá nuevamente.')
    } finally {
      setExportingAllPdf(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-5 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Mis Recetas
            </h2>
            {recipes.length > 0 && (
              <span className="text-xs font-semibold bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full">
                {recipes.length} {recipes.length === 1 ? 'receta' : 'recetas'}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Administrá tus recetas, consultá costos unitarios, precios de venta y exportá fichas en PDF.
          </p>
        </div>

        {user && recipes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportAll}
              disabled={exportingAllPdf}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-neutral-300 hover:border-brand/50 hover:bg-brand/5 text-neutral-700 hover:text-brand text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50"
              title="Descargar catálogo consolidado en PDF"
            >
              {exportingAllPdf ? (
                <RefreshCw className="h-4 w-4 animate-spin text-brand" />
              ) : (
                <FileDown className="h-4 w-4 text-brand" />
              )}
              <span>Exportar catálogo PDF</span>
            </button>

            <button
              onClick={onNewRecipe}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva receta</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!user ? (
        <div className="text-center py-16 px-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-8 w-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
            Iniciá sesión para guardar tus recetas
          </h3>
          <p className="text-neutral-500 mb-6 text-sm">
            Guardá tus recetas, calculá precios de venta automáticos y descargá tus fichas técnicas en PDF desde cualquier dispositivo.
          </p>
          <button
            onClick={onGoToAuth}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-hover shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Iniciar Sesión / Registrarse
          </button>
        </div>
      ) : fetching ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
          <RefreshCw className="h-8 w-8 text-brand animate-spin" />
          <p className="text-sm font-medium">Cargando tus recetas...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">
            Todavía no tenés recetas guardadas
          </h3>
          <p className="text-neutral-500 mb-6 text-sm">
            Creá tu primera receta para calcular costos por porción, establecer tus márgenes de ganancia y exportar la ficha técnica en PDF.
          </p>
          <button
            onClick={onNewRecipe}
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-hover shadow-xs transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Crear mi primera receta
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-hidden transition-all"
            />
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12 px-4 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm">
              No se encontraron recetas que coincidan con "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onEdit={onEditRecipe}
                  onDuplicate={onDuplicateRecipe}
                  onDeleteRequest={onDeleteRecipeRequest}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
