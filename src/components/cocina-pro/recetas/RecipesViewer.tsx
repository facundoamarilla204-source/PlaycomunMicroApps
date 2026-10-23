'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  BookOpen,
  Plus,
  Clock,
  Layers,
  X,
  Edit3,
  Copy,
  Trash2,
  FileDown,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Scale,
  Flame,
} from 'lucide-react'
import { Recipe } from '@/lib/costo-receta'
import { calculateCompositeRecipeFinancials } from '@/lib/gastronomia'
import { duplicateRecipeServer, deleteRecipeServer } from '@/app/actions/recipes'
import { exportSingleRecipePdf } from '@/lib/recipePdf'
import { RecipeDetailDrawer } from './RecipeDetailDrawer'
import { RecipeScaleModal } from './RecipeScaleModal'

export function RecipesViewer({
  initialRecipes,
}: {
  initialRecipes: Recipe[]
}) {
  const searchParams = useSearchParams()

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Estado del drawer de detalle
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Estado del modal de escalado de receta
  const [scalingRecipe, setScalingRecipe] = useState<Recipe | null>(null)
  const [isScaleOpen, setIsScaleOpen] = useState(false)

  // Acciones: duplicar y eliminar
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mensaje de feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Auto-abrir receta si viene por query param ?id=...
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      const match = recipes.find((r) => r.id === idParam)
      if (match) {
        setSelectedRecipe(match)
        setIsDetailOpen(true)
      }
    }
  }, [searchParams, recipes])

  // Desvanecer feedback luego de 4 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Duplicar receta
  const handleDuplicate = async (recipe: Recipe) => {
    if (!recipe.id || duplicatingId) return
    setDuplicatingId(recipe.id)
    setFeedback(null)

    try {
      const res = await duplicateRecipeServer(recipe.id)
      if (res.error || !res.data) {
        setFeedback({
          type: 'error',
          text: res.error || 'No se pudo duplicar la receta.',
        })
      } else {
        setRecipes((prev) => [res.data!, ...prev])
        setFeedback({
          type: 'success',
          text: `Receta "${res.data.name}" creada con éxito.`,
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error inesperado al duplicar la receta.',
      })
    } finally {
      setDuplicatingId(null)
    }
  }

  // Eliminar receta
  const handleDeleteConfirm = async () => {
    if (!recipeToDelete?.id || isDeleting) return
    setIsDeleting(true)

    try {
      const res = await deleteRecipeServer(recipeToDelete.id)
      if (res.error) {
        setFeedback({
          type: 'error',
          text: res.error,
        })
      } else {
        const deletedName = recipeToDelete.name
        setRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete.id))
        setFeedback({
          type: 'success',
          text: `Receta "${deletedName}" eliminada correctamente.`,
        })
        setRecipeToDelete(null)
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error al eliminar la receta.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Categorías presentes en las recetas
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    recipes.forEach((r) => {
      if (r.category && r.category.trim()) {
        set.add(r.category.trim())
      }
    })
    return Array.from(set).sort()
  }, [recipes])

  // Filtrado
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        search.trim() === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(search.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()))

      const matchesCat = !selectedCategory || r.category === selectedCategory

      return matchesSearch && matchesCat
    })
  }, [recipes, search, selectedCategory])

  // Mapa de recetas para cálculo financiero recursivo
  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    recipes.forEach((r) => {
      if (r.id) map.set(r.id, r)
    })
    return map
  }, [recipes])

  return (
    <div className="space-y-6">
      {/* Banner de feedback temporal */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-500 hover:text-slate-800 p-1"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200/80">
              Recetario técnico
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tus recetas guardadas ({recipes.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Creá, editá y organizá tus recetas profesionales con insumos de tu biblioteca, pasos de preparación y cálculo de costos en tiempo real.
          </p>
        </div>

        <Link
          href="/cocina-pro/recetas/nueva"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 text-violet-200" />
          <span>Nueva receta</span>
        </Link>
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar receta por nombre o categoría..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 rounded"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {availableCategories.length > 0 && (
            <div className="sm:w-56 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-colors"
                aria-label="Filtrar por categoría"
              >
                <option value="">Todas las categorías ({recipes.length})</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Píldoras de categorías */}
        {availableCategories.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                !selectedCategory
                  ? 'bg-purple-50 text-purple-950 border border-purple-200/80 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Todas ({recipes.length})
            </button>
            {availableCategories.map((cat) => {
              const count = recipes.filter((r) => r.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-purple-50 text-purple-950 border border-purple-200/80 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Listado de recetas */}
      {recipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Aún no tenés recetas guardadas
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Podés crear tu primera receta en el editor profesional para definir cantidades, ingredientes de tu biblioteca, pasos de preparación y márgenes de ganancia.
          </p>
          <div className="mt-6">
            <Link
              href="/cocina-pro/recetas/nueva"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs min-h-[44px] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-violet-200" />
              <span>Crear primera receta</span>
            </Link>
          </div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-8">
          <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            No se encontraron recetas
          </h3>
          <p className="text-xs text-slate-700 mt-1">
            Probá ajustando el término de búsqueda o seleccioná otra categoría.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setSelectedCategory('')
            }}
            className="mt-4 px-3.5 py-2 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const financials = calculateCompositeRecipeFinancials(recipe, (id) => recipesMap.get(id))
            const isDuplicatingThis = duplicatingId === recipe.id
            const hasSubrecipes = recipe.subrecipes && recipe.subrecipes.length > 0

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-violet-50 text-violet-900 border border-violet-200/80 text-[11px] font-semibold capitalize">
                        {recipe.category || 'General'}
                      </span>
                      {hasSubrecipes && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                          <Layers className="h-3 w-3 text-slate-500" />
                          <span>{recipe.subrecipes?.length} subrecetas</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                      Rinde: {recipe.yield_quantity} {recipe.yield_unit}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                    {recipe.name}
                  </h3>

                  {recipe.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>
                  )}

                  {/* Resumen de costos */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Costo total</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">
                        ${financials.totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        {financials.hasConversionErrors && '*'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-medium block">Venta sugerida</span>
                      <span className="font-bold text-emerald-700 text-sm tabular-nums">
                        ${financials.suggestedPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de insumos y tiempos */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Layers className="h-3 w-3 text-slate-400" />
                      <span>{recipe.ingredients.length} insumos</span>
                    </span>

                    {hasSubrecipes && (
                      <span className="inline-flex items-center gap-1 tabular-nums text-slate-600 font-medium">
                        <span>+ {recipe.subrecipes?.length} subrecetas</span>
                      </span>
                    )}

                    {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>
                          {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones de la receta unificadas en jerarquía */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  {/* Fila principal: Editar (CTA Principal) y Elaborar (Modo taller) */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/cocina-pro/recetas/${recipe.id}/editar`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white text-xs font-semibold transition-all min-h-[42px] shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-violet-200" />
                      <span>Editar</span>
                    </Link>

                    <Link
                      href={`/cocina-pro/elaboracion/${recipe.id}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200/80 text-xs font-semibold transition-all min-h-[42px] active:scale-[0.98] cursor-pointer"
                    >
                      <Flame className="h-3.5 w-3.5 text-[#7f22fe]" />
                      <span>Elaborar</span>
                    </Link>
                  </div>

                  {/* Fila secundaria: Ver ficha técnica y Escalar cantidades */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe(recipe)
                        setIsDetailOpen(true)
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-medium transition-all min-h-[38px] active:scale-[0.98] cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Ver ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScalingRecipe(recipe)
                        setIsScaleOpen(true)
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-medium transition-all min-h-[38px] active:scale-[0.98] cursor-pointer"
                    >
                      <Scale className="h-3.5 w-3.5 text-slate-500" />
                      <span>Escalar</span>
                    </button>
                  </div>

                  {/* Fila utilidades: Duplicar, Exportar PDF y Eliminar */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      type="button"
                      disabled={isDuplicatingThis}
                      onClick={() => handleDuplicate(recipe)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 py-1.5 px-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                      title="Duplicar receta"
                    >
                      {isDuplicatingThis ? (
                        <Loader2 className="h-3 w-3 animate-spin text-[#7f22fe]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>Duplicar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportSingleRecipePdf(recipe, { steps: recipe.steps, subrecipesBreakdown: financials.subrecipesBreakdown })}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Exportar ficha técnica PDF"
                    >
                      <FileDown className="h-3 w-3" />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecipeToDelete(recipe)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 py-1.5 px-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar receta"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal drawer para consultar la ficha */}
      <RecipeDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedRecipe(null)
        }}
        recipe={selectedRecipe}
        onScale={(r) => {
          setScalingRecipe(r)
          setIsScaleOpen(true)
        }}
      />

      {/* Modal para escalar receta y adaptar a moldes */}
      <RecipeScaleModal
        isOpen={isScaleOpen}
        onClose={() => {
          setIsScaleOpen(false)
          setScalingRecipe(null)
        }}
        recipe={scalingRecipe}
        onRecipeSaved={(newRecipe) => {
          setRecipes((prev) => [newRecipe, ...prev])
          setFeedback({
            type: 'success',
            text: `Receta escalada "${newRecipe.name}" agregada a tu recetario.`,
          })
        }}
      />

      {/* Modal de confirmación de eliminación */}
      {recipeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-recipe-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 id="delete-recipe-title" className="text-base font-bold text-slate-900">
                  ¿Eliminar receta?
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                  Vas a eliminar permanentemente <span className="font-semibold text-slate-900">&quot;{recipeToDelete.name}&quot;</span>. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setRecipeToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors min-h-[44px] shadow-xs"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Eliminar receta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
