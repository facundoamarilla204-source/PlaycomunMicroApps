'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Recipe, Ingredient, AdditionalCost, Unit, formatCurrency, RecipeFinancials } from '@/lib/costo-receta'

interface RecipeFormProps {
  recipe: Recipe
  setRecipe: React.Dispatch<React.SetStateAction<Recipe>>
  financials: RecipeFinancials
}

export function RecipeForm({ recipe, setRecipe, financials }: RecipeFormProps) {
  const addIngredient = () => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          id: crypto.randomUUID(),
          name: '',
          quantity: 0,
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 0,
        },
      ],
    }))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...recipe.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setRecipe((prev) => ({ ...prev, ingredients: newIngredients }))
  }

  const removeIngredient = (index: number) => {
    const newIngredients = [...recipe.ingredients]
    newIngredients.splice(index, 1)
    setRecipe((prev) => ({ ...prev, ingredients: newIngredients }))
  }

  const addAdditionalCost = () => {
    setRecipe((prev) => ({
      ...prev,
      additional_costs: [
        ...prev.additional_costs,
        { id: crypto.randomUUID(), name: '', amount: 0 },
      ],
    }))
  }

  const updateAdditionalCost = (index: number, field: keyof AdditionalCost, value: any) => {
    const newCosts = [...recipe.additional_costs]
    newCosts[index] = { ...newCosts[index], [field]: value }
    setRecipe((prev) => ({ ...prev, additional_costs: newCosts }))
  }

  const removeAdditionalCost = (index: number) => {
    const newCosts = [...recipe.additional_costs]
    newCosts.splice(index, 1)
    setRecipe((prev) => ({ ...prev, additional_costs: newCosts }))
  }

  return (
    <div className="space-y-6">
      {/* Información General */}
      <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-5 sm:p-7 space-y-5">
        <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-3">
          Información General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Nombre de la receta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={recipe.name}
              onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
              placeholder="Ej. Torta de chocolate clásica"
              className="block w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Categoría</label>
            <input
              type="text"
              value={recipe.category}
              onChange={(e) => setRecipe({ ...recipe, category: e.target.value })}
              placeholder="Ej. Pastelería, Panadería, Viandas"
              className="block w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Rendimiento total <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={recipe.yield_quantity || ''}
              onChange={(e) => setRecipe({ ...recipe, yield_quantity: Number(e.target.value) })}
              placeholder="Ej. 10"
              className="block w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Unidad de rinde <span className="text-red-500">*</span>
            </label>
            <select
              value={recipe.yield_unit}
              onChange={(e) => setRecipe({ ...recipe, yield_unit: e.target.value as Unit })}
              className="block w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-white outline-hidden transition-all"
            >
              <option value="unidades">Unidades / Porciones</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="g">Gramos (g)</option>
              <option value="l">Litros (L)</option>
              <option value="ml">Mililitros (ml)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700">Observaciones o notas</label>
          <textarea
            value={recipe.description}
            onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
            placeholder="Instrucciones, notas de conservación o detalles de preparación..."
            rows={3}
            className="block w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden transition-all resize-none"
          />
        </div>
      </div>

      {/* Ingredientes */}
      <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Ingredientes</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ingresá el costo de compra y cuánto utilizás en esta preparación.
            </p>
          </div>
          <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
            {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {recipe.ingredients.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 bg-neutral-50/70 rounded-xl border border-dashed border-neutral-300">
            <p className="text-sm font-medium">Aún no agregaste ningún ingrediente.</p>
            <p className="text-xs text-neutral-400 mt-1">Hacé clic en el botón de abajo para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {recipe.ingredients.map((ing, i) => {
              const calcCost = financials.ingredientsWithCost[i]?.calculated_cost ?? 0
              return (
                <div
                  key={ing.id}
                  className="p-4 sm:p-5 border border-neutral-200 rounded-xl bg-neutral-50/40 hover:bg-neutral-50/70 transition-colors space-y-3.5 relative"
                >
                  <button
                    type="button"
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    onClick={() => removeIngredient(i)}
                    title="Eliminar ingrediente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="pr-8">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nombre del ingrediente
                    </label>
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                      placeholder="Ej. Harina 0000, Chocolate cobertura, Manteca"
                      className="block w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Precio compra ref */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-neutral-600">
                        Precio compra ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ing.reference_price || ''}
                        onChange={(e) => updateIngredient(i, 'reference_price', Number(e.target.value))}
                        placeholder="0.00"
                        className="block w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden"
                      />
                    </div>

                    {/* Por cantidad y unidad de ref */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-neutral-600">
                        Por paquete / ref.
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={ing.reference_quantity || ''}
                          onChange={(e) =>
                            updateIngredient(i, 'reference_quantity', Number(e.target.value))
                          }
                          className="block w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden"
                        />
                        <select
                          value={ing.reference_unit}
                          onChange={(e) =>
                            updateIngredient(i, 'reference_unit', e.target.value as Unit)
                          }
                          className="block w-22 px-2 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium focus:border-brand outline-hidden"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">L</option>
                          <option value="ml">ml</option>
                          <option value="unidades">un</option>
                        </select>
                      </div>
                    </div>

                    {/* Cantidad usada en receta */}
                    <div className="space-y-1 bg-brand/5 p-2 rounded-lg border border-brand/15 sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-brand">
                        Cantidad en receta
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={ing.quantity || ''}
                          onChange={(e) => updateIngredient(i, 'quantity', Number(e.target.value))}
                          placeholder="0"
                          className="block w-full px-3 py-2 rounded-lg border border-brand/30 bg-white focus:border-brand focus:ring-1 focus:ring-brand text-sm outline-hidden font-semibold"
                        />
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(i, 'unit', e.target.value as Unit)}
                          className="block w-22 px-2 py-2 rounded-lg border border-brand/30 bg-white text-xs font-bold text-brand focus:border-brand outline-hidden"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">L</option>
                          <option value="unidades">un</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {financials.ingredientsWithCost[i]?.conversionError && (
                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-1.5">
                      <span className="font-bold text-amber-900">⚠️ Unidad incompatible:</span>
                      <span>{financials.ingredientsWithCost[i]?.conversionError}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500">Costo proporcional en receta:</span>
                    {financials.ingredientsWithCost[i]?.conversionError ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Revisar unidades
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-brand">
                        {formatCurrency(calcCost)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={addIngredient}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-brand/30 hover:border-brand text-brand hover:text-brand-hover hover:bg-brand/5 rounded-xl font-semibold text-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar ingrediente</span>
        </button>
      </div>

      {/* Otros Costos */}
      <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/90 p-5 sm:p-7 space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-lg font-bold text-neutral-900">Otros Costos de Elaboración</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Mano de obra, gas, electricidad, envases, etiquetas, cajas, etc.
          </p>
        </div>

        {recipe.additional_costs.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 bg-neutral-50/70 rounded-xl border border-dashed border-neutral-300 text-xs">
            No agregaste otros costos a esta receta.
          </div>
        ) : (
          <div className="space-y-3">
            {recipe.additional_costs.map((cost, i) => (
              <div
                key={cost.id}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50"
              >
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={cost.name}
                    onChange={(e) => updateAdditionalCost(i, 'name', e.target.value)}
                    placeholder="Ej. Packaging y caja, Gas"
                    className="block w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm focus:border-brand outline-hidden"
                  />
                </div>
                <div className="w-32 sm:w-40 space-y-1">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cost.amount || ''}
                      onChange={(e) => updateAdditionalCost(i, 'amount', Number(e.target.value))}
                      placeholder="0.00"
                      className="block w-full pl-6 pr-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm focus:border-brand outline-hidden font-medium"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAdditionalCost(i)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar costo adicional"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addAdditionalCost}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-neutral-300 hover:border-neutral-400 text-neutral-700 hover:bg-neutral-50 rounded-xl font-semibold text-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar otro costo</span>
        </button>
      </div>
    </div>
  )
}
