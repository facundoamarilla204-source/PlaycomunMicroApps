'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  RefreshCw,
  FileDown,
  Search,
  ChefHat,
  Sparkles,
  Lock,
  Crown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Recipe } from '@/lib/costo-receta'
import { exportAllRecipesPdf } from '@/lib/recipePdf'
import { RecipeCard } from './RecipeCard'

interface RecipeListProps {
  user: User | null
  isPro: boolean
  preservedCount?: number
  recipes: Recipe[]
  fetching: boolean
  onNewRecipe: () => void
  onEditRecipe: (recipe: Recipe) => void
  onDuplicateRecipe: (recipe: Recipe) => void
  onDeleteRecipeRequest: (id: string) => void
  onGoToAuth: () => void
  onOpenProModal?: (feature: 'save' | 'library' | 'duplicate' | 'edit') => void
}

export function RecipeList({
  user,
  isPro,
  preservedCount = 0,
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

  // 1. Caso: Usuario no autenticado
  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10">
        <div className="text-center py-8 px-4 max-w-md mx-auto">
          <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <ChefHat className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Biblioteca de recetas en la nube
          </h3>
          <p className="text-slate-600 mb-6 text-xs sm:text-sm leading-relaxed">
            Iniciá sesión en tu cuenta con plan Pro para guardar recetas, calcular costos unitarios y exportar fichas técnicas en PDF.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGoToAuth}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 shadow-xs transition-colors text-xs cursor-pointer"
            >
              Iniciar sesión
            </button>
            <Link
              href="/planes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors text-xs"
            >
              Ver planes Pro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Caso: Usuario autenticado SIN suscripción Pro activa
  if (!isPro) {
    // 2.A: Usuario que tuvo Pro y tiene recetas conservadas (CRÍTICO)
    if (preservedCount > 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10">
          <div className="max-w-md mx-auto text-center space-y-5">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-slate-500" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                Suscripción inactiva
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Tenés {preservedCount} {preservedCount === 1 ? 'receta guardada' : 'recetas guardadas'}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Para consultar tus recetas, editarlas o descargarlas en PDF necesitás una suscripción activa a PlayComún Pro. Tus datos siguen guardados y estarán disponibles apenas reactives el plan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
              <p>• Todos tus ingredientes, cantidades y costos siguen intactos.</p>
              <p>• Podés seguir usando la calculadora de recetas gratis para cálculos individuales.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/planes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
              >
                Reactivar PlayComún Pro
              </Link>
              <button
                type="button"
                onClick={onNewRecipe}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-xs transition-colors cursor-pointer"
              >
                Usar calculadora gratis
              </button>
            </div>
          </div>
        </div>
      )
    }

    // 2.B: Usuario autenticado sin recetas que no tiene Pro
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10">
        <div className="max-w-md mx-auto text-center space-y-5">
          <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center mx-auto border border-purple-100">
            <ChefHat className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700">
              Función Pro
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              Biblioteca de recetas en la nube
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Guardá tus recetas, organizalas por categoría, actualizá costos de materias primas y exportá fichas técnicas en PDF.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/planes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
            >
              Ver planes Pro
            </Link>
            <button
              type="button"
              onClick={onNewRecipe}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Usar calculadora gratis
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Caso: Usuario autenticado PRO con datos cargando
  if (fetching) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-12 text-center">
        <div className="flex flex-col items-center justify-center py-10 text-neutral-400 gap-3">
          <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
          <p className="text-sm font-medium text-neutral-600">Cargando tus recetas guardadas...</p>
        </div>
      </div>
    )
  }

  // 4. Caso: Usuario autenticado PRO con 0 recetas
  if (recipes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Mis Recetas
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Administrá tus recetas, consultá costos unitarios y exportá fichas en PDF.
            </p>
          </div>
        </div>

        <div className="text-center py-16 px-4 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">
            Todavía no tenés recetas guardadas
          </h3>
          <p className="text-neutral-500 mb-6 text-sm">
            Creá tu primera receta para calcular costos por porción, establecer tus márgenes de ganancia y guardarla en tu cuenta.
          </p>
          <button
            onClick={onNewRecipe}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 shadow-xs transition-colors text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Crear mi primera receta
          </button>
        </div>
      </div>
    )
  }

  // 5. Caso: Usuario autenticado PRO con recetas activas
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-5 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Mis Recetas
            </h2>
            <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              {recipes.length} {recipes.length === 1 ? 'receta' : 'recetas'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Administrá tus recetas, consultá costos unitarios, precios de venta y exportá fichas en PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportAll}
            disabled={exportingAllPdf}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-neutral-300 hover:border-purple-500/50 hover:bg-purple-50 text-neutral-700 hover:text-purple-700 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Descargar catálogo consolidado en PDF"
          >
            {exportingAllPdf ? (
              <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
            ) : (
              <FileDown className="h-4 w-4 text-purple-600" />
            )}
            <span>Exportar catálogo PDF</span>
          </button>

          <button
            onClick={onNewRecipe}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva receta</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-5">
        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden transition-all"
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
    </div>
  )
}
