'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  BookOpen,
  Link2,
  Unlink,
  RefreshCw,
  AlertTriangle,
  Search,
  Check,
  X,
  Scale,
} from 'lucide-react'
import { Ingredient, Unit, formatCurrency } from '@/lib/costo-receta'
import { KitchenIngredient } from '@/lib/gastronomia/types'
import { calculateIngredientLiveCost } from '@/lib/gastronomia/recipe-linking'
import { convertUnits } from '@/lib/gastronomia/conversions'
import { PriceDivergenceItem, SyncLibraryPricesModal } from './SyncLibraryPricesModal'

const UNITS: { value: Unit; label: string }[] = [
  { value: 'g', label: 'g (gramos)' },
  { value: 'kg', label: 'kg (kilogramos)' },
  { value: 'ml', label: 'ml (mililitros)' },
  { value: 'l', label: 'l (litros)' },
  { value: 'unidades', label: 'unidades' },
]

export function RecipeIngredientsSection({
  ingredients,
  libraryIngredients,
  onChange,
}: {
  ingredients: Ingredient[]
  libraryIngredients: KitchenIngredient[]
  onChange: (updated: Ingredient[]) => void
}) {
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [activeLinkingIndex, setActiveLinkingIndex] = useState<number | null>(null)

  // Mapa rápido de insumos de la biblioteca
  const libMap = new Map<string, KitchenIngredient>()
  libraryIngredients.forEach((item) => libMap.set(item.id, item))

  // Detectar divergencias de precios con la biblioteca
  const priceDivergences: PriceDivergenceItem[] = []
  ingredients.forEach((ing, idx) => {
    if (ing.ingredient_id && libMap.has(ing.ingredient_id)) {
      const libItem = libMap.get(ing.ingredient_id)!
      const liveRes = calculateIngredientLiveCost(ing, libItem)
      const liveCost = liveRes.success ? liveRes.liveCost : (ing.calculated_cost ?? 0)
      const savedCost = ing.calculated_cost ?? 0

      // Si el precio de referencia guardado difiere del vigente en biblioteca
      if (Math.abs(libItem.current_price - ing.reference_price) >= 0.01) {
        priceDivergences.push({
          ingredientIndex: idx,
          ingredient: ing,
          libraryIngredient: libItem,
          savedReferencePrice: ing.reference_price,
          liveReferencePrice: libItem.current_price,
          savedCost,
          liveCost,
          difference: Number((liveCost - savedCost).toFixed(2)),
        })
      }
    }
  })

  // Agregar ingrediente libre
  const handleAddFree = () => {
    const newIng: Ingredient = {
      id: crypto.randomUUID(),
      name: '',
      quantity: 100,
      unit: 'g',
      reference_quantity: 1,
      reference_unit: 'kg',
      reference_price: 0,
      waste_percentage: 0,
    }
    onChange([...ingredients, newIng])
  }

  // Vincular insumo de biblioteca a una fila
  const handleSelectFromLibrary = (libItem: KitchenIngredient, targetIndex?: number) => {
    if (targetIndex !== undefined && targetIndex >= 0) {
      // Reemplazar / vincular fila existente
      const updated = [...ingredients]
      const current = updated[targetIndex]
      const liveRes = calculateIngredientLiveCost(current, libItem)

      updated[targetIndex] = {
        ...current,
        name: current.name.trim() || libItem.name,
        ingredient_id: libItem.id,
        reference_quantity: libItem.package_quantity,
        reference_unit: libItem.package_unit,
        reference_price: libItem.current_price,
        density: libItem.density_g_ml ?? current.density,
        calculated_cost: liveRes.success ? liveRes.liveCost : current.calculated_cost,
      }
      onChange(updated)
    } else {
      // Agregar como nueva fila
      const newIng: Ingredient = {
        id: crypto.randomUUID(),
        name: libItem.name,
        quantity: libItem.package_unit === 'kg' ? 100 : libItem.package_quantity,
        unit: libItem.package_unit === 'kg' ? 'g' : libItem.package_unit,
        reference_quantity: libItem.package_quantity,
        reference_unit: libItem.package_unit,
        reference_price: libItem.current_price,
        ingredient_id: libItem.id,
        density: libItem.density_g_ml ?? undefined,
        waste_percentage: 0,
      }
      const liveRes = calculateIngredientLiveCost(newIng, libItem)
      newIng.calculated_cost = liveRes.success ? liveRes.liveCost : 0
      onChange([...ingredients, newIng])
    }

    setIsLibraryModalOpen(false)
    setActiveLinkingIndex(null)
  }

  // Desvincular ingrediente (pasa a ser libre conservando datos)
  const handleUnlink = (index: number) => {
    const updated = [...ingredients]
    updated[index] = {
      ...updated[index],
      ingredient_id: null,
    }
    onChange(updated)
  }

  // Sincronizar precio individual con el vigente de la biblioteca
  const handleSyncSingle = (index: number) => {
    const updated = [...ingredients]
    const ing = updated[index]
    if (!ing.ingredient_id || !libMap.has(ing.ingredient_id)) return

    const libItem = libMap.get(ing.ingredient_id)!
    const liveRes = calculateIngredientLiveCost(ing, libItem)

    updated[index] = {
      ...ing,
      reference_quantity: libItem.package_quantity,
      reference_unit: libItem.package_unit,
      reference_price: libItem.current_price,
      density: libItem.density_g_ml ?? ing.density,
      calculated_cost: liveRes.success ? liveRes.liveCost : ing.calculated_cost,
    }
    onChange(updated)
  }

  // Sincronización masiva desde el modal
  const handleBatchSync = (indexes: number[]) => {
    const updated = [...ingredients]
    indexes.forEach((idx) => {
      const ing = updated[idx]
      if (ing?.ingredient_id && libMap.has(ing.ingredient_id)) {
        const libItem = libMap.get(ing.ingredient_id)!
        const liveRes = calculateIngredientLiveCost(ing, libItem)
        updated[idx] = {
          ...ing,
          reference_quantity: libItem.package_quantity,
          reference_unit: libItem.package_unit,
          reference_price: libItem.current_price,
          density: libItem.density_g_ml ?? ing.density,
          calculated_cost: liveRes.success ? liveRes.liveCost : ing.calculated_cost,
        }
      }
    })
    onChange(updated)
    setSyncModalOpen(false)
  }

  // Modificar campo en fila
  const handleRowChange = (index: number, patch: Partial<Ingredient>) => {
    const updated = [...ingredients]
    const current = { ...updated[index], ...patch }

    // Recalcular costo si cambian cantidades o precios
    const refQty = Number(current.reference_quantity) || 0
    const refPrice = Number(current.reference_price) || 0
    const qty = Number(current.quantity) || 0
    const waste = Number(current.waste_percentage) || 0

    if (refQty > 0 && refPrice > 0 && qty > 0) {
      const conv = convertUnits(refQty, current.reference_unit, current.unit, {
        density: current.density,
        pieceWeightGrams: current.pieceWeightGrams,
      })

      if (conv.success && conv.value > 0) {
        const grossQty = waste > 0 && waste < 100 ? qty / (1 - waste / 100) : qty
        current.calculated_cost = Number(((refPrice / conv.value) * grossQty).toFixed(4))
      } else {
        current.calculated_cost = 0
      }
    } else {
      current.calculated_cost = 0
    }

    updated[index] = current
    onChange(updated)
  }

  // Eliminar fila
  const handleRemove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  // Reordenar
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= ingredients.length) return
    const updated = [...ingredients]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    onChange(updated)
  }

  // Filtrado de insumos de biblioteca en el selector
  const filteredLibrary = libraryIngredients.filter((item) => {
    if (!librarySearch.trim()) return true
    const term = librarySearch.toLowerCase()
    return (
      item.name.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term))
    )
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Encabezado y acciones de barra */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Ingredientes y materias primas ({ingredients.length})
            </h2>
            {priceDivergences.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {priceDivergences.length} con variación de precio
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Podés usar insumos de tu biblioteca o cargar ingredientes libres con sus costos de compra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {priceDivergences.length > 0 && (
            <button
              type="button"
              onClick={() => setSyncModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-700" />
              <span>Actualizar precios ({priceDivergences.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveLinkingIndex(null)
              setIsLibraryModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-brand border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors min-h-[44px]"
          >
            <BookOpen className="h-4 w-4" />
            <span>Desde biblioteca</span>
          </button>

          <button
            type="button"
            onClick={handleAddFree}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-xs min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Ingrediente libre</span>
          </button>
        </div>
      </div>

      {/* Listado de filas de ingredientes */}
      {ingredients.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl my-3">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">
            No agregaste ningún ingrediente todavía
          </p>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Seleccioná un insumo de tu despensa para vincular su precio o creá una línea con valores directos.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsLibraryModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-purple-50 text-brand text-xs font-semibold hover:bg-purple-100"
            >
              Abrir biblioteca
            </button>
            <button
              type="button"
              onClick={handleAddFree}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
            >
              Agregar fila libre
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {ingredients.map((ing, idx) => {
            const isLinked = Boolean(ing.ingredient_id && libMap.has(ing.ingredient_id))
            const libItem = isLinked ? libMap.get(ing.ingredient_id!) : null

            // Comprobar error de conversión dimensional
            const conv = convertUnits(ing.reference_quantity, ing.reference_unit, ing.unit, {
              density: ing.density,
              pieceWeightGrams: ing.pieceWeightGrams,
            })
            const hasConversionError = !conv.success && ing.quantity > 0 && ing.reference_price > 0

            // Comprobar diferencia de precio si está vinculado
            const hasPriceDiff =
              isLinked &&
              libItem &&
              Math.abs(libItem.current_price - ing.reference_price) >= 0.01

            return (
              <div
                key={ing.id || idx}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  hasConversionError
                    ? 'border-red-300 bg-red-50/20'
                    : hasPriceDiff
                    ? 'border-amber-200 bg-amber-50/15'
                    : isLinked
                    ? 'border-purple-200/80 bg-purple-50/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Cabecera de la fila: Nombre, vinculación y acciones rápidas */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-slate-600 w-5">
                      #{idx + 1}
                    </span>

                    <input
                      type="text"
                      required
                      value={ing.name}
                      onChange={(e) => handleRowChange(idx, { name: e.target.value })}
                      placeholder="Nombre del ingrediente..."
                      className="font-bold text-sm text-slate-900 border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-brand focus:outline-none bg-transparent px-1 py-0.5 flex-1 min-w-[140px]"
                    />

                    {isLinked && libItem ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-brand">
                        <Link2 className="h-3 w-3" />
                        <span>Biblioteca: {libItem.package_quantity} {libItem.package_unit}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLinkingIndex(idx)
                          setIsLibraryModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-brand font-medium"
                      >
                        <Link2 className="h-3 w-3" />
                        <span>Vincular</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {isLinked && (
                      <button
                        type="button"
                        onClick={() => handleUnlink(idx)}
                        title="Desvincular de la biblioteca (conserva precio de referencia)"
                        className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                        aria-label="Desvincular ingrediente"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                      aria-label="Subir ingrediente"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === ingredients.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                      aria-label="Bajar ingrediente"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                      aria-label="Eliminar ingrediente de la receta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Grid de campos: Uso vs Compra vs Costo */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-3 text-xs">
                  {/* Cantidad de uso */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Uso en receta
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      required
                      value={ing.quantity || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleRowChange(idx, { quantity: isNaN(val) ? 0 : val })
                      }}
                      placeholder="500"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                    />
                  </div>

                  {/* Unidad de uso */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unidad
                    </label>
                    <select
                      value={ing.unit}
                      onChange={(e) => handleRowChange(idx, { unit: e.target.value as Unit })}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Merma del ingrediente crudo */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1" title="Porcentaje de descarte o merma del insumo crudo">
                      % Merma
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        step="any"
                        value={ing.waste_percentage ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          handleRowChange(idx, { waste_percentage: isNaN(val) ? 0 : val })
                        }}
                        placeholder="0"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px] pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Precio de compra de referencia */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Precio compra ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={ing.reference_price || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleRowChange(idx, { reference_price: isNaN(val) ? 0 : val })
                      }}
                      placeholder="1200"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                    />
                  </div>

                  {/* Presentación compra (cantidad + unidad) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Presentación
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        value={ing.reference_quantity || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          handleRowChange(idx, { reference_quantity: isNaN(val) ? 1 : val })
                        }}
                        className="w-full px-1.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                      />
                      <select
                        value={ing.reference_unit}
                        onChange={(e) => handleRowChange(idx, { reference_unit: e.target.value as Unit })}
                        className="w-full px-1 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Costo calculado en la receta */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-600 block">
                      Costo receta
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 block">
                      {hasConversionError ? 'Pendiente*' : formatCurrency(ing.calculated_cost ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Fila inferior de advertencias o variaciones de precio */}
                {(hasConversionError || hasPriceDiff || ing.density) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {hasConversionError && (
                      <div className="text-amber-800 flex items-center gap-1.5 text-[11px] font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {conv.message || 'Conversión incompatible. Requiere densidad (g/ml).'}
                        </span>
                      </div>
                    )}

                    {hasPriceDiff && libItem && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-900 text-[11px]">
                          Precio en biblioteca: <strong>{formatCurrency(libItem.current_price)}</strong> (guardado: {formatCurrency(ing.reference_price)})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(idx)}
                          className="px-2 py-1 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200 text-[11px] font-bold transition-colors"
                        >
                          Actualizar precio
                        </button>
                      </div>
                    )}

                    {/* Ajuste de densidad manual si la conversión masa-volumen lo requiere */}
                    {((ing.unit === 'g' || ing.unit === 'kg') && (ing.reference_unit === 'ml' || ing.reference_unit === 'l')) ||
                    ((ing.unit === 'ml' || ing.unit === 'l') && (ing.reference_unit === 'g' || ing.reference_unit === 'kg')) ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-700 ml-auto">
                        <Scale className="h-3 w-3 text-slate-600" />
                        <span>Densidad:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="5"
                          value={ing.density || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            handleRowChange(idx, { density: isNaN(val) ? undefined : val })
                          }}
                          placeholder="1.0"
                          className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-xs text-slate-900"
                        />
                        <span className="text-[10px] text-slate-600">g/ml</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de selección desde la biblioteca */}
      {isLibraryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Seleccionar ingrediente de tu biblioteca
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsLibraryModalOpen(false)
                  setActiveLinkingIndex(null)
                }}
                className="p-1 text-slate-600 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative my-3">
              <Search className="h-4 w-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Buscar por nombre, marca o categoría..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[40px]"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100 pr-1">
              {filteredLibrary.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-600">
                  No se encontraron insumos que coincidan con la búsqueda.
                </div>
              ) : (
                filteredLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectFromLibrary(item, activeLinkingIndex ?? undefined)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-brand">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {item.package_quantity} {item.package_unit} {item.brand ? `• ${item.brand}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-slate-900 block">
                        {formatCurrency(item.current_price)}
                      </span>
                      <span className="text-[10px] text-purple-700 font-semibold group-hover:underline">
                        Seleccionar
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de sincronización masiva */}
      <SyncLibraryPricesModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        divergences={priceDivergences}
        onConfirmSync={handleBatchSync}
      />
    </div>
  )
}
