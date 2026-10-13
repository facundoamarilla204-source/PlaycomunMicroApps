'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calculator, List, Plus } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Recipe,
  Unit,
  emptyRecipe,
  calculateRecipeFinancials,
  unitConversion,
} from '@/lib/costo-receta'
import { RecipeForm } from './costo-receta/RecipeForm'
import { RecipeSummarySidebar } from './costo-receta/RecipeSummarySidebar'
import { RecipeList } from './costo-receta/RecipeList'
import { AuthModal, DeleteConfirmModal } from './costo-receta/Modals'

export function CostoReceta({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create')
  const [recipe, setRecipe] = useState<Recipe>(emptyRecipe)
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setMyRecipes([])
      return
    }
    setFetching(true)
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*), recipe_additional_costs(*)')
        .order('updated_at', { ascending: false })

      if (recipesError) {
        console.error('Error cargando recetas:', recipesError)
        return
      }

      if (recipesData) {
        setMyRecipes(
          recipesData.map((r: any) => ({
            id: r.id,
            name: r.name,
            category: r.category || '',
            description: r.description || '',
            yield_quantity: Number(r.yield_quantity) || 1,
            yield_unit: (r.yield_unit || 'unidades') as Unit,
            target_margin: Number(r.target_margin) || 0,
            target_markup: Number(r.target_markup || 0),
            pricing_mode: (r.pricing_mode || 'margin') as 'margin' | 'markup',
            created_at: r.created_at,
            updated_at: r.updated_at,
            ingredients: (r.recipe_ingredients || []).map((i: any) => ({
              id: i.id,
              name: i.name,
              quantity: Number(i.quantity) || 0,
              unit: (i.unit || 'g') as Unit,
              reference_quantity: Number(i.reference_quantity) || 1,
              reference_unit: (i.reference_unit || 'kg') as Unit,
              reference_price: Number(i.reference_price) || 0,
            })),
            additional_costs: (r.recipe_additional_costs || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              amount: Number(c.amount) || 0,
            })),
          }))
        )
      }
    } catch (err) {
      console.error('Error fetching recipes:', err)
    } finally {
      setFetching(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  const financials = useMemo(() => {
    return calculateRecipeFinancials(recipe)
  }, [recipe])

  const handleSave = async () => {
    if (!user) {
      setShowAuthDialog(true)
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

    const validIngredients = recipe.ingredients.filter((i) => i.name.trim() !== '')
    const validCosts = recipe.additional_costs.filter((c) => c.name.trim() !== '')

    setLoading(true)
    const isEditing = !!recipe.id

    const recipeData = {
      user_id: user.id,
      name: recipe.name.trim(),
      category: recipe.category.trim(),
      description: recipe.description.trim(),
      yield_quantity: recipe.yield_quantity,
      yield_unit: recipe.yield_unit,
      target_margin: recipe.target_margin,
      target_markup: recipe.target_markup,
      pricing_mode: recipe.pricing_mode,
      updated_at: new Date().toISOString(),
    }

    let savedRecipeId = recipe.id

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', recipe.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('recipes')
          .insert(recipeData)
          .select('id')
          .single()
        if (error) throw error
        if (data) savedRecipeId = data.id
      }

      if (savedRecipeId) {
        if (isEditing) {
          await supabase.from('recipe_ingredients').delete().eq('recipe_id', savedRecipeId)
          await supabase.from('recipe_additional_costs').delete().eq('recipe_id', savedRecipeId)
        }

        if (validIngredients.length > 0) {
          const ingredientsData = validIngredients.map((i) => {
            const refQtyConverted = unitConversion(i.reference_unit, i.unit, i.reference_quantity)
            const cost =
              refQtyConverted > 0 ? (i.reference_price / refQtyConverted) * i.quantity : 0
            return {
              recipe_id: savedRecipeId,
              name: i.name.trim(),
              quantity: i.quantity,
              unit: i.unit,
              reference_quantity: i.reference_quantity,
              reference_unit: i.reference_unit,
              reference_price: i.reference_price,
              calculated_cost: cost,
            }
          })
          const { error: ingError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsData)
          if (ingError) throw ingError
        }

        if (validCosts.length > 0) {
          const costsData = validCosts.map((c) => ({
            recipe_id: savedRecipeId,
            name: c.name.trim(),
            amount: c.amount,
          }))
          const { error: costsError } = await supabase
            .from('recipe_additional_costs')
            .insert(costsData)
          if (costsError) throw costsError
        }
      }

      await fetchRecipes()
      setActiveTab('list')
      setRecipe(emptyRecipe)
    } catch (error: any) {
      console.error('Error al guardar la receta:', error)
      alert('Error al guardar la receta: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
      await fetchRecipes()
      setDeleteConfirmId(null)
    } catch (error: any) {
      console.error('Error al eliminar la receta:', error)
      alert('Error al eliminar la receta: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (r: Recipe) => {
    setRecipe(r)
    setActiveTab('create')
  }

  const handleDuplicate = (r: Recipe) => {
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
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Navigation tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mx-auto md:mx-0 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'list'
              ? 'bg-white shadow-sm text-purple-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="h-4 w-4" />
          <span>Mis recetas</span>
          {myRecipes.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'list'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {myRecipes.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Form / Creator */}
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
              onSave={handleSave}
            />
          </div>
        </div>
      )}

      {/* Tab: My Recipes List */}
      {activeTab === 'list' && (
        <RecipeList
          user={user}
          recipes={myRecipes}
          fetching={fetching}
          onNewRecipe={handleNewRecipe}
          onEditRecipe={handleEdit}
          onDuplicateRecipe={handleDuplicate}
          onDeleteRecipeRequest={(id) => setDeleteConfirmId(id)}
          onGoToAuth={() => router.push('/ingresar')}
        />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onLogin={() => router.push('/ingresar')}
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
