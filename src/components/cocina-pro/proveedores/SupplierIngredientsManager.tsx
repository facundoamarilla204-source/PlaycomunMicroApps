'use client'

import { useEffect, useState } from 'react'
import {
  X,
  Layers,
  Plus,
  Trash2,
  Check,
  Star,
  AlertCircle,
  RefreshCw,
  Package,
} from 'lucide-react'
import type { Supplier, SupplierIngredient, KitchenIngredient } from '@/lib/gastronomia/types'
import {
  getSupplierByIdServer,
  saveSupplierIngredientServer,
  deleteSupplierIngredientServer,
} from '@/app/actions/suppliers'
import { getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'

interface SupplierIngredientsManagerProps {
  supplier: Supplier
  onClose: () => void
  onUpdated: (count: number) => void
}

export function SupplierIngredientsManager({
  supplier,
  onClose,
  onUpdated,
}: SupplierIngredientsManagerProps) {
  const [presentations, setPresentations] = useState<SupplierIngredient[]>([])
  const [allIngredients, setAllIngredients] = useState<KitchenIngredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulario nuevo insumo
  const [isAdding, setIsAdding] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [packageSize, setPackageSize] = useState('1')
  const [packageUnit, setPackageUnit] = useState('kg')
  const [price, setPrice] = useState('0')
  const [supplierCode, setSupplierCode] = useState('')
  const [isPreferred, setIsPreferred] = useState(true)
  const [notes, setNotes] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      const [supplierRes, ingredientsRes] = await Promise.all([
        getSupplierByIdServer(supplier.id),
        getKitchenIngredientsServer(),
      ])

      if (mounted) {
        if (supplierRes.data) {
          setPresentations(supplierRes.data.ingredients || [])
        }
        if (ingredientsRes.data) {
          setAllIngredients(ingredientsRes.data || [])
        }
        setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [supplier.id])

  const handleSelectIngredient = (ingId: string) => {
    setSelectedIngredientId(ingId)
    const ing = allIngredients.find((i) => i.id === ingId)
    if (ing) {
      setPackageSize(ing.package_quantity ? ing.package_quantity.toString() : '1')
      setPackageUnit(ing.package_unit || 'kg')
      setPrice(ing.current_price ? ing.current_price.toString() : '0')
    }
  }

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIngredientId) {
      setError('Debes seleccionar un insumo de tu biblioteca.')
      return
    }

    const size = parseFloat(packageSize)
    const p = parseFloat(price)

    if (isNaN(size) || size <= 0) {
      setError('El tamaño de presentación debe ser un número mayor a cero.')
      return
    }

    if (isNaN(p) || p < 0) {
      setError('El precio debe ser mayor o igual a cero.')
      return
    }

    setSubmittingForm(true)
    setError(null)

    const res = await saveSupplierIngredientServer({
      supplier_id: supplier.id,
      ingredient_id: selectedIngredientId,
      package_size: size,
      package_unit: packageUnit.trim(),
      price: p,
      supplier_code: supplierCode.trim() || null,
      notes: notes.trim() || null,
      is_preferred: isPreferred,
    })

    setSubmittingForm(false)

    if (res.error || !res.data) {
      setError(res.error || 'Error al asociar presentación.')
    } else {
      const ing = allIngredients.find((i) => i.id === selectedIngredientId)
      const newPres: SupplierIngredient = {
        ...res.data,
        ingredient: ing,
      }

      setPresentations((prev) => [newPres, ...prev])
      onUpdated(presentations.length + 1)
      setIsAdding(false)
      setSelectedIngredientId('')
      setPackageSize('1')
      setPrice('0')
      setSupplierCode('')
      setNotes('')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteSupplierIngredientServer(id)
    if (!res.error) {
      setPresentations((prev) => prev.filter((p) => p.id !== id))
      onUpdated(Math.max(0, presentations.length - 1))
    } else {
      alert(res.error)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-supplier-ingredients-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[calc(100vh-2rem)] shadow-xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3
                id="modal-supplier-ingredients-title"
                className="text-sm font-bold text-slate-900"
              >
                Insumos y presentaciones comerciales
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[320px]">
                {supplier.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón para desplegar formulario */}
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-brand rounded-xl text-xs font-semibold text-slate-700 hover:text-brand flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              <span>Asociar nueva presentación o insumo comercial</span>
            </button>
          )}

          {/* Formulario de agregar presentación */}
          {isAdding && (
            <form
              onSubmit={handleSaveIngredient}
              className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/40 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="font-bold text-slate-900">
                  Nueva presentación de proveedor
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Insumo de tu biblioteca *
                </label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => handleSelectIngredient(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[40px]"
                >
                  <option value="">Seleccionar insumo...</option>
                  {allIngredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tamaño bulto *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={packageSize}
                    onChange={(e) => setPackageSize(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono min-h-[40px]"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unidad *
                  </label>
                  <input
                    type="text"
                    value={packageUnit}
                    onChange={(e) => setPackageUnit(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white min-h-[40px]"
                    placeholder="kg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Precio bulto ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono min-h-[40px]"
                    placeholder="12500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    value={supplierCode}
                    onChange={(e) => setSupplierCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white min-h-[40px]"
                    placeholder="HAR-005"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="pref-check"
                  type="checkbox"
                  checked={isPreferred}
                  onChange={(e) => setIsPreferred(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <label
                  htmlFor="pref-check"
                  className="text-xs text-slate-700 cursor-pointer select-none font-medium"
                >
                  Marcar como proveedor y presentación preferida para este insumo
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingForm || !selectedIngredientId}
                  className="px-3.5 py-1.5 rounded-lg bg-brand text-white font-bold hover:bg-brand-hover shadow-2xs transition-colors"
                >
                  {submittingForm ? 'Guardando...' : 'Asociar presentación'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de presentaciones existentes */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
              <span>Cargando insumos asociados...</span>
            </div>
          ) : presentations.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">
                Aún no hay insumos asociados
              </p>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                Asociá materias primas para conocer qué paquetes y precios ofrece este proveedor.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
              {presentations.map((p) => {
                const ingName = p.ingredient?.name || 'Insumo'
                const unitPrice =
                  p.package_size > 0 ? p.price / p.package_size : 0

                return (
                  <div
                    key={p.id}
                    className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {ingName}
                        </span>
                        {p.is_preferred && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            <span>Preferido</span>
                          </span>
                        )}
                        {p.supplier_code && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                            {p.supplier_code}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>
                          Presentación: {p.package_size} {p.package_unit}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          Equiv. ${unitPrice.toFixed(2)} / {p.package_unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ${Number(p.price).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          x envase
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Eliminar asociación"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/75 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {presentations.length} presentación(es) configurada(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg min-h-[36px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
