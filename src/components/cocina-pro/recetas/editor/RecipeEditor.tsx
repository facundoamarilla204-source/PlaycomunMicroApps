'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChefHat,
  Save,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  X,
  Scale,
} from 'lucide-react'
import { Recipe, Ingredient, AdditionalCost, emptyRecipe, formatCurrency } from '@/lib/costo-receta'
import { KitchenIngredient, RecipeStep, RecipeStepInput, RecipeSubrecipe } from '@/lib/gastronomia/types'
import { saveRecipeServer } from '@/app/actions/recipes'
import { RecipeGeneralSection } from './RecipeGeneralSection'
import { RecipeTechnicalSection } from './RecipeTechnicalSection'
import { RecipeIngredientsSection } from './RecipeIngredientsSection'
import { RecipeSubrecipesSection } from './RecipeSubrecipesSection'
import { RecipeStepsSection } from './RecipeStepsSection'
import { RecipeAdditionalCostsSection } from './RecipeAdditionalCostsSection'
import { RecipeFinancialPanel } from './RecipeFinancialPanel'
import { calculateCompositeRecipeFinancials } from '@/lib/gastronomia'
import { RecipeScaleModal } from '../RecipeScaleModal'

export function RecipeEditor({
  initialRecipe,
  initialSteps = [],
  libraryIngredients,
  availableRecipes = [],
  mode = 'create',
}: {
  initialRecipe?: Recipe
  initialSteps?: RecipeStep[]
  libraryIngredients: KitchenIngredient[]
  availableRecipes?: Recipe[]
  mode?: 'create' | 'edit'
}) {
  const router = useRouter()

  const [recipe, setRecipe] = useState<Recipe>(() => {
    if (initialRecipe) {
      return {
        ...initialRecipe,
        ingredients: initialRecipe.ingredients || [],
        additional_costs: initialRecipe.additional_costs || [],
        subrecipes: initialRecipe.subrecipes || [],
      }
    }
    return {
      ...emptyRecipe,
      id: undefined,
      ingredients: [],
      additional_costs: [],
      subrecipes: [],
    }
  })

  const [steps, setSteps] = useState<RecipeStepInput[]>(() => {
    if (initialSteps && initialSteps.length > 0) {
      return initialSteps.map((s) => ({
        id: s.id,
        step_number: s.step_number,
        instruction: s.instruction,
        duration_minutes: s.duration_minutes,
        temperature_celsius: s.temperature_celsius,
        equipment: s.equipment,
        notes: s.notes,
      }))
    }
    return []
  })

  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showMobileSummary, setShowMobileSummary] = useState(false)
  const [isScaleOpen, setIsScaleOpen] = useState(false)

  // Advertencia de cambios sin guardar al salir de la pestaña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Modificar receta general
  const handleRecipePatch = useCallback((patch: Partial<Recipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [])

  // Modificar ingredientes
  const handleIngredientsChange = useCallback((updated: Ingredient[]) => {
    setRecipe((prev) => ({ ...prev, ingredients: updated }))
    setIsDirty(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [])

  // Modificar subrecetas incorporadas
  const handleSubrecipesChange = useCallback((updated: RecipeSubrecipe[]) => {
    setRecipe((prev) => ({ ...prev, subrecipes: updated }))
    setIsDirty(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [])

  // Modificar pasos
  const handleStepsChange = useCallback((updated: RecipeStepInput[]) => {
    setSteps(updated)
    setIsDirty(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [])

  // Modificar costos adicionales
  const handleAdditionalCostsChange = useCallback((updated: AdditionalCost[]) => {
    setRecipe((prev) => ({ ...prev, additional_costs: updated }))
    setIsDirty(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [])

  // Guardar receta completa (receta + ingredientes + costos + pasos)
  const handleSave = async () => {
    if (!recipe.name || !recipe.name.trim()) {
      setErrorMessage('Por favor ingresá un nombre para la receta.')
      return
    }

    if (recipe.yield_quantity <= 0) {
      setErrorMessage('El rendimiento de la receta debe ser mayor a 0.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await saveRecipeServer(recipe, steps)

      if (res.error || !res.data) {
        setErrorMessage(res.error || 'Ocurrió un error al guardar la receta.')
      } else {
        setIsDirty(false)
        setSuccessMessage('¡Receta guardada exitosamente!')
        setRecipe(res.data)

        if (res.data.steps) {
          setSteps(
            res.data.steps.map((s) => ({
              id: s.id,
              step_number: s.step_number,
              instruction: s.instruction,
              duration_minutes: s.duration_minutes,
              temperature_celsius: s.temperature_celsius,
              equipment: s.equipment,
              notes: s.notes,
            }))
          )
        }

        // Si era creación, reemplazar la URL sin recarga completa
        if (mode === 'create' && res.data.id) {
          router.replace(`/cocina-pro/recetas/${res.data.id}/editar`)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor.')
    } finally {
      setIsSaving(false)
    }
  }

  // Mapa de recetas para cálculo financiero recursivo
  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    availableRecipes.forEach((r) => {
      if (r.id) map.set(r.id, r)
    })
    return map
  }, [availableRecipes])

  // Cálculos rápidos para la barra móvil
  const mobileFinancials = useMemo(() => {
    return calculateCompositeRecipeFinancials(recipe, (id) => recipeMap.get(id))
  }, [recipe, recipeMap])

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Barra superior de navegación y guardado */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/cocina-pro/recetas"
            onClick={(e) => {
              if (isDirty && !window.confirm('Hay cambios sin guardar. ¿Deseás salir de todos modos?')) {
                e.preventDefault()
              }
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 active:scale-[0.98]"
            aria-label="Volver al recetario"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
                {mode === 'create' ? 'Nueva elaboración' : 'Editor profesional'}
              </span>
              {isDirty && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Cambios sin guardar" />
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight line-clamp-1 mt-0.5 font-sans">
              {recipe.name.trim() || 'Receta sin título'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {recipe.id && (
            <button
              type="button"
              onClick={() => setIsScaleOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 transition-colors min-h-[44px] active:scale-[0.98]"
            >
              <Scale className="h-4 w-4 text-[#7f22fe]" />
              <span>Escalar</span>
            </button>
          )}

          <Link
            href="/cocina-pro/recetas"
            className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors min-h-[44px] flex items-center active:scale-[0.98]"
          >
            Cancelar
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white text-xs font-semibold transition-all shadow-xs min-h-[44px] cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-white" />
                <span>Guardar receta</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid principal: Formulario a la izquierda (col-span-8), Resumen a la derecha (col-span-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Datos generales */}
          <RecipeGeneralSection recipe={recipe} onChange={handleRecipePatch} />

          {/* 2. Parámetros técnicos (tiempos, temperatura, pérdida horneado) */}
          <RecipeTechnicalSection recipe={recipe} onChange={handleRecipePatch} />

          {/* 3. Ingredientes y mermas */}
          <RecipeIngredientsSection
            ingredients={recipe.ingredients}
            libraryIngredients={libraryIngredients}
            onChange={handleIngredientsChange}
          />

          {/* 4. Subrecetas y elaboraciones compuestas */}
          <RecipeSubrecipesSection
            subrecipes={recipe.subrecipes}
            availableRecipes={availableRecipes}
            currentRecipeId={recipe.id}
            onChange={handleSubrecipesChange}
          />

          {/* 5. Pasos de elaboración */}
          <RecipeStepsSection steps={steps} onChange={handleStepsChange} />

          {/* 6. Costos adicionales */}
          <RecipeAdditionalCostsSection
            additionalCosts={recipe.additional_costs}
            onChange={handleAdditionalCostsChange}
          />
        </div>

        {/* Panel financiero lateral adhesivo en desktop */}
        <div className="hidden lg:block lg:col-span-4">
          <RecipeFinancialPanel
            recipe={recipe}
            availableRecipes={availableRecipes}
            isSaving={isSaving}
            isDirty={isDirty}
            onSave={handleSave}
            errorMessage={errorMessage}
            successMessage={successMessage}
          />
        </div>
      </div>

      {/* Barra flotante inferior para dispositivos móviles (< 1024px) */}
      <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-700 block">Costo preparación</span>
            <span className="font-extrabold text-sm text-slate-900 block">
              {formatCurrency(mobileFinancials.totalCost)}
              {mobileFinancials.hasConversionErrors && '*'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-emerald-800 font-semibold block">Venta sugerida</span>
            <span className="font-extrabold text-sm text-emerald-900 block">
              {formatCurrency(mobileFinancials.suggestedPrice)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowMobileSummary(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white min-h-[44px]"
            >
              Detalle
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 min-h-[44px] flex items-center gap-1.5 active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Save className="h-4 w-4 text-purple-300" />}
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Drawer móvil para ver el resumen financiero completo */}
      {showMobileSummary && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">
                Resumen de costos y rentabilidad
              </span>
              <button
                type="button"
                onClick={() => setShowMobileSummary(false)}
                className="p-1 text-slate-600 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <RecipeFinancialPanel
              recipe={recipe}
              availableRecipes={availableRecipes}
              isSaving={isSaving}
              isDirty={isDirty}
              onSave={() => {
                setShowMobileSummary(false)
                handleSave()
              }}
              errorMessage={errorMessage}
              successMessage={successMessage}
            />
          </div>
        </div>
      )}

      {/* Modal para escalar receta y adaptar a moldes */}
      {recipe.id && (
        <RecipeScaleModal
          isOpen={isScaleOpen}
          onClose={() => setIsScaleOpen(false)}
          recipe={recipe}
          onRecipeSaved={(newRecipe) => {
            setSuccessMessage(`Receta derivada "${newRecipe.name}" guardada con éxito.`)
          }}
        />
      )}
    </div>
  )
}
