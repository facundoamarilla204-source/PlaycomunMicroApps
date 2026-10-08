'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Save, FileText, AlertCircle, RefreshCw, Copy, CheckCircle2, Calculator, List } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type Unit = 'g' | 'kg' | 'ml' | 'l' | 'unidades'

type Ingredient = {
  id: string
  name: string
  quantity: number
  unit: Unit
  reference_quantity: number
  reference_unit: Unit
  reference_price: number
}

type AdditionalCost = {
  id: string
  name: string
  amount: number
}

type Recipe = {
  id?: string
  name: string
  category: string
  description: string
  yield_quantity: number
  yield_unit: Unit
  target_margin: number
  target_markup: number
  pricing_mode: 'margin' | 'markup'
  ingredients: Ingredient[]
  additional_costs: AdditionalCost[]
  created_at?: string
  updated_at?: string
}

const emptyRecipe: Recipe = {
  name: '',
  category: '',
  description: '',
  yield_quantity: 1,
  yield_unit: 'unidades',
  target_margin: 0,
  target_markup: 0,
  pricing_mode: 'margin',
  ingredients: [],
  additional_costs: [],
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value)
}

const unitConversion = (from: Unit, to: Unit, value: number): number => {
  if (from === to) return value
  if (from === 'kg' && to === 'g') return value * 1000
  if (from === 'g' && to === 'kg') return value / 1000
  if (from === 'l' && to === 'ml') return value * 1000
  if (from === 'ml' && to === 'l') return value / 1000
  return value // If incompatible, just return value (should ideally be validated)
}

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

  const fetchRecipes = async () => {
    if (!user) return
    setFetching(true)
    const { data: recipesData, error: recipesError } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*), recipe_additional_costs(*)')
      .order('updated_at', { ascending: false })

    if (recipesData) {
      setMyRecipes(recipesData.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category || '',
        description: r.description || '',
        yield_quantity: Number(r.yield_quantity),
        yield_unit: r.yield_unit as Unit,
        target_margin: Number(r.target_margin),
        target_markup: Number(r.target_markup || 0),
        pricing_mode: (r.pricing_mode || 'margin') as 'margin' | 'markup',
        created_at: r.created_at,
        updated_at: r.updated_at,
        ingredients: r.recipe_ingredients.map((i: any) => ({
          id: i.id,
          name: i.name,
          quantity: Number(i.quantity),
          unit: i.unit as Unit,
          reference_quantity: Number(i.reference_quantity),
          reference_unit: i.reference_unit as Unit,
          reference_price: Number(i.reference_price)
        })),
        additional_costs: r.recipe_additional_costs.map((c: any) => ({
          id: c.id,
          name: c.name,
          amount: Number(c.amount)
        }))
      })))
    }
    setFetching(false)
  }

  useEffect(() => {
    fetchRecipes()
  }, [user])

  const addIngredient = () => {
    setRecipe(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: crypto.randomUUID(), name: '', quantity: 0, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 0 }
      ]
    }))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...recipe.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setRecipe(prev => ({ ...prev, ingredients: newIngredients }))
  }

  const removeIngredient = (index: number) => {
    const newIngredients = [...recipe.ingredients]
    newIngredients.splice(index, 1)
    setRecipe(prev => ({ ...prev, ingredients: newIngredients }))
  }

  const addAdditionalCost = () => {
    setRecipe(prev => ({
      ...prev,
      additional_costs: [
        ...prev.additional_costs,
        { id: crypto.randomUUID(), name: '', amount: 0 }
      ]
    }))
  }

  const updateAdditionalCost = (index: number, field: keyof AdditionalCost, value: any) => {
    const newCosts = [...recipe.additional_costs]
    newCosts[index] = { ...newCosts[index], [field]: value }
    setRecipe(prev => ({ ...prev, additional_costs: newCosts }))
  }

  const removeAdditionalCost = (index: number) => {
    const newCosts = [...recipe.additional_costs]
    newCosts.splice(index, 1)
    setRecipe(prev => ({ ...prev, additional_costs: newCosts }))
  }

  const handleSave = async () => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    if (!recipe.name) {
      alert("La receta debe tener un nombre")
      return
    }

    setLoading(true)
    const isEditing = !!recipe.id

    const recipeData = {
      user_id: user.id,
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      yield_quantity: recipe.yield_quantity,
      yield_unit: recipe.yield_unit,
      target_margin: recipe.target_margin,
      target_markup: recipe.target_markup,
      pricing_mode: recipe.pricing_mode,
    }

    let savedRecipeId = recipe.id

    if (isEditing) {
      await supabase.from('recipes').update(recipeData).eq('id', recipe.id)
    } else {
      const { data, error } = await supabase.from('recipes').insert(recipeData).select('id').single()
      if (data) savedRecipeId = data.id
    }

    if (savedRecipeId) {
      if (isEditing) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', savedRecipeId)
        await supabase.from('recipe_additional_costs').delete().eq('recipe_id', savedRecipeId)
      }

      if (recipe.ingredients.length > 0) {
        const ingredientsData = recipe.ingredients.map(i => {
          let refQtyConverted = unitConversion(i.reference_unit, i.unit, i.reference_quantity)
          let cost = refQtyConverted > 0 ? (i.reference_price / refQtyConverted) * i.quantity : 0
          return {
            recipe_id: savedRecipeId,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            reference_quantity: i.reference_quantity,
            reference_unit: i.reference_unit,
            reference_price: i.reference_price,
            calculated_cost: cost
          }
        })
        await supabase.from('recipe_ingredients').insert(ingredientsData)
      }

      if (recipe.additional_costs.length > 0) {
        const costsData = recipe.additional_costs.map(c => ({
          recipe_id: savedRecipeId,
          name: c.name,
          amount: c.amount
        }))
        await supabase.from('recipe_additional_costs').insert(costsData)
      }
    }

    setLoading(false)
    await fetchRecipes()
    setActiveTab('list')
    setRecipe(emptyRecipe) // Reset
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    await supabase.from('recipes').delete().eq('id', id)
    await fetchRecipes()
    setDeleteConfirmId(null)
    setLoading(false)
  }

  const editRecipe = (r: Recipe) => {
    setRecipe(r)
    setActiveTab('create')
  }

  const duplicateRecipe = (r: Recipe) => {
    const copy = { ...r, id: undefined, name: `${r.name} (Copia)` }
    setRecipe(copy)
    setActiveTab('create')
  }

  const calculations = useMemo(() => {
    let totalIngredients = 0
    const ingredientsWithCost = recipe.ingredients.map(i => {
      let refQtyConverted = unitConversion(i.reference_unit, i.unit, i.reference_quantity)
      let cost = 0
      if (refQtyConverted > 0) {
        cost = (i.reference_price / refQtyConverted) * i.quantity
      }
      totalIngredients += cost
      return { ...i, calculated_cost: cost }
    })

    const totalAdditional = recipe.additional_costs.reduce((sum, c) => sum + Number(c.amount), 0)
    const totalCost = totalIngredients + totalAdditional
    const unitCost = recipe.yield_quantity > 0 ? totalCost / recipe.yield_quantity : 0
    
    let suggestedPrice = 0
    let realMarginPct = 0

    if (recipe.pricing_mode === 'margin') {
      let margin = recipe.target_margin / 100
      if (margin >= 1) margin = 0.99 
      suggestedPrice = unitCost > 0 ? unitCost / (1 - margin) : 0
      realMarginPct = recipe.target_margin
    } else {
      let markup = recipe.target_markup / 100
      suggestedPrice = unitCost * (1 + markup)
      realMarginPct = suggestedPrice > 0 ? ((suggestedPrice - unitCost) / suggestedPrice) * 100 : 0
    }

    const profitPerUnit = suggestedPrice - unitCost
    const totalProfit = profitPerUnit * recipe.yield_quantity

    return {
      totalIngredients,
      totalAdditional,
      totalCost,
      unitCost,
      suggestedPrice,
      profitPerUnit,
      totalProfit,
      realMarginPct,
      ingredientsWithCost
    }
  }, [recipe])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex bg-neutral-100 p-1 rounded-xl w-fit mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'create' ? 'bg-white shadow-sm text-brand' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Calculator className="h-4 w-4" />
          {recipe.id ? 'Editar receta' : 'Nueva receta'}
        </button>
        <button
          onClick={() => {
            setActiveTab('list')
            setRecipe(emptyRecipe) 
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'list' ? 'bg-white shadow-sm text-brand' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <List className="h-4 w-4" />
          Mis recetas
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Nombre de la receta *</label>
                  <input type="text" value={recipe.name} onChange={e => setRecipe({...recipe, name: e.target.value})} placeholder="Ej. Torta de chocolate" className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Categoría</label>
                  <input type="text" value={recipe.category} onChange={e => setRecipe({...recipe, category: e.target.value})} placeholder="Ej. Pastelería" className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Rendimiento *</label>
                  <input type="number" min="0.01" step="0.01" value={recipe.yield_quantity || ''} onChange={e => setRecipe({...recipe, yield_quantity: Number(e.target.value)})} className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Unidad *</label>
                  <select value={recipe.yield_unit} onChange={(e: any) => setRecipe({...recipe, yield_unit: e.target.value})} className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white">
                    <option value="unidades">Unidades/Porciones</option>
                    <option value="kg">Kilogramos</option>
                    <option value="g">Gramos</option>
                    <option value="l">Litros</option>
                    <option value="ml">Mililitros</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Observaciones</label>
                <textarea value={recipe.description} onChange={e => setRecipe({...recipe, description: e.target.value})} placeholder="Instrucciones o notas adicionales" className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm h-24 resize-none" />
              </div>
            </div>

            {/* Ingredientes */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Ingredientes</h2>
                <button onClick={addIngredient} className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark px-3 py-1.5 rounded-lg border border-brand/30 hover:bg-brand/5 transition-colors">
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
              
              {recipe.ingredients.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                  No hay ingredientes. Hacé clic en "Agregar" para empezar.
                </div>
              ) : (
                <div className="space-y-4">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={ing.id} className="p-5 border border-neutral-200 rounded-xl bg-neutral-50/50 space-y-4 relative">
                      <button className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors" onClick={() => removeIngredient(i)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-neutral-700">Nombre del ingrediente</label>
                          <input type="text" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Ej. Harina 0000" className="block w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="block text-xs font-medium text-neutral-700">Precio compra $</label>
                          <input type="number" min="0" value={ing.reference_price || ''} onChange={e => updateIngredient(i, 'reference_price', Number(e.target.value))} className="block w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                        </div>
                        <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="block text-xs font-medium text-neutral-700">Por cant.</label>
                          <div className="flex gap-1">
                            <input type="number" min="0" value={ing.reference_quantity || ''} onChange={e => updateIngredient(i, 'reference_quantity', Number(e.target.value))} className="block w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                            <select value={ing.reference_unit} onChange={(e: any) => updateIngredient(i, 'reference_unit', e.target.value)} className="block w-20 px-2 py-2.5 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm bg-white">
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="l">L</option>
                              <option value="ml">ml</option>
                              <option value="unidades">un</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1 col-span-2 md:col-span-2 bg-brand/5 p-3 rounded-lg border border-brand/20">
                          <label className="block text-xs font-bold text-brand">Cantidad usada en receta</label>
                          <div className="flex gap-1">
                            <input type="number" min="0" value={ing.quantity || ''} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} className="block w-full bg-white px-3 py-2.5 rounded-lg border border-brand/30 focus:border-brand focus:ring-brand sm:text-sm" />
                            <select value={ing.unit} onChange={(e: any) => updateIngredient(i, 'unit', e.target.value)} className="block w-24 bg-white px-2 py-2.5 rounded-lg border border-brand/30 focus:border-brand focus:ring-brand sm:text-sm">
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="l">L</option>
                              <option value="ml">ml</option>
                              <option value="unidades">un</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-neutral-800">
                        Costo en receta: <span className="text-brand-dark">{formatCurrency(calculations.ingredientsWithCost[i].calculated_cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Otros Costos */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Otros Costos</h2>
                  <p className="text-xs text-neutral-500 mt-1">Mano de obra, gas, luz, packaging, etc.</p>
                </div>
                <button onClick={addAdditionalCost} className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark px-3 py-1.5 rounded-lg border border-brand/30 hover:bg-brand/5 transition-colors">
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
              
              {recipe.additional_costs.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                  Sin costos adicionales
                </div>
              ) : (
                <div className="space-y-3">
                  {recipe.additional_costs.map((cost, i) => (
                    <div key={cost.id} className="flex gap-3 items-end p-3 rounded-lg border border-neutral-100 bg-neutral-50/30">
                      <div className="flex-1 space-y-1">
                        <label className="block text-xs font-medium text-neutral-700">Concepto</label>
                        <input type="text" value={cost.name} onChange={e => updateAdditionalCost(i, 'name', e.target.value)} placeholder="Ej. Packaging" className="block w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="block text-xs font-medium text-neutral-700">Monto $</label>
                        <input type="number" min="0" value={cost.amount || ''} onChange={e => updateAdditionalCost(i, 'amount', Number(e.target.value))} className="block w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm" />
                      </div>
                      <button className="mb-1 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" onClick={() => removeAdditionalCost(i)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl shadow-md border border-brand/20 overflow-hidden">
                <div className="bg-brand/5 border-b border-brand/10 p-6">
                  <h2 className="text-lg font-bold text-neutral-900">Resumen y Rentabilidad</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Total ingredientes</span>
                    <span className="font-medium">{formatCurrency(calculations.totalIngredients)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Otros costos</span>
                    <span className="font-medium">{formatCurrency(calculations.totalAdditional)}</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex justify-between font-bold text-neutral-800">
                    <span>Costo Total Elaboración</span>
                    <span>{formatCurrency(calculations.totalCost)}</span>
                  </div>
                  
                  <div className="bg-neutral-100 p-4 rounded-xl mt-2 border border-neutral-200">
                    <div className="text-xs text-neutral-500 mb-1">Rendimiento: {recipe.yield_quantity} {recipe.yield_unit}</div>
                    <div className="flex justify-between font-bold text-lg text-brand-dark">
                      <span>Costo Unitario</span>
                      <span>{formatCurrency(calculations.unitCost)}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-neutral-800">¿Cómo querés calcular tu precio de venta?</label>
                      <select 
                        value={recipe.pricing_mode} 
                        onChange={(e: any) => setRecipe({...recipe, pricing_mode: e.target.value})} 
                        className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-brand focus:ring-brand sm:text-sm bg-white"
                      >
                        <option value="margin">Por margen de ganancia</option>
                        <option value="markup">Por recargo sobre el costo</option>
                      </select>
                      <p className="text-xs text-neutral-500">
                        {recipe.pricing_mode === 'margin' 
                          ? 'Garantiza que un porcentaje específico del precio de venta sea ganancia.' 
                          : 'Añade un porcentaje directamente sobre el costo total de la receta.'}
                      </p>
                    </div>

                    {recipe.pricing_mode === 'margin' ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-brand-dark">Margen deseado (%)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            max="99" 
                            value={recipe.target_margin || ''} 
                            onChange={e => setRecipe({...recipe, target_margin: Number(e.target.value)})} 
                            className="block w-full pl-3 pr-8 py-3 rounded-xl border border-neutral-300 focus:border-brand focus:ring-brand sm:text-lg font-bold"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500 font-bold">%</span>
                          </div>
                        </div>
                        {recipe.target_margin >= 100 && <span className="text-xs text-red-500">El margen debe ser menor al 100% para poder calcular el precio.</span>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-brand-dark">Recargo sobre el costo (%)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            value={recipe.target_markup || ''} 
                            onChange={e => setRecipe({...recipe, target_markup: Number(e.target.value)})} 
                            className="block w-full pl-3 pr-8 py-3 rounded-xl border border-neutral-300 focus:border-brand focus:ring-brand sm:text-lg font-bold"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500 font-bold">%</span>
                          </div>
                        </div>
                        {recipe.target_markup < 0 && <span className="text-xs text-red-500">El recargo no puede ser negativo.</span>}
                      </div>
                    )}
                  </div>

                  <div className="pt-5 border-t border-neutral-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-800">Precio de venta sugerido</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(calculations.suggestedPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Ganancia por unidad</span>
                      <span className="font-medium text-neutral-900">{formatCurrency(calculations.profitPerUnit)}</span>
                    </div>
                    {recipe.pricing_mode === 'markup' && (
                      <div className="bg-amber-50 p-2 rounded border border-amber-200 text-xs text-amber-800">
                        Esta ganancia representa un margen real del <strong>{calculations.realMarginPct.toFixed(2)}%</strong> sobre el precio de venta, no un {recipe.target_markup}%.
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Ganancia total estimada</span>
                      <span className="font-medium text-neutral-900">{formatCurrency(calculations.totalProfit)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                  <button className="w-full flex justify-center items-center gap-2 bg-brand text-white py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors disabled:opacity-50" onClick={handleSave} disabled={loading}>
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Guardar Receta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neutral-900">Mis Recetas</h2>
            <p className="text-sm text-neutral-500 mt-1">Administrá tus recetas guardadas</p>
          </div>
          
          {!user ? (
            <div className="text-center py-12 px-4 max-w-sm mx-auto">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Iniciá sesión para ver tus recetas</h3>
              <p className="text-neutral-500 mb-6 text-sm">Guardá tus recetas, costos e ingredientes en tu cuenta gratuita.</p>
              <button onClick={() => router.push('/ingresar')} className="bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors">Iniciar Sesión / Registrarse</button>
            </div>
          ) : fetching ? (
            <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 text-brand animate-spin" /></div>
          ) : myRecipes.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-neutral-300 rounded-xl bg-neutral-50">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Todavía no tenés recetas</h3>
              <p className="text-neutral-500 mb-6 text-sm">Empezá a calcular tus costos y guardá acá tus creaciones.</p>
              <button onClick={() => setActiveTab('create')} className="bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors">Crear mi primera receta</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myRecipes.map((r) => {
                let totalIng = 0
                r.ingredients.forEach(i => {
                  let refQtyConverted = unitConversion(i.reference_unit, i.unit, i.reference_quantity)
                  if (refQtyConverted > 0) totalIng += (i.reference_price / refQtyConverted) * i.quantity
                })
                let totalAdd = r.additional_costs.reduce((s, c) => s + c.amount, 0)
                let cost = totalIng + totalAdd
                let uCost = r.yield_quantity > 0 ? cost / r.yield_quantity : 0

                return (
                  <div key={r.id} className="flex flex-col border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                    <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                      <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{r.name}</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {r.updated_at ? `Actualizada: ${new Date(r.updated_at).toLocaleDateString('es-AR')}` : ''}
                      </p>
                    </div>
                    <div className="p-5 flex-1 text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Rinde:</span>
                        <span className="font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">{r.yield_quantity} {r.yield_unit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Costo total:</span>
                        <span className="font-medium text-neutral-900">{formatCurrency(cost)}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-brand-dark pt-2 border-t border-neutral-100 mt-2">
                        <span>Costo unitario:</span>
                        <span className="text-base">{formatCurrency(uCost)}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                      <button className="flex-1 py-2 px-3 border border-neutral-200 rounded-lg text-sm font-medium hover:bg-white transition-colors" onClick={() => editRecipe(r)}>Editar</button>
                      <button className="p-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors" title="Duplicar" onClick={() => duplicateRecipe(r)}><Copy className="h-4 w-4" /></button>
                      <button className="p-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors" title="Eliminar" onClick={() => setDeleteConfirmId(r.id || null)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Auth Dialog */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Iniciá sesión para guardar</h3>
              <p className="text-neutral-500 text-sm mb-6">
                Para guardar recetas y poder consultarlas más tarde desde cualquier dispositivo, necesitás tener una cuenta en PlayComun. ¡Es gratis!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex-1 py-2.5 px-4 border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 transition-colors" onClick={() => setShowAuthDialog(false)}>Continuar sin guardar</button>
                <button className="flex-1 py-2.5 px-4 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition-colors" onClick={() => router.push('/ingresar')}>Iniciar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">¿Eliminar receta?</h3>
              <p className="text-neutral-500 text-sm mb-6">
                Esta acción no se puede deshacer. La receta se eliminará permanentemente de tu cuenta.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex-1 py-2.5 px-4 border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 transition-colors" onClick={() => setDeleteConfirmId(null)} disabled={loading}>Cancelar</button>
                <button className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={loading}>
                  {loading ? 'Eliminando...' : 'Eliminar receta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
