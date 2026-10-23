'use client'

import { ChefHat, Percent } from 'lucide-react'
import { Recipe, Unit } from '@/lib/costo-receta'

const COMMON_CATEGORIES = [
  'Panadería',
  'Pastelería',
  'Repostería',
  'Chocolatería',
  'Gourmet',
  'Masas y Tartas',
  'Pizzas y Empanadas',
  'Postres al plato',
  'Heladería',
  'Bebidas y Almíbares',
  'General',
]

const YIELD_UNITS: { value: Unit; label: string }[] = [
  { value: 'unidades', label: 'Unidades / Porciones' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
]

export function RecipeGeneralSection({
  recipe,
  onChange,
}: {
  recipe: Recipe
  onChange: (patch: Partial<Recipe>) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-100 shrink-0">
          <ChefHat className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Datos generales de la elaboración
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Identificación, categoría comercial y rendimiento estándar de la preparación.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="sm:col-span-2">
          <label htmlFor="recipe-name" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Nombre de la receta <span className="text-red-500">*</span>
          </label>
          <input
            id="recipe-name"
            type="text"
            required
            value={recipe.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ej: Medialunas de manteca estilo marplatense"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
          />
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="recipe-category" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Categoría
          </label>
          <div className="relative">
            <input
              id="recipe-category"
              type="text"
              list="categories-list"
              value={recipe.category}
              onChange={(e) => onChange({ category: e.target.value })}
              placeholder="Ej: Panadería"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
            />
            <datalist id="categories-list">
              {COMMON_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Rendimiento */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="recipe-yield-qty" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Rinde (cantidad) <span className="text-red-500">*</span>
            </label>
            <input
              id="recipe-yield-qty"
              type="number"
              min="0.01"
              step="any"
              required
              value={recipe.yield_quantity || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                onChange({ yield_quantity: isNaN(val) ? 0 : val })
              }}
              placeholder="12"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="recipe-yield-unit" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Unidad de rinde
            </label>
            <select
              id="recipe-yield-unit"
              value={recipe.yield_unit}
              onChange={(e) => onChange({ yield_unit: e.target.value as Unit })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
            >
              {YIELD_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div className="sm:col-span-2">
          <label htmlFor="recipe-desc" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Descripción y notas del producto
          </label>
          <textarea
            id="recipe-desc"
            rows={2}
            value={recipe.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Breve reseña del producto, características organolépticas, presentación o sugerencia de venta..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] leading-relaxed resize-y transition-colors"
          />
        </div>
      </div>

      {/* Política de fijación de precios y rentabilidad */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div>
          <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Política de rentabilidad y precio de venta
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            Definí la regla comercial para calcular la sugerencia de precio final.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-semibold text-slate-800 mb-1.5">
              Modo de cálculo
            </span>
            <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => onChange({ pricing_mode: 'margin' })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[38px] active:scale-[0.98] ${
                  recipe.pricing_mode === 'margin'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/90 font-semibold'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
              >
                Margen sobre venta
              </button>
              <button
                type="button"
                onClick={() => onChange({ pricing_mode: 'markup' })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[38px] active:scale-[0.98] ${
                  recipe.pricing_mode === 'markup'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/90 font-semibold'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
              >
                Recargo sobre costo
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="recipe-target-val" className="block text-xs font-semibold text-slate-800 mb-1.5">
              {recipe.pricing_mode === 'margin' ? 'Margen objetivo (%)' : 'Recargo objetivo (%)'}
            </label>
            <div className="relative">
              <input
                id="recipe-target-val"
                type="number"
                min="0"
                max={recipe.pricing_mode === 'margin' ? 99 : 1000}
                step="any"
                value={recipe.pricing_mode === 'margin' ? (recipe.target_margin ?? '') : (recipe.target_markup ?? '')}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  const num = isNaN(val) ? 0 : val
                  if (recipe.pricing_mode === 'margin') {
                    onChange({ target_margin: num })
                  } else {
                    onChange({ target_markup: num })
                  }
                }}
                placeholder="30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] pr-8 transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-700">
                %
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {recipe.pricing_mode === 'margin'
                ? 'Porcentaje del precio final de venta que constituye ganancia bruta.'
                : 'Porcentaje que se adiciona sobre el costo total de elaboración.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
