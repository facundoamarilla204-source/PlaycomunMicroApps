'use client'

import { useState, useMemo } from 'react'
import {
  Layers,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  RefreshCw,
  AlertTriangle,
  Search,
  Check,
  X,
  Scale,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Recipe, Unit, formatCurrency } from '@/lib/costo-receta'
import {
  RecipeSubrecipe,
  detectSubrecipeCycle,
  calculateProportionalSubrecipeCost,
  calculateRecipeFinancials,
} from '@/lib/gastronomia'

const UNITS: { value: Unit; label: string }[] = [
  { value: 'g', label: 'g (gramos)' },
  { value: 'kg', label: 'kg (kilogramos)' },
  { value: 'ml', label: 'ml (mililitros)' },
  { value: 'l', label: 'l (litros)' },
  { value: 'unidades', label: 'unidades' },
]

export function RecipeSubrecipesSection({
  subrecipes = [],
  availableRecipes = [],
  currentRecipeId,
  onChange,
}: {
  subrecipes?: RecipeSubrecipe[]
  availableRecipes: Recipe[]
  currentRecipeId?: string
  onChange: (updated: RecipeSubrecipe[]) => void
}) {
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [inspectingSubrecipe, setInspectingSubrecipe] = useState<Recipe | null>(null)

  // Mapa rápido de recetas disponibles por ID
  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    availableRecipes.forEach((r) => {
      if (r.id) map.set(r.id, r)
    })
    return map
  }, [availableRecipes])

  // Obtener categorías únicas para filtros
  const categories = useMemo(() => {
    const set = new Set<string>()
    availableRecipes.forEach((r) => {
      if (r.category && r.category.trim()) set.add(r.category.trim())
    })
    return Array.from(set).sort()
  }, [availableRecipes])

  // Subrecetas ya incorporadas para deshabilitar duplicados
  const alreadyLinkedIds = useMemo(() => {
    return new Set(subrecipes.map((s) => s.subrecipe_id))
  }, [subrecipes])

  // Filtrado de recetas en el modal de selección
  const filteredRecipes = useMemo(() => {
    return availableRecipes.filter((r) => {
      // Excluir la receta misma (no auto-referencia)
      if (currentRecipeId && r.id === currentRecipeId) return false

      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = r.name.toLowerCase().includes(q)
        const matchesCat = (r.category || '').toLowerCase().includes(q)
        return matchesName || matchesCat
      }

      return true
    })
  }, [availableRecipes, currentRecipeId, selectedCategory, searchQuery])

  // Incorporar nueva subreceta
  const handleAddSubrecipe = (targetRecipe: Recipe) => {
    if (!targetRecipe.id) return

    // Validar ciclo antes de incorporar
    if (currentRecipeId) {
      const cycleCheck = detectSubrecipeCycle(currentRecipeId, targetRecipe.id, (id) => {
        const item = recipeMap.get(id)
        return (item?.subrecipes || []).map((s) => s.subrecipe_id)
      })

      if (cycleCheck.hasCycle) {
        alert(cycleCheck.message || 'No se puede incorporar porque genera una dependencia circular.')
        return
      }
    }

    const targetFinancials = calculateRecipeFinancials(targetRecipe)
    const yieldQty = targetRecipe.yield_quantity || 1
    const unitCost = targetFinancials.totalCost / yieldQty

    const newSub: RecipeSubrecipe = {
      id: crypto.randomUUID(),
      recipe_id: currentRecipeId || '',
      subrecipe_id: targetRecipe.id,
      quantity: yieldQty, // Predeterminado: la cantidad de lote completa
      unit: targetRecipe.yield_unit || 'unidades',
      waste_percentage: 0,
      position: subrecipes.length + 1,
      notes: null,
      reference_yield_quantity: yieldQty,
      reference_yield_unit: targetRecipe.yield_unit,
      reference_unit_cost: unitCost,
      reference_total_cost: targetFinancials.totalCost,
      subrecipe_name: targetRecipe.name,
      subrecipe_yield_quantity: yieldQty,
      subrecipe_yield_unit: targetRecipe.yield_unit,
      subrecipe_category: targetRecipe.category,
    }

    onChange([...subrecipes, newSub])
    setIsSelectModalOpen(false)
    setSearchQuery('')
  }

  // Modificar atributos de una subreceta
  const handleUpdate = (index: number, patch: Partial<RecipeSubrecipe>) => {
    const updated = [...subrecipes]
    updated[index] = { ...updated[index], ...patch }
    onChange(updated)
  }

  // Eliminar relación de subreceta
  const handleRemove = (index: number) => {
    const updated = subrecipes.filter((_, i) => i !== index)
    onChange(updated)
  }

  // Reordenar hacia arriba
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...subrecipes]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    onChange(updated)
  }

  // Reordenar hacia abajo
  const handleMoveDown = (index: number) => {
    if (index === subrecipes.length - 1) return
    const updated = [...subrecipes]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    onChange(updated)
  }

  // Sincronizar referencia histórica con el costo actual
  const handleSyncReference = (index: number, currentCost: number, currentUnitCost: number, yieldQty: number, yieldUnit: Unit) => {
    handleUpdate(index, {
      reference_total_cost: currentCost,
      reference_unit_cost: currentUnitCost,
      reference_yield_quantity: yieldQty,
      reference_yield_unit: yieldUnit,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Encabezado de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-brand">
              <Layers className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Subrecetas y elaboraciones compuestas
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 tabular-nums">
              {subrecipes.length}
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
            Incorporá otras preparaciones existentes como componentes de esta fórmula (bizcochuelos, cremas, rellenos, ganaches).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSelectModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 text-brand hover:bg-purple-100 border border-purple-200/80 text-xs font-bold transition-all min-h-[44px] cursor-pointer self-start sm:self-center shadow-xs active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Incorporar subreceta</span>
        </button>
      </div>

      {/* Lista de subrecetas vinculadas */}
      {subrecipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
          <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            No incorporaste subrecetas en esta elaboración.
          </p>
          <p className="text-[11px] text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            Podés crear fórmulas compuestas sumando preparaciones previas sin tener que reescribir sus ingredientes ni duplicar costos.
          </p>
          <button
            type="button"
            onClick={() => setIsSelectModalOpen(true)}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 text-brand" />
            <span>Seleccionar de mis recetas</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {subrecipes.map((sub, idx) => {
            const resolvedRecipe = recipeMap.get(sub.subrecipe_id)
            const resolvedFinancials = resolvedRecipe ? calculateRecipeFinancials(resolvedRecipe) : null

            // Calcular costo proporcional en vivo
            const liveYieldQty = resolvedRecipe?.yield_quantity || sub.reference_yield_quantity || 1
            const liveYieldUnit = resolvedRecipe?.yield_unit || sub.reference_yield_unit || 'unidades'
            const liveTotalCost = resolvedFinancials ? resolvedFinancials.totalCost : (sub.reference_total_cost || 0)

            const costCalc = calculateProportionalSubrecipeCost({
              netQuantity: sub.quantity,
              unit: sub.unit,
              wastePercentage: sub.waste_percentage,
              subrecipeYieldQuantity: liveYieldQty,
              subrecipeYieldUnit: liveYieldUnit,
              subrecipeTotalCost: liveTotalCost,
              savedHistoricalCost: sub.reference_total_cost,
              savedReferenceYieldQuantity: sub.reference_yield_quantity,
              savedReferenceYieldUnit: sub.reference_yield_unit,
            })

            const subName = sub.subrecipe_name || resolvedRecipe?.name || 'Subreceta sin nombre'
            const subCategory = sub.subrecipe_category || resolvedRecipe?.category

            return (
              <div
                key={sub.id || idx}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-purple-200 transition-colors space-y-3"
              >
                {/* Cabecera del ítem */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                      Subreceta #{idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {subName}
                    </h3>
                    {subCategory && (
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {subCategory}
                      </span>
                    )}
                  </div>

                  {/* Acciones de la subreceta */}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {resolvedRecipe && (
                      <button
                        type="button"
                        onClick={() => setInspectingSubrecipe(resolvedRecipe)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-brand hover:bg-purple-50 transition-colors"
                        title="Inspeccionar ingredientes y elaboración de esta subreceta"
                        aria-label="Inspeccionar subreceta"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      title="Mover arriba"
                      aria-label="Mover arriba"
                    >
                      <MoveUp className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === subrecipes.length - 1}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      title="Mover abajo"
                      aria-label="Mover abajo"
                    >
                      <MoveDown className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1.5 rounded-lg text-red-700 hover:text-red-900 hover:bg-red-50 transition-colors ml-1"
                      title="Desvincular esta subreceta (no la elimina del recetario)"
                      aria-label="Desvincular subreceta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Formulario de cantidades y merma */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Cantidad requerida */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Cantidad requerida
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={sub.quantity}
                      onChange={(e) => handleUpdate(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand tabular-nums min-h-[40px]"
                    />
                  </div>

                  {/* Unidad de uso */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unidad
                    </label>
                    <select
                      value={sub.unit}
                      onChange={(e) => handleUpdate(idx, { unit: e.target.value as Unit })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[40px]"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Porcentaje de merma */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      % Merma
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="99"
                      value={sub.waste_percentage || 0}
                      onChange={(e) => handleUpdate(idx, { waste_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand tabular-nums min-h-[40px]"
                    />
                  </div>

                  {/* Costo calculado proporcional */}
                  <div className="sm:col-span-3 text-right">
                    <span className="block text-[10px] text-slate-600 font-medium">
                      Costo proporcional
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(costCalc.calculatedCost)}
                    </span>
                  </div>
                </div>

                {/* Info técnica y estado de actualización de costos */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-600 bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      Rendimiento lote base:{' '}
                      <strong className="text-slate-800 tabular-nums">
                        {liveYieldQty} {liveYieldUnit}
                      </strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      Costo lote completo:{' '}
                      <strong className="text-slate-800 tabular-nums">
                        {formatCurrency(liveTotalCost)}
                      </strong>
                    </span>
                    {sub.waste_percentage > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-800 font-medium">
                          Bruto requerido: {costCalc.grossQuantity.toFixed(2)} {sub.unit}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Estado de sincronización histórica */}
                  {costCalc.hasCostDivergence && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1 text-amber-900 font-semibold bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="h-3 w-3 text-amber-700" />
                        <span>Costo guardado: {formatCurrency(sub.reference_total_cost || 0)}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSyncReference(
                            idx,
                            costCalc.calculatedCost,
                            costCalc.unitCost,
                            liveYieldQty,
                            liveYieldUnit as Unit
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-brand hover:border-purple-200 font-bold transition-all shadow-2xs active:scale-[0.98]"
                        title="Actualizar costo histórico de referencia a este valor"
                      >
                        <RefreshCw className="h-3 w-3 text-brand" />
                        <span>Sincronizar</span>
                      </button>
                    </div>
                  )}

                  {/* Error de conversión dimensional */}
                  {costCalc.conversionError && (
                    <div className="text-amber-900 font-semibold flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 w-full sm:w-auto">
                      <AlertTriangle className="h-3 w-3 text-amber-700 shrink-0" />
                      <span>{costCalc.conversionError}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para seleccionar e incorporar una receta existente */}
      {isSelectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-brand">
                  <Layers className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Incorporar receta como componente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Buscador y filtros de categoría */}
            <div className="space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="Buscar receta por nombre o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({availableRecipes.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listado de recetas disponibles */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredRecipes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-600">
                  No se encontraron recetas disponibles para incorporar.
                </div>
              ) : (
                filteredRecipes.map((r) => {
                  const isAlreadyLinked = r.id ? alreadyLinkedIds.has(r.id) : false

                  // Validación en tiempo de renderizado de posibles ciclos
                  let causesCycle = false
                  let cycleMessage = ''
                  if (currentRecipeId && r.id) {
                    const check = detectSubrecipeCycle(currentRecipeId, r.id, (id) => {
                      const item = recipeMap.get(id)
                      return (item?.subrecipes || []).map((s) => s.subrecipe_id)
                    })
                    causesCycle = check.hasCycle
                    cycleMessage = check.message || ''
                  }

                  const financials = calculateRecipeFinancials(r)

                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        causesCycle
                          ? 'border-red-200 bg-red-50/40 opacity-75'
                          : isAlreadyLinked
                          ? 'border-slate-200 bg-slate-50 opacity-80'
                          : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/20 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {r.name}
                          </span>
                          {r.category && (
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          <span>
                            Rinde: {r.yield_quantity} {r.yield_unit}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-800 tabular-nums">
                            Costo total: {formatCurrency(financials.totalCost)}
                          </span>
                        </div>

                        {causesCycle && (
                          <p className="text-[10px] text-red-800 font-medium">
                            {cycleMessage}
                          </p>
                        )}
                      </div>

                      <div>
                        {causesCycle ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
                            Ciclo detectado
                          </span>
                        ) : isAlreadyLinked ? (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-lg">
                            Ya incorporada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddSubrecipe(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors shadow-2xs active:scale-[0.98]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Incorporar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Drawer para inspeccionar subreceta sin salir del editor */}
      {inspectingSubrecipe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                  Detalle de elaboración incorporada
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {inspectingSubrecipe.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSubrecipe(null)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Rendimiento y resumen financiero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-600 block text-[10px]">Rendimiento</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {inspectingSubrecipe.yield_quantity} {inspectingSubrecipe.yield_unit}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">Costo total</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatCurrency(calculateRecipeFinancials(inspectingSubrecipe).totalCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">Costo unitario</span>
                <span className="font-bold text-purple-900 tabular-nums">
                  {formatCurrency(calculateRecipeFinancials(inspectingSubrecipe).unitCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">Categoría</span>
                <span className="font-bold text-slate-900">
                  {inspectingSubrecipe.category || 'General'}
                </span>
              </div>
            </div>

            {/* Lista de ingredientes de la subreceta */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ingredientes propios ({inspectingSubrecipe.ingredients?.length || 0})
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {(inspectingSubrecipe.ingredients || []).map((ing, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between bg-white">
                    <span className="font-semibold text-slate-800">{ing.name}</span>
                    <span className="text-slate-700 tabular-nums">
                      {ing.quantity} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pasos de elaboración */}
            {inspectingSubrecipe.steps && inspectingSubrecipe.steps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pasos de preparación ({inspectingSubrecipe.steps.length})
                </h4>
                <div className="space-y-1.5 text-xs">
                  {inspectingSubrecipe.steps.map((st, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex gap-2">
                      <span className="font-bold text-brand shrink-0">#{st.step_number}</span>
                      <p className="text-slate-800 leading-relaxed">{st.instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingSubrecipe(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
              >
                Volver a la receta principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
