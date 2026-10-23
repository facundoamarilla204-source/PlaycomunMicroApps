'use client'

import { Plus, Trash2, MoveUp, MoveDown, Clock, Flame, Wrench, ListOrdered } from 'lucide-react'
import { RecipeStep, RecipeStepInput } from '@/lib/gastronomia/types'

export function RecipeStepsSection({
  steps,
  onChange,
}: {
  steps: RecipeStepInput[]
  onChange: (updated: RecipeStepInput[]) => void
}) {
  const handleAddStep = () => {
    const nextNum = steps.length + 1
    const newStep: RecipeStepInput = {
      step_number: nextNum,
      instruction: '',
      duration_minutes: null,
      temperature_celsius: null,
      equipment: null,
      notes: null,
    }
    onChange([...steps, newStep])
  }

  const handleUpdateStep = (index: number, patch: Partial<RecipeStepInput>) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], ...patch }
    onChange(updated)
  }

  const handleRemoveStep = (index: number) => {
    const filtered = steps.filter((_, i) => i !== index)
    // Renumerar correlativamente
    const reordered = filtered.map((s, idx) => ({
      ...s,
      step_number: idx + 1,
    }))
    onChange(reordered)
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    // Renumerar correlativamente
    const reordered = updated.map((s, idx) => ({
      ...s,
      step_number: idx + 1,
    }))
    onChange(reordered)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-100 shrink-0">
            <ListOrdered className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Procedimiento y pasos de elaboración ({steps.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Secuencia ordenada de preparación, tiempos de amasado o leudado, temperaturas y notas de obrador.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddStep}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs min-h-[44px] cursor-pointer active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 text-purple-700" />
          <span>Agregar paso</span>
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl my-2">
          <ListOrdered className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">
            Esta receta no tiene pasos de preparación registrados
          </p>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Podés guardar la receta sin pasos y agregarlos después, o documentar ahora el método de elaboración.
          </p>
          <button
            type="button"
            onClick={handleAddStep}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-purple-700" />
            <span>Agregar primer paso</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-950 border border-purple-200/80 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Paso #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveStep(idx, 'up')}
                    className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    aria-label="Subir paso"
                  >
                    <MoveUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === steps.length - 1}
                    onClick={() => handleMoveStep(idx, 'down')}
                    className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    aria-label="Bajar paso"
                  >
                    <MoveDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                    aria-label="Eliminar paso"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Instrucción principal */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                  Instrucción o procedimiento <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={step.instruction}
                  onChange={(e) => handleUpdateStep(idx, { instruction: e.target.value })}
                  placeholder="Detallá la acción a realizar: mezclado, batido, temperatura de masa, tiempo de reposo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 leading-relaxed resize-y transition-colors"
                />
              </div>

              {/* Campos opcionales: duración, temperatura, equipamiento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Duración (min)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={step.duration_minutes ?? ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        handleUpdateStep(idx, { duration_minutes: isNaN(val) ? null : val })
                      }}
                      placeholder="Ej: 15"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 min-h-[38px] transition-colors"
                    />
                    <Clock className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Temperatura (°C)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={step.temperature_celsius ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleUpdateStep(idx, { temperature_celsius: isNaN(val) ? null : val })
                      }}
                      placeholder="Ej: 24"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 min-h-[38px] transition-colors"
                    />
                    <Flame className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Equipamiento
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={step.equipment ?? ''}
                      onChange={(e) => handleUpdateStep(idx, { equipment: e.target.value || null })}
                      placeholder="Ej: Amasadora espiral"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 min-h-[38px] transition-colors"
                    />
                    <Wrench className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
