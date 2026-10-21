'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, AlertCircle, HelpCircle, Loader2, Save } from 'lucide-react'
import { KitchenIngredient, CreateKitchenIngredientInput, UpdateKitchenIngredientInput } from '@/lib/gastronomia/types'
import { createKitchenIngredientServer, updateKitchenIngredientServer } from '@/app/actions/kitchen-ingredients'

export const INGREDIENT_CATEGORIES = [
  'Harinas y cereales',
  'Lácteos y derivados',
  'Huevos',
  'Materias grasas y aceites',
  'Azúcares y endulzantes',
  'Frutas y verduras',
  'Chocolates y cacaos',
  'Levaduras e impulsores',
  'Frutos secos y semillas',
  'Especias y condimentos',
  'Líquidos e infusiones',
  'Embalaje y descartables',
  'Otros insumos',
] as const

export const AVAILABLE_UNITS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'unidades', label: 'Unidades (un)' },
  { value: 'taza', label: 'Taza métrica (taza = 250 ml)' },
  { value: 'cucharada', label: 'Cucharada métrica (cda = 15 ml)' },
  { value: 'cucharadita', label: 'Cucharadita métrica (cdita = 5 ml)' },
]

export function IngredientFormModal({
  isOpen,
  onClose,
  ingredientToEdit,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  ingredientToEdit?: KitchenIngredient | null
  onSuccess: (saved: KitchenIngredient) => void
}) {
  const isEditing = !!ingredientToEdit

  // Estado del formulario
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [packageUnit, setPackageUnit] = useState<string>('kg')
  const [packageQuantity, setPackageQuantity] = useState<string>('1')
  const [currentPrice, setCurrentPrice] = useState<string>('')
  const [priceChangeReason, setPriceChangeReason] = useState<string>('')
  const [densityGml, setDensityGml] = useState<string>('')
  const [densitySource, setDensitySource] = useState<string>('')
  const [isFlour, setIsFlour] = useState<boolean>(false)
  const [isWater, setIsWater] = useState<boolean>(false)
  const [estimatedWaterPct, setEstimatedWaterPct] = useState<string>('')
  const [waterSource, setWaterSource] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Control de interfaz
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Cargar datos al abrir para edición
  useEffect(() => {
    if (ingredientToEdit) {
      setName(ingredientToEdit.name || '')
      setCategory(ingredientToEdit.category || '')
      setBrand(ingredientToEdit.brand || '')
      setPackageUnit(ingredientToEdit.package_unit || 'kg')
      setPackageQuantity(String(ingredientToEdit.package_quantity ?? '1'))
      setCurrentPrice(String(ingredientToEdit.current_price ?? ''))
      setPriceChangeReason('')
      setDensityGml(ingredientToEdit.density_g_ml ? String(ingredientToEdit.density_g_ml) : '')
      setDensitySource(ingredientToEdit.density_source || '')
      setIsFlour(!!ingredientToEdit.is_flour)
      setIsWater(!!ingredientToEdit.is_water)
      setEstimatedWaterPct(
        ingredientToEdit.estimated_water_percentage !== undefined && ingredientToEdit.estimated_water_percentage !== null
          ? String(ingredientToEdit.estimated_water_percentage)
          : ''
      )
      setWaterSource(ingredientToEdit.water_percentage_source || '')
      setNotes(ingredientToEdit.notes || '')
    } else {
      // Valores por defecto para nuevo
      setName('')
      setCategory('')
      setBrand('')
      setPackageUnit('kg')
      setPackageQuantity('1')
      setCurrentPrice('')
      setPriceChangeReason('')
      setDensityGml('')
      setDensitySource('')
      setIsFlour(false)
      setIsWater(false)
      setEstimatedWaterPct('')
      setWaterSource('')
      setNotes('')
    }
    setErrorMessage(null)
  }, [ingredientToEdit, isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validaciones del cliente
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('Ingresá el nombre del ingrediente.')
      return
    }

    const parsedQty = parseFloat(packageQuantity)
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('La cantidad de presentación debe ser un número positivo mayor a 0.')
      return
    }

    const parsedPrice = parseFloat(currentPrice)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('El precio de compra no puede ser negativo.')
      return
    }

    let parsedDensity: number | null = null
    if (densityGml.trim()) {
      const d = parseFloat(densityGml)
      if (isNaN(d) || d <= 0) {
        setErrorMessage('La densidad debe ser un número positivo en g/ml.')
        return
      }
      parsedDensity = d
    }

    let parsedWater: number | null = null
    if (estimatedWaterPct.trim()) {
      const w = parseFloat(estimatedWaterPct)
      if (isNaN(w) || w < 0 || w > 100) {
        setErrorMessage('El porcentaje de agua debe ser un valor entre 0 y 100%.')
        return
      }
      parsedWater = w
    }

    setIsSubmitting(true)

    try {
      if (isEditing && ingredientToEdit) {
        const updatePayload: UpdateKitchenIngredientInput = {
          name: trimmedName,
          category: category.trim() || null,
          brand: brand.trim() || null,
          package_unit: packageUnit as any,
          package_quantity: parsedQty,
          current_price: parsedPrice,
          priceChangeReason: priceChangeReason.trim() || undefined,
          density_g_ml: parsedDensity,
          density_source: densitySource.trim() || null,
          is_flour: isFlour,
          is_water: isWater,
          estimated_water_percentage: parsedWater,
          water_percentage_source: waterSource.trim() || null,
          notes: notes.trim() || null,
        }

        const res = await updateKitchenIngredientServer(ingredientToEdit.id, updatePayload)
        if (res.error || !res.data) {
          setErrorMessage(res.error || 'Error al actualizar el ingrediente.')
        } else {
          onSuccess(res.data)
          onClose()
        }
      } else {
        const createPayload: CreateKitchenIngredientInput = {
          name: trimmedName,
          category: category.trim() || null,
          brand: brand.trim() || null,
          package_unit: packageUnit as any,
          package_quantity: parsedQty,
          current_price: parsedPrice,
          density_g_ml: parsedDensity,
          density_source: densitySource.trim() || null,
          is_flour: isFlour,
          is_water: isWater,
          estimated_water_percentage: parsedWater,
          water_percentage_source: waterSource.trim() || null,
          notes: notes.trim() || null,
        }

        const res = await createKitchenIngredientServer(createPayload)
        if (res.error || !res.data) {
          setErrorMessage(res.error || 'Error al guardar el ingrediente.')
        } else {
          onSuccess(res.data)
          onClose()
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor. Reintentá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convención culinaria informada al seleccionar taza/cuchara
  const getUnitConventionNote = () => {
    if (packageUnit === 'taza') {
      return 'Convención métrica: 1 taza = 250 ml (estándar gastronómico latinoamericano).'
    }
    if (packageUnit === 'cucharada') {
      return 'Convención métrica: 1 cucharada sopera = 15 ml (3 cucharaditas).'
    }
    if (packageUnit === 'cucharadita') {
      return 'Convención métrica: 1 cucharadita de té = 5 ml.'
    }
    return null
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header del modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div>
              <h2 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? 'Editar ingrediente' : 'Nuevo ingrediente en la biblioteca'}
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                {isEditing
                  ? 'Modificá los datos de compra o actualizá el precio para registrar nuevo historial.'
                  : 'Registrá un insumo para costear recetas y mantener tus precios al día.'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Formulario con scroll vertical */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">No se pudo guardar el ingrediente</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Bloque 1: Datos principales */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Información básica
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="ing-name" className="block text-xs font-semibold text-slate-800 mb-1">
                    Nombre del ingrediente *
                  </label>
                  <input
                    id="ing-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Harina 000, Manteca, Azúcar común, Leche entera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="ing-category" className="block text-xs font-semibold text-slate-800 mb-1">
                    Categoría culinaria
                  </label>
                  <select
                    id="ing-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {INGREDIENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ing-brand" className="block text-xs font-semibold text-slate-800 mb-1">
                    Marca o proveedor (opcional)
                  </label>
                  <input
                    id="ing-brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. Chacabuco, La Serenísima, Distribuidora San Juan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Presentación de compra y precio vigente */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Presentación de compra y precio vigente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ing-qty" className="block text-xs font-semibold text-slate-800 mb-1">
                    Cantidad del envase *
                  </label>
                  <input
                    id="ing-qty"
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={packageQuantity}
                    onChange={(e) => setPackageQuantity(e.target.value)}
                    placeholder="Ej. 1, 5, 25, 500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="ing-unit" className="block text-xs font-semibold text-slate-800 mb-1">
                    Unidad de compra *
                  </label>
                  <select
                    id="ing-unit"
                    value={packageUnit}
                    onChange={(e) => setPackageUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  >
                    {AVAILABLE_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ing-price" className="block text-xs font-semibold text-slate-800 mb-1">
                    Precio total de compra ($) *
                  </label>
                  <input
                    id="ing-price"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>
              </div>

              {/* Mensaje de convención métrica cuando corresponda */}
              {getUnitConventionNote() && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{getUnitConventionNote()}</span>
                </div>
              )}

              {/* Si estamos editando y cambió el precio, pedir motivo opcional */}
              {isEditing && (
                <div>
                  <label htmlFor="ing-reason" className="block text-xs font-semibold text-slate-800 mb-1">
                    Motivo de actualización de precio (opcional)
                  </label>
                  <input
                    id="ing-reason"
                    type="text"
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    placeholder="Ej. Aumento de lista de proveedor, compra en mayorista"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    Si el precio se modifica, el sistema generará automáticamente un registro inmutable en el historial.
                  </span>
                </div>
              )}
            </div>

            {/* Bloque 3: Propiedades técnicas opcionales (densidad, agua, harina) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Propiedades técnicas gastronómicas (opcionales)
                </h3>
                <span className="text-[11px] text-slate-600">Para cálculos avanzados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ing-density" className="block text-xs font-semibold text-slate-800 mb-1">
                    Densidad culinaria (g/ml)
                  </label>
                  <input
                    id="ing-density"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={densityGml}
                    onChange={(e) => setDensityGml(e.target.value)}
                    placeholder="Ej. 1.03 (leche), 0.92 (aceite), 1.42 (miel)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    Permite conversiones exactas entre gramos y mililitros.
                  </span>
                </div>

                <div>
                  <label htmlFor="ing-density-source" className="block text-xs font-semibold text-slate-800 mb-1">
                    Fuente de la densidad
                  </label>
                  <input
                    id="ing-density-source"
                    type="text"
                    value={densitySource}
                    onChange={(e) => setDensitySource(e.target.value)}
                    placeholder="Ej. Ficha técnica de fabricante, medición propia"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>
              </div>

              {/* Clasificaciones booleanas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isFlour}
                    onChange={(e) => setIsFlour(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Es harina o almidón base</span>
                    <span className="text-[11px] text-slate-600 block">
                      Cuenta como 100% en fórmulas panaderas y de pastelería.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isWater}
                    onChange={(e) => setIsWater(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Es agua pura de amasado</span>
                    <span className="text-[11px] text-slate-600 block">
                      Aporta 100% de hidratación en masas y prefermentos.
                    </span>
                  </div>
                </label>
              </div>

              {/* Porcentaje de agua estimado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="ing-water-pct" className="block text-xs font-semibold text-slate-800 mb-1">
                    Porcentaje de agua estimado (%)
                  </label>
                  <input
                    id="ing-water-pct"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={estimatedWaterPct}
                    onChange={(e) => setEstimatedWaterPct(e.target.value)}
                    placeholder="Ej. 87.5 (leche), 75 (huevo entero), 16 (manteca)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="ing-water-src" className="block text-xs font-semibold text-slate-800 mb-1">
                    Fuente de información del agua
                  </label>
                  <input
                    id="ing-water-src"
                    type="text"
                    value={waterSource}
                    onChange={(e) => setWaterSource(e.target.value)}
                    placeholder="Ej. Tabla de composición de alimentos / USDA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bloque 4: Notas */}
            <div className="pt-4 border-t border-slate-100">
              <label htmlFor="ing-notes" className="block text-xs font-semibold text-slate-800 mb-1">
                Notas culinarias o de almacenamiento (opcional)
              </label>
              <textarea
                id="ing-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Guardar en lugar fresco y seco, W300 para fermentación larga, tamizar antes de usar..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors resize-none"
              />
            </div>

            {/* Footer con acciones */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-tactile px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors min-h-[44px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEditing ? 'Actualizar ingrediente' : 'Guardar ingrediente'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
