'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Calculator, List, Plus, Crown, Lock, ChefHat, ArrowRight } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import {
  Recipe,
  emptyRecipe,
  calculateRecipeFinancials,
} from '@/lib/costo-receta'
import {
  getRecipeUserStatusServer,
  getUserRecipesServer,
  saveRecipeServer,
  deleteRecipeServer,
} from '@/app/actions/recipes'
import { RecipeForm } from './costo-receta/RecipeForm'
import { RecipeSummarySidebar } from './costo-receta/RecipeSummarySidebar'
import { RecipeList } from './costo-receta/RecipeList'
import { AuthModal, DeleteConfirmModal, ProUpgradeModal } from './costo-receta/Modals'

const RECIPE_DRAFT_KEY = 'playcomun_receta_draft'

export function CostoReceta({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create')
  const [recipe, setRecipe] = useState<Recipe>(emptyRecipe)
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [preservedCount, setPreservedCount] = useState(0)

  // Modals state
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [proModalFeature, setProModalFeature] = useState<'save' | 'library' | 'duplicate' | 'edit'>('save')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const router = useRouter()

  const handleGoToLogin = useCallback(() => {
    const currentUrl = typeof window !== 'undefined'
      ? (window.location.pathname + window.location.search)
      : '/herramientas/calculadora-costo-receta'
    router.push(`/ingresar?redirect=${encodeURIComponent(currentUrl)}`)
  }, [router])

  // Recuperar borrador guardado en localStorage al montar
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(RECIPE_DRAFT_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed && typeof parsed === 'object' && (parsed.name || (parsed.ingredients && parsed.ingredients.length > 0))) {
          setRecipe(parsed)
        }
      }
    } catch (e) {
      console.warn('Error al recuperar borrador de receta:', e)
    }
  }, [])

  // Auto-guardar borrador en localStorage cuando hay cambios
  useEffect(() => {
    try {
      const hasContent = (recipe.name && recipe.name.trim() !== '') || (recipe.ingredients && recipe.ingredients.length > 0)
      if (hasContent) {
        localStorage.setItem(RECIPE_DRAFT_KEY, JSON.stringify(recipe))
      }
    } catch (e) {
      console.warn('Error al persistir borrador de receta:', e)
    }
  }, [recipe])

  // 1. Cargar estado de suscripción Pro y recetas desde el servidor
  const refreshUserAndRecipes = useCallback(async () => {
    if (!user) {
      setIsPro(false)
      setPreservedCount(0)
      setMyRecipes([])
      return
    }

    setFetching(true)
    try {
      const status = await getRecipeUserStatusServer()
      setIsPro(status.isPro)
      setPreservedCount(status.preservedCount)

      if (status.isPro) {
        const recipesRes = await getUserRecipesServer()
        if (recipesRes.data) {
          setMyRecipes(recipesRes.data)
        } else if (recipesRes.error) {
          console.error('Error al obtener recetas del servidor:', recipesRes.error)
        }
      } else {
        // Usuario autenticado sin Pro activo: no se cargan filas pero se preserva el recuento
        setMyRecipes([])
      }
    } catch (err) {
      console.error('Error al consultar estado de usuario:', err)
    } finally {
      setFetching(false)
    }
  }, [user])

  useEffect(() => {
    refreshUserAndRecipes()
  }, [refreshUserAndRecipes])

  const financials = useMemo(() => {
    return calculateRecipeFinancials(recipe)
  }, [recipe])

  // 2. Guardar o actualizar receta
  const handleSave = async () => {
    // Si no está autenticado, invitar a iniciar sesión
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    // Si no tiene suscripción Pro activa, abrir modal explicativo Pro con conservación de datos
    if (!isPro) {
      setProModalFeature('save')
      setShowProModal(true)
      return
    }

    if (!recipe.name.trim()) {
      alert('Por favor asignale un nombre a la receta.')
      return
    }

    if (recipe.yield_quantity <= 0) {
      alert('El rendimiento debe ser mayor a 0.')
      return
    }

    setLoading(true)
    try {
      const res = await saveRecipeServer(recipe)
      if (res.error) {
        throw new Error(res.error)
      }

      if (res.hasConversionWarnings) {
        alert(
          `Receta guardada. Advertencia técnica: Se detectaron ${res.invalidIngredientsCount} ingrediente(s) con unidades incompatibles (falta densidad). Su costo se registró como $ 0 provisorio. Podés editar la receta en cualquier momento para regularizar las unidades.`
        )
      }

      await refreshUserAndRecipes()
      setActiveTab('list')
      setRecipe(emptyRecipe)
      try {
        localStorage.removeItem(RECIPE_DRAFT_KEY)
      } catch {}
    } catch (error: any) {
      console.error('Error al guardar la receta:', error)
      alert('Error al guardar la receta: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  // 3. Eliminar receta (solo Pro)
  const handleDelete = async (id: string) => {
    if (!isPro) {
      setProModalFeature('library')
      setShowProModal(true)
      return
    }

    try {
      setLoading(true)
      const res = await deleteRecipeServer(id)
      if (!res.success) {
        throw new Error(res.error || 'Error al eliminar receta.')
      }
      await refreshUserAndRecipes()
      setDeleteConfirmId(null)
    } catch (error: any) {
      console.error('Error al eliminar la receta:', error)
      alert('Error al eliminar la receta: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  // 4. Editar receta guardada (solo Pro)
  const handleEdit = (r: Recipe) => {
    if (!isPro) {
      setProModalFeature('edit')
      setShowProModal(true)
      return
    }
    setRecipe(r)
    setActiveTab('create')
  }

  // 5. Duplicar receta guardada (solo Pro)
  const handleDuplicate = (r: Recipe) => {
    if (!isPro) {
      setProModalFeature('duplicate')
      setShowProModal(true)
      return
    }

    const copy: Recipe = {
      ...r,
      id: undefined,
      name: `${r.name} (Copia)`,
      ingredients: r.ingredients.map((i) => ({ ...i, id: crypto.randomUUID() })),
      additional_costs: r.additional_costs.map((c) => ({ ...c, id: crypto.randomUUID() })),
    }
    setRecipe(copy)
    setActiveTab('create')
  }

  const handleNewRecipe = () => {
    setRecipe(emptyRecipe)
    setActiveTab('create')
    try {
      localStorage.removeItem(RECIPE_DRAFT_KEY)
    } catch {}
  }

  const handleOpenProModalForFeature = (feature: 'save' | 'library' | 'duplicate' | 'edit') => {
    setProModalFeature(feature)
    setShowProModal(true)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Banner de acceso a la microapp independiente Cocina Pro */}
      <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-purple-100 text-brand">
            <ChefHat className="h-4 w-4" />
          </span>
          <span className="text-xs text-slate-700">
            ¿Querés organizar tu biblioteca de insumos y precios de compra? Conocé la nueva microapp <strong>Cocina Pro</strong>.
          </span>
        </div>
        <Link
          href="/cocina-pro"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline shrink-0"
        >
          <span>Abrir Cocina Pro</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Selector de pestañas */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mx-auto md:mx-0 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-white shadow-sm text-purple-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>{recipe.id ? 'Editar receta' : 'Calculadora de costos'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('list')
            setRecipe(emptyRecipe)
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'bg-white shadow-sm text-purple-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="h-4 w-4" />
          <span>Mis recetas</span>

          {/* Badge según estado Pro y conteo */}
          {isPro ? (
            myRecipes.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'list'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {myRecipes.length}
              </span>
            )
          ) : preservedCount > 0 ? (
            <span
              title={`${preservedCount} recetas guardadas y conservadas`}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300"
            >
              <Lock className="w-2.5 h-2.5" />
              {preservedCount}
            </span>
          ) : (
            <span
              title="Función PlayComún Pro"
              className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800"
            >
              <Crown className="w-2.5 h-2.5 text-amber-600" />
              Pro
            </span>
          )}
        </button>
      </div>

      {/* Pestaña: Creador / Calculadora (100% Gratis para calcular) */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <RecipeForm
              recipe={recipe}
              setRecipe={setRecipe}
              financials={financials}
            />
          </div>
          <div className="lg:col-span-1">
            <RecipeSummarySidebar
              recipe={recipe}
              setRecipe={setRecipe}
              financials={financials}
              loading={loading}
              isPro={isPro}
              onSave={handleSave}
            />
          </div>
        </div>
      )}

      {/* Pestaña: Mis Recetas (Pro o estado bloqueado) */}
      {activeTab === 'list' && (
        <RecipeList
          user={user}
          isPro={isPro}
          preservedCount={preservedCount}
          recipes={myRecipes}
          fetching={fetching}
          onNewRecipe={handleNewRecipe}
          onEditRecipe={handleEdit}
          onDuplicateRecipe={handleDuplicate}
          onDeleteRecipeRequest={(id) => setDeleteConfirmId(id)}
          onGoToAuth={handleGoToLogin}
          onOpenProModal={handleOpenProModalForFeature}
        />
      )}

      {/* Modales */}
      <AuthModal
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onLogin={handleGoToLogin}
      />

      <ProUpgradeModal
        isOpen={showProModal}
        feature={proModalFeature}
        preservedCount={preservedCount}
        isAuthenticated={!!user}
        onClose={() => setShowProModal(false)}
        onLogin={handleGoToLogin}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        loading={loading}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
      />
    </div>
  )
}
