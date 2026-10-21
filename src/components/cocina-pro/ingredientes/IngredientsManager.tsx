'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Plus,
  Layers,
  History,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  X,
  PackageOpen,
  Droplet,
  Wheat,
} from 'lucide-react'
import { KitchenIngredient } from '@/lib/gastronomia/types'
import { IngredientFormModal, INGREDIENT_CATEGORIES } from './IngredientFormModal'
import { PriceHistoryModal } from './PriceHistoryModal'
import { DeleteIngredientModal } from './DeleteIngredientModal'

export function IngredientsManager({
  initialIngredients,
}: {
  initialIngredients: KitchenIngredient[]
}) {
  const searchParams = useSearchParams()

  const [ingredients, setIngredients] = useState<KitchenIngredient[]>(initialIngredients)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Control de modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [ingredientToEdit, setIngredientToEdit] = useState<KitchenIngredient | null>(null)

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [ingredientForHistory, setIngredientForHistory] = useState<KitchenIngredient | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<KitchenIngredient | null>(null)

  // Mensaje de éxito temporal
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto-abrir modal si la URL trae ?action=nuevo o ?id=...
  useEffect(() => {
    const action = searchParams.get('action')
    const idParam = searchParams.get('id')

    if (action === 'nuevo') {
      setIngredientToEdit(null)
      setIsFormOpen(true)
    } else if (idParam) {
      const match = ingredients.find((i) => i.id === idParam)
      if (match) {
        setIngredientForHistory(match)
        setIsHistoryOpen(true)
      }
    }
  }, [searchParams, ingredients])

  // Mostrar toast durante 4 segundos
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Filtrado de ingredientes
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch =
        search.trim() === '' ||
        ing.name.toLowerCase().includes(search.toLowerCase()) ||
        (ing.brand && ing.brand.toLowerCase().includes(search.toLowerCase()))

      const matchesCategory =
        !selectedCategory || ing.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [ingredients, search, selectedCategory])

  // Callbacks de éxito
  const handleSavedIngredient = (saved: KitchenIngredient) => {
    setIngredients((prev) => {
      const exists = prev.some((i) => i.id === saved.id)
      if (exists) {
        return prev.map((i) => (i.id === saved.id ? saved : i))
      }
      return [saved, ...prev]
    })
    showToast(
      ingredientToEdit
        ? `Ingrediente "${saved.name}" actualizado correctamente.`
        : `Ingrediente "${saved.name}" registrado en la biblioteca.`
    )
  }

  const handleDeletedIngredient = (deletedId: string) => {
    const deleted = ingredients.find((i) => i.id === deletedId)
    setIngredients((prev) => prev.filter((i) => i.id !== deletedId))
    showToast(
      deleted
        ? `Ingrediente "${deleted.name}" eliminado de la biblioteca.`
        : 'Ingrediente eliminado.'
    )
  }

  // Helper para costo unitario estándar (ej. $/kg o $/l)
  const getUnitCostDisplay = (ing: KitchenIngredient) => {
    const qty = Number(ing.package_quantity)
    const price = Number(ing.current_price)
    if (!qty || qty <= 0) return '-'
    const unitCost = price / qty
    return `$${unitCost.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} / ${ing.package_unit}`
  }

  return (
    <div className="space-y-6">
      {/* Toast de confirmación accesible */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado con título y botón de acción principal */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Biblioteca de insumos
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Biblioteca personal de ingredientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-xl">
            Registrá tus insumos con sus presentaciones de compra, mantené precios actualizados y consultá su historial inmutable.
          </p>
        </div>

        <button
          onClick={() => {
            setIngredientToEdit(null)
            setIsFormOpen(true)
          }}
          className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px] cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo ingrediente</span>
        </button>
      </div>

      {/* Barra de herramientas: Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de ingrediente o marca..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-900 rounded"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selector de categoría para mobile o pantalla estrecha */}
          <div className="sm:w-56 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías ({ingredients.length})</option>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Píldoras de categorías para desktop rápido */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              !selectedCategory
                ? 'bg-purple-100 text-brand'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Todas ({ingredients.length})
          </button>
          {INGREDIENT_CATEGORIES.map((cat) => {
            const count = ingredients.filter((i) => i.category === cat).length
            if (count === 0 && selectedCategory !== cat) return null
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-purple-100 text-brand'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido: Lista o Tabla */}
      {ingredients.length === 0 ? (
        /* Estado vacío general de la biblioteca */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
          <div className="h-12 w-12 rounded-2xl bg-purple-100 text-brand flex items-center justify-center mx-auto mb-3">
            <PackageOpen className="h-6 w-6 text-brand" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Tu biblioteca de ingredientes está lista para comenzar
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
            Registrá tus insumos habituales (harinas, lácteos, azúcares, chocolates). Cada vez que compres con un nuevo precio, la biblioteca actualizará tus recetas vinculadas conservando el historial.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setIngredientToEdit(null)
                setIsFormOpen(true)
              }}
              className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover transition-colors shadow-xs cursor-pointer min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar primer ingrediente</span>
            </button>
          </div>
        </div>
      ) : filteredIngredients.length === 0 ? (
        /* Estado vacío por filtro sin resultados */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-8">
          <Filter className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            No se encontraron ingredientes
          </h3>
          <p className="text-xs text-slate-700 mt-1">
            Probá ajustando el término de búsqueda o seleccioná otra categoría.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setSelectedCategory('')
            }}
            className="mt-4 px-3.5 py-2 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        /* Listado de ingredientes */
        <div className="space-y-4">
          {/* Vista Desktop: Tabla estructurada */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-4">Ingrediente</th>
                  <th className="py-3.5 px-3">Categoría</th>
                  <th className="py-3.5 px-3">Envase</th>
                  <th className="py-3.5 px-3 text-right">Precio de compra</th>
                  <th className="py-3.5 px-3 text-right">Costo unitario</th>
                  <th className="py-3.5 px-3 text-center">Propiedades</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredIngredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nombre y Marca */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {ing.name}
                      </div>
                      {ing.brand && (
                        <div className="text-[11px] text-slate-700 mt-0.5">
                          Marca: {ing.brand}
                        </div>
                      )}
                      {ing.notes && (
                        <div className="text-[11px] text-slate-600 italic line-clamp-1 mt-0.5" title={ing.notes}>
                          {ing.notes}
                        </div>
                      )}
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium">
                        {ing.category || 'General'}
                      </span>
                    </td>

                    {/* Envase */}
                    <td className="py-3.5 px-3 text-slate-700">
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {ing.package_quantity}
                      </span>{' '}
                      {ing.package_unit}
                    </td>

                    {/* Precio de compra */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-extrabold text-slate-900 text-sm tabular-nums">
                        ${Number(ing.current_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-600 tabular-nums">
                        {new Date(ing.price_updated_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                    </td>

                    {/* Costo unitario */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                      {getUnitCostDisplay(ing)}
                    </td>

                    {/* Propiedades técnicas */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {ing.is_flour && (
                          <span
                            title="Harina base para panadería"
                            className="p-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold"
                          >
                            <Wheat className="h-3 w-3 inline" /> Harina
                          </span>
                        )}
                        {ing.is_water && (
                          <span
                            title="Agua de amasado"
                            className="p-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold"
                          >
                            <Droplet className="h-3 w-3 inline" /> Agua
                          </span>
                        )}
                        {ing.density_g_ml && (
                          <span
                            title={`Densidad: ${ing.density_g_ml} g/ml`}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold tabular-nums"
                          >
                            {ing.density_g_ml} g/ml
                          </span>
                        )}
                        {!ing.is_flour && !ing.is_water && !ing.density_g_ml && (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setIngredientForHistory(ing)
                            setIsHistoryOpen(true)
                          }}
                          title="Consultar historial de precios"
                          className="btn-tactile p-2 text-slate-700 hover:text-brand hover:bg-purple-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          aria-label={`Historial de ${ing.name}`}
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIngredientToEdit(ing)
                            setIsFormOpen(true)
                          }}
                          title="Editar ingrediente"
                          className="btn-tactile p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          aria-label={`Editar ${ing.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIngredientToDelete(ing)
                            setIsDeleteOpen(true)
                          }}
                          title="Eliminar ingrediente"
                          className="btn-tactile p-2 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          aria-label={`Eliminar ${ing.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile: Tarjetas táctiles individuales con targets >= 44-48px */}
          <div className="md:hidden space-y-3">
            {filteredIngredients.map((ing) => (
              <div
                key={ing.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {ing.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-medium">
                        {ing.category || 'General'}
                      </span>
                      {ing.brand && (
                        <span className="text-[11px] text-slate-700">
                          {ing.brand}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">
                      ${Number(ing.current_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-slate-700 block tabular-nums">
                      por {ing.package_quantity} {ing.package_unit}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                  <span className="tabular-nums">Costo base: <strong>{getUnitCostDisplay(ing)}</strong></span>
                  <span className="text-[10px] text-slate-600 tabular-nums">
                    Actualizado: {new Date(ing.price_updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>

                {/* Botones de acción táctiles para pulgar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIngredientForHistory(ing)
                      setIsHistoryOpen(true)
                    }}
                    className="btn-tactile flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-purple-50 text-brand text-xs font-semibold hover:bg-purple-100 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <History className="h-4 w-4" />
                    <span>Historial</span>
                  </button>

                  <button
                    onClick={() => {
                      setIngredientToEdit(ing)
                      setIsFormOpen(true)
                    }}
                    className="btn-tactile flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => {
                      setIngredientToDelete(ing)
                      setIsDeleteOpen(true)
                    }}
                    className="btn-tactile flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modales modulares reutilizables */}
      <IngredientFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setIngredientToEdit(null)
        }}
        ingredientToEdit={ingredientToEdit}
        onSuccess={handleSavedIngredient}
      />

      <PriceHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false)
          setIngredientForHistory(null)
        }}
        ingredient={ingredientForHistory}
      />

      <DeleteIngredientModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setIngredientToDelete(null)
        }}
        ingredient={ingredientToDelete}
        onSuccess={handleDeletedIngredient}
      />
    </div>
  )
}
