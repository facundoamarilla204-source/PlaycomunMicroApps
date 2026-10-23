'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Truck,
  Calendar,
  Save,
  Package,
} from 'lucide-react'
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  KitchenIngredient,
  SupplierIngredient,
} from '@/lib/gastronomia/types'
import { savePurchaseOrderServer } from '@/app/actions/purchase-orders'

interface PurchaseOrderEditorProps {
  initialOrder?: PurchaseOrder | null
  suppliers: Supplier[]
  ingredients: KitchenIngredient[]
  supplierIngredientsMap: Record<string, SupplierIngredient[]>
  prefillSupplierId?: string
  prefillPlanId?: string
  prefillItems?: Array<{
    ingredient_id: string
    ingredient_name: string
    ordered_quantity: number
    package_size: number
    package_unit: string
    unit_price: number
  }>
}

interface EditableItem {
  id?: string
  ingredient_id: string
  ingredient_name: string
  ordered_quantity: number
  package_size: number
  package_unit: string
  unit_price: number
  total_price: number
  notes?: string
}

export function PurchaseOrderEditor({
  initialOrder,
  suppliers,
  ingredients,
  supplierIngredientsMap,
  prefillSupplierId,
  prefillPlanId,
  prefillItems,
}: PurchaseOrderEditorProps) {
  const router = useRouter()

  const [supplierId, setSupplierId] = useState<string>(
    initialOrder?.supplier_id || prefillSupplierId || ''
  )
  const [supplierName, setSupplierName] = useState<string>(
    initialOrder?.supplier_name || ''
  )
  const [status, setStatus] = useState<PurchaseOrder['status']>(
    initialOrder?.status || 'draft'
  )
  const [issueDate, setIssueDate] = useState<string>(
    initialOrder?.issue_date || new Date().toISOString().slice(0, 10)
  )
  const [expectedDate, setExpectedDate] = useState<string>(
    initialOrder?.expected_delivery_date || ''
  )
  const [shippingCost, setShippingCost] = useState<number>(
    initialOrder?.shipping_cost || 0
  )
  const [taxesAmount, setTaxesAmount] = useState<number>(
    initialOrder?.taxes_amount || 0
  )
  const [discountAmount, setDiscountAmount] = useState<number>(
    initialOrder?.discount_amount || 0
  )
  const [notes, setNotes] = useState<string>(initialOrder?.notes || '')

  // Items
  const [items, setItems] = useState<EditableItem[]>(() => {
    if (initialOrder?.items && initialOrder.items.length > 0) {
      return initialOrder.items.map((it) => ({
        id: it.id,
        ingredient_id: it.ingredient_id || '',
        ingredient_name: it.ingredient_name,
        ordered_quantity: it.ordered_quantity,
        package_size: it.package_size,
        package_unit: it.package_unit,
        unit_price: it.unit_price,
        total_price: it.total_price,
        notes: it.notes || '',
      }))
    }
    if (prefillItems && prefillItems.length > 0) {
      return prefillItems.map((pi) => ({
        ingredient_id: pi.ingredient_id,
        ingredient_name: pi.ingredient_name,
        ordered_quantity: pi.ordered_quantity,
        package_size: pi.package_size,
        package_unit: pi.package_unit,
        unit_price: pi.unit_price,
        total_price: Math.round(pi.ordered_quantity * pi.unit_price * 100) / 100,
      }))
    }
    return [
      {
        ingredient_id: '',
        ingredient_name: '',
        ordered_quantity: 1,
        package_size: 1,
        package_unit: 'kg',
        unit_price: 0,
        total_price: 0,
      },
    ]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cuando cambia el proveedor seleccionado en el dropdown
  const handleSupplierChange = (id: string) => {
    setSupplierId(id)
    const sup = suppliers.find((s) => s.id === id)
    if (sup) {
      setSupplierName(sup.name)
    }
  }

  // Si cambia el insumo de una fila, autocompletar presentación del proveedor
  const handleIngredientChange = (index: number, ingId: string) => {
    const ing = ingredients.find((i) => i.id === ingId)
    if (!ing) return

    setItems((prev) => {
      const next = [...prev]
      let pkgSize = Number(ing.package_quantity) || 1
      let pkgUnit: string = (ing.package_unit as string) || 'kg'
      let unitPrice = Number(ing.current_price) || 0

      // Si el proveedor actual tiene una presentación específica
      if (supplierId && supplierIngredientsMap[ingId]) {
        const vendorPres = supplierIngredientsMap[ingId].find(
          (vi) => vi.supplier_id === supplierId
        )
        if (vendorPres) {
          pkgSize = Number(vendorPres.package_size) || pkgSize
          pkgUnit = vendorPres.package_unit || pkgUnit
          unitPrice = Number(vendorPres.price) || unitPrice
        }
      }

      next[index] = {
        ...next[index],
        ingredient_id: ingId,
        ingredient_name: ing.name,
        package_size: pkgSize,
        package_unit: pkgUnit,
        unit_price: unitPrice,
        total_price: Math.round(next[index].ordered_quantity * unitPrice * 100) / 100,
      }
      return next
    })
  }

  const updateItem = (index: number, updates: Partial<EditableItem>) => {
    setItems((prev) => {
      const next = [...prev]
      const current = next[index]
      const updated = { ...current, ...updates }
      updated.total_price =
        Math.round(updated.ordered_quantity * updated.unit_price * 100) / 100
      next[index] = updated
      return next
    })
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        ingredient_id: '',
        ingredient_name: '',
        ordered_quantity: 1,
        package_size: 1,
        package_unit: 'kg',
        unit_price: 0,
        total_price: 0,
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Cálculos de totales
  const subtotal = items.reduce((acc, it) => acc + (it.total_price || 0), 0)
  const grandTotal = Math.max(
    0,
    Math.round((subtotal + shippingCost + taxesAmount - discountAmount) * 100) / 100
  )

  const handleSubmit = async (targetStatus?: PurchaseOrder['status']) => {
    const finalSupplierName = supplierName.trim()
    if (!finalSupplierName) {
      setError('Debes ingresar o seleccionar el proveedor de la compra.')
      return
    }

    const validItems = items.filter((it) => it.ingredient_name.trim() !== '')
    if (validItems.length === 0) {
      setError('Debes agregar al menos un insumo en la orden de compra.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const res = await savePurchaseOrderServer(
      {
        id: initialOrder?.id,
        order_number: initialOrder?.order_number,
        supplier_id: supplierId || null,
        supplier_name: finalSupplierName,
        status: targetStatus || status,
        issue_date: issueDate,
        expected_delivery_date: expectedDate || null,
        shipping_cost: shippingCost,
        taxes_amount: taxesAmount,
        discount_amount: discountAmount,
        notes: notes.trim() || null,
        origin_plan_id: initialOrder?.origin_plan_id || prefillPlanId || null,
      },
      validItems.map((it) => ({
        id: it.id,
        ingredient_id: it.ingredient_id || null,
        ingredient_name: it.ingredient_name,
        ordered_quantity: it.ordered_quantity,
        package_size: it.package_size,
        package_unit: it.package_unit,
        unit_price: it.unit_price,
        notes: it.notes || null,
      }))
    )

    setIsSubmitting(false)

    if (res.error || !res.data) {
      setError(res.error || 'Error al guardar la orden de compra.')
    } else {
      router.push('/cocina-pro/compras')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Barra de Navegación Superior */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/cocina-pro/compras"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a órdenes de compra</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs min-h-[44px]"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span>Guardar borrador</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('confirmed')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
          >
            <Check className="h-4 w-4" />
            <span>Confirmar orden</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Encabezado y Datos de la Orden */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-slate-900">
              {initialOrder ? `Orden ${initialOrder.order_number}` : 'Nueva orden de compra'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {initialOrder ? initialOrder.status : 'Borrador editable'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Proveedor registrado
            </label>
            <select
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            >
              <option value="">Seleccionar proveedor registrado...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.contact_name ? `(${s.contact_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nombre comercial del proveedor *
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej. Distribuidora Gastronómica"
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fecha de emisión
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fecha estimada de entrega (opcional)
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notas u observaciones de compra
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Factura A, horario de descarga de 8 a 11 hs."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Ítems */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Insumos y mercadería solicitada
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Indicá envases a adquirir, tamaño de presentación y precio cotizado por bulto.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors min-h-[36px]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Añadir línea</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 min-w-[220px]">Insumo</th>
                <th className="py-3 px-3 w-24 text-right">Cant. Envases</th>
                <th className="py-3 px-3 w-32">Presentación</th>
                <th className="py-3 px-3 w-28 text-right">Precio bulto ($)</th>
                <th className="py-3 px-3 w-28 text-right">Total línea ($)</th>
                <th className="py-3 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4">
                    <div className="space-y-1">
                      <select
                        value={item.ingredient_id}
                        onChange={(e) => handleIngredientChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs min-h-[36px]"
                      >
                        <option value="">Seleccionar insumo de biblioteca...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.package_unit})
                          </option>
                        ))}
                      </select>
                      {!item.ingredient_id && (
                        <input
                          type="text"
                          value={item.ingredient_name}
                          onChange={(e) => updateItem(idx, { ingredient_name: e.target.value })}
                          placeholder="O escribir nombre de insumo libre..."
                          className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs bg-slate-50"
                        />
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={item.ordered_quantity}
                      onChange={(e) =>
                        updateItem(idx, { ordered_quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-right min-h-[36px]"
                    />
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={item.package_size}
                        onChange={(e) =>
                          updateItem(idx, { package_size: parseFloat(e.target.value) || 1 })
                        }
                        className="w-14 px-1.5 py-1.5 rounded-lg border border-slate-200 font-mono text-right min-h-[36px]"
                        title="Tamaño por bulto"
                      />
                      <input
                        type="text"
                        value={item.package_unit}
                        onChange={(e) => updateItem(idx, { package_unit: e.target.value })}
                        className="w-12 px-1.5 py-1.5 rounded-lg border border-slate-200 text-center min-h-[36px]"
                        title="Unidad del bulto"
                      />
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-right min-h-[36px]"
                    />
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                    ${Number(item.total_price).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desglose Financiero */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row justify-between gap-6">
          <div className="text-xs text-slate-500 max-w-sm">
            <p className="leading-relaxed">
              El stock se actualizará únicamente al registrar la recepción de la mercadería. Confirmar o crear la orden no altera el inventario disponible.
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal productos:</span>
              <span className="font-mono font-bold">
                ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Flete / Envío:</span>
              <input
                type="number"
                step="any"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-right"
              />
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Impuestos / IVA:</span>
              <input
                type="number"
                step="any"
                min="0"
                value={taxesAmount}
                onChange={(e) => setTaxesAmount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-right"
              />
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Descuentos:</span>
              <input
                type="number"
                step="any"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-right"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Total de la orden:</span>
              <span className="font-mono text-brand">
                ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
