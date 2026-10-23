'use client'

import { useState } from 'react'
import { Clock, Flame, ChevronDown, ChevronUp, Scale, Info } from 'lucide-react'
import { Recipe } from '@/lib/costo-receta'

export function RecipeTechnicalSection({
  recipe,
  onChange,
}: {
  recipe: Recipe
  onChange: (patch: Partial<Recipe>) => void
}) {
  const [isOpen, setIsOpen] = useState(
    Boolean(
      recipe.prep_time_minutes ||
      recipe.cook_time_minutes ||
      recipe.rest_time_minutes ||
      recipe.baking_temperature_celsius ||
      (recipe.baking_loss_percentage && recipe.baking_loss_percentage > 0)
    )
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-100 shrink-0">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Tiempos, cocción y mermas de horneado
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Parámetros técnicos opcionales para obradores, pastelerías y panaderías.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-medium active:scale-[0.98]"
          aria-expanded={isOpen}
        >
          <span>{isOpen ? 'Ocultar' : 'Configurar'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </button>
      </div>

      {isOpen && (
        <div className="pt-3 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tiempo preparación */}
            <div>
              <label htmlFor="prep-time" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Preparación (minutos)
              </label>
              <div className="relative">
                <input
                  id="prep-time"
                  type="number"
                  min="0"
                  step="1"
                  value={recipe.prep_time_minutes ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    onChange({ prep_time_minutes: isNaN(val) ? null : val })
                  }}
                  placeholder="Ej: 20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
                />
                <Clock className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Tiempo cocción */}
            <div>
              <label htmlFor="cook-time" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Cocción u horneado (minutos)
              </label>
              <div className="relative">
                <input
                  id="cook-time"
                  type="number"
                  min="0"
                  step="1"
                  value={recipe.cook_time_minutes ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    onChange({ cook_time_minutes: isNaN(val) ? null : val })
                  }}
                  placeholder="Ej: 35"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
                />
                <Flame className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Tiempo reposo / leudado */}
            <div>
              <label htmlFor="rest-time" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Reposo o leudado (minutos)
              </label>
              <div className="relative">
                <input
                  id="rest-time"
                  type="number"
                  min="0"
                  step="1"
                  value={recipe.rest_time_minutes ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    onChange({ rest_time_minutes: isNaN(val) ? null : val })
                  }}
                  placeholder="Ej: 60"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] transition-colors"
                />
                <Clock className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Temperatura de horneado */}
            <div>
              <label htmlFor="baking-temp" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Temperatura de horneado (°C)
              </label>
              <div className="relative">
                <input
                  id="baking-temp"
                  type="number"
                  min="0"
                  max="500"
                  step="any"
                  value={recipe.baking_temperature_celsius ?? ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    onChange({ baking_temperature_celsius: isNaN(val) ? null : val })
                  }}
                  placeholder="Ej: 180"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] pr-9 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-700">
                  °C
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Dejalo vacío para preparaciones en frío o sin cocción en horno.
              </p>
            </div>

            {/* Pérdida global por horneado / evaporación */}
            <div>
              <label htmlFor="baking-loss" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Pérdida por horneado / evaporación (% lote)
              </label>
              <div className="relative">
                <input
                  id="baking-loss"
                  type="number"
                  min="0"
                  max="99"
                  step="any"
                  value={recipe.baking_loss_percentage || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    onChange({ baking_loss_percentage: isNaN(val) ? 0 : val })
                  }}
                  placeholder="Ej: 12"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px] pr-9 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-700">
                  %
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Merma global de masa al cocinarse (diferente de la merma de cada ingrediente crudo).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
