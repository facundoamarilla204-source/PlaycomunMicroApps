'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  DollarSign,
  ArrowLeft,
  Loader2,
  BookOpen,
  Info,
  Check,
  AlertCircle,
  Percent,
} from 'lucide-react'
import {
  KitchenClient,
  KitchenOrder,
  KitchenOrderStatus,
  SaveKitchenOrderInput,
} from '@/lib/gastronomia/types'
import { Recipe } from '@/lib/costo-receta'
import { calculateOrderFinancials } from '@/lib/gastronomia/orders'
import { saveKitchenOrderServer } from '@/app/actions/kitchen-orders'
import { ClientModal } from '../clientes/ClientModal'

interface OrderEditorLine {
  id?: string
  recipe_id?: string | null
  product_name: string
  quantity: number
  unit: string
  unit_price: number
  reference_cost_per_unit?: number | null
  reference_total_cost?: number | null
  notes?: string
}

interface OrderEditorProps {
  initialOrder?: KitchenOrder | null
  clients: KitchenClient[]
  recipes: Recipe[]
  preselectedClientId?: string
}

export function OrderEditor({
  initialOrder,
  clients: initialClientsList,
  recipes,
  preselectedClientId,
}: OrderEditorProps) {
  const router = useRouter()

  // Clientes
  const [clients, setClients] = useState<KitchenClient[]>(initialClientsList)
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialOrder?.client_id || preselectedClientId || ''
  )
  const [isOccasionalClient, setIsOccasionalClient] = useState<boolean>(
    !initialOrder?.client_id && !preselectedClientId
  )
  const [clientNameSnapshot, setClientNameSnapshot] = useState<string>(
    initialOrder?.client_name_snapshot || ''
  )
  const [clientContactSnapshot, setClientContactSnapshot] = useState<string>(
    initialOrder?.client_contact_snapshot || ''
  )
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  // Fechas y estado
  const [orderDate, setOrderDate] = useState<string>(
    initialOrder?.order_date || new Date().toISOString().split('T')[0]
  )
  const [deliveryDate, setDeliveryDate] = useState<string>(
    initialOrder?.delivery_date || ''
  )
  const [deliveryTime, setDeliveryTime] = useState<string>(
    initialOrder?.delivery_time || ''
  )
  const [status, setStatus] = useState<KitchenOrderStatus>(
    initialOrder?.status || 'recibido'
  )
  const [notes, setNotes] = useState<string>(initialOrder?.notes || '')

  // Ajustes financieros
  const [discountAmount, setDiscountAmount] = useState<number>(
    initialOrder?.discount_amount || 0
  )
  const [deliveryFee, setDeliveryFee] = useState<number>(
    initialOrder?.delivery_fee || 0
  )
  const [depositAmount, setDepositAmount] = useState<number>(
    initialOrder?.deposit_amount || 0
  )

  // Líneas del pedido
  const [lines, setLines] = useState<OrderEditorLine[]>(() => {
    if (initialOrder?.items && initialOrder.items.length > 0) {
      return initialOrder.items.map((it) => ({
        id: it.id,
        recipe_id: it.recipe_id,
        product_name: it.product_name,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        reference_cost_per_unit: it.reference_cost_per_unit,
        reference_total_cost: it.reference_total_cost,
        notes: it.notes || '',
      }))
    }
    return [
      {
        product_name: '',
        quantity: 1,
        unit: 'unidades',
        unit_price: 0,
        notes: '',
      },
    ]
  })

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Si seleccionamos un cliente registrado, actualizar snapshots automáticamente
  useEffect(() => {
    if (selectedClientId) {
      const found = clients.find((c) => c.id === selectedClientId)
      if (found) {
        setClientNameSnapshot(found.name)
        const contactParts = [found.phone, found.email].filter(Boolean).join(' · ')
        setClientContactSnapshot(contactParts)
        setIsOccasionalClient(false)
      }
    }
  }, [selectedClientId, clients])

  // Cálculo financiero en vivo
  const financials = useMemo(() => {
    return calculateOrderFinancials({
      items: lines.map((l) => ({
        quantity: l.quantity,
        unit_price: l.unit_price,
        reference_cost_per_unit: l.reference_cost_per_unit,
      })),
      discountAmount,
      deliveryFee,
      depositAmount,
    })
  }, [lines, discountAmount, deliveryFee, depositAmount])

  // Modificar línea de producto
  const handleUpdateLine = (index: number, updates: Partial<OrderEditorLine>) => {
    setLines((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...updates }
      return copy
    })
  }

  // Asignar receta a una línea
  const handleSelectRecipe = (index: number, recipeId: string) => {
    if (!recipeId) {
      handleUpdateLine(index, {
        recipe_id: null,
        reference_cost_per_unit: null,
      })
      return
    }

    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    // Calcular costo unitario de referencia de la receta
    const recipeIngredientsCost = (recipe.ingredients || []).reduce(
      (sum, ing) => sum + (Number(ing.calculated_cost) || 0),
      0
    )
    const recipeAdditionalCost = (recipe.additional_costs || []).reduce(
      (sum, add) => sum + (Number(add.amount) || 0),
      0
    )
    const totalRecipeCost = recipeIngredientsCost + recipeAdditionalCost
    const yieldQty = Math.max(1, Number(recipe.yield_quantity) || 1)
    const costPerUnit = Math.round((totalRecipeCost / yieldQty) * 100) / 100

    handleUpdateLine(index, {
      recipe_id: recipe.id,
      product_name: recipe.name,
      unit: recipe.yield_unit || 'unidades',
      reference_cost_per_unit: costPerUnit,
    })
  }

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        product_name: '',
        quantity: 1,
        unit: 'unidades',
        unit_price: 0,
        notes: '',
      },
    ])
  }

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      // Limpiar en vez de borrar si es la única
      setLines([
        {
          product_name: '',
          quantity: 1,
          unit: 'unidades',
          unit_price: 0,
          notes: '',
        },
      ])
      return
    }
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClientCreated = (newClient: KitchenClient) => {
    setClients((prev) => [newClient, ...prev])
    setSelectedClientId(newClient.id)
    setIsOccasionalClient(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const finalClientName = clientNameSnapshot.trim()
    if (!finalClientName) {
      setErrorMessage('Debes indicar el nombre del cliente o seleccionar uno de la lista.')
      return
    }

    if (!deliveryDate) {
      setErrorMessage('La fecha prevista de entrega es obligatoria.')
      return
    }

    const validLines = lines.filter((l) => l.product_name.trim())
    if (validLines.length === 0) {
      setErrorMessage('Debes agregar al menos un producto con nombre válido.')
      return
    }

    setIsSaving(true)

    try {
      const payload: SaveKitchenOrderInput = {
        id: initialOrder?.id,
        order_code: initialOrder?.order_code,
        client_id: isOccasionalClient ? null : selectedClientId || null,
        client_name_snapshot: finalClientName,
        client_contact_snapshot: clientContactSnapshot.trim() || null,
        order_date: orderDate,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime.trim() || null,
        status: status,
        notes: notes.trim() || null,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        deposit_amount: depositAmount,
        items: validLines.map((l, idx) => ({
          id: l.id,
          recipe_id: l.recipe_id || null,
          product_name: l.product_name.trim(),
          quantity: Math.max(0.0001, Number(l.quantity) || 1),
          unit: l.unit.trim() || 'unidades',
          unit_price: Math.max(0, Number(l.unit_price) || 0),
          reference_cost_per_unit: l.reference_cost_per_unit,
          reference_total_cost: l.reference_cost_per_unit
            ? Math.round(Number(l.quantity) * Number(l.reference_cost_per_unit) * 100) / 100
            : null,
          notes: l.notes?.trim() || null,
          position: idx,
        })),
      }

      const res = await saveKitchenOrderServer(payload)
      if (res.error || !res.data) {
        setErrorMessage(res.error || 'No se pudo guardar el pedido.')
        setIsSaving(false)
        return
      }

      router.push(`/cocina-pro/pedidos/${res.data.id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el pedido.')
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Barra superior con identidad Amasia y navegación */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              {initialOrder ? 'Edición comercial' : 'Operación comercial'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Amasia</span>
          </div>
          <Link
            href="/cocina-pro/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#7f22fe] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a pedidos
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-[#7f22fe]" />
            {initialOrder ? `Editar pedido ${initialOrder.order_code}` : 'Nuevo Pedido Comercial'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Precios acordados, productos solicitados y programación de entrega.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/cocina-pro/pedidos"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200/90 transition-all min-h-[44px] flex items-center active:scale-[0.98]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] text-white shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 min-h-[44px] cursor-pointer active:scale-[0.98]"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialOrder ? 'Guardar cambios' : 'Registrar pedido'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 text-xs sm:text-sm rounded-2xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bloque 1: Cliente y Contacto */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#7f22fe]" />
            <h2 className="text-sm font-bold text-slate-900 font-sans">
              Datos del cliente
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="text-xs font-semibold text-violet-900 hover:text-violet-950 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200/80 transition-all min-h-[36px] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo cliente
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cliente habitual del directorio
            </label>
            <select
              value={isOccasionalClient ? '' : selectedClientId}
              onChange={(e) => {
                if (e.target.value === '') {
                  setIsOccasionalClient(true)
                  setSelectedClientId('')
                } else {
                  setSelectedClientId(e.target.value)
                  setIsOccasionalClient(false)
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            >
              <option value="">Venta rápida / Cliente ocasional (sin guardar)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} {!c.is_active ? '[Inactivo]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre que figurará en el pedido *
            </label>
            <input
              type="text"
              required
              value={clientNameSnapshot}
              onChange={(e) => setClientNameSnapshot(e.target.value)}
              placeholder="Ej: Lucía Martínez / Cumpleaños Tomás"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Datos de contacto para la entrega (teléfono, WhatsApp, dirección)
            </label>
            <input
              type="text"
              value={clientContactSnapshot}
              onChange={(e) => setClientContactSnapshot(e.target.value)}
              placeholder="Ej: +54 9 11 9999-8888 · Retira en local o Av. Corrientes 1234"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Bloque 2: Fechas y Estado */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-5 h-5 text-[#7f22fe]" />
          <h2 className="text-sm font-bold text-slate-900 font-sans">
            Fecha de entrega y estado
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fecha de recepción
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fecha de entrega pactada *
            </label>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hora pactada (opcional)
            </label>
            <input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estado del pedido
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as KitchenOrderStatus)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            >
              <option value="recibido">Recibido</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_preparacion">En preparación</option>
              <option value="listo">Listo para entregar</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bloque 3: Líneas de Productos */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7f22fe]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Productos solicitados
              </h2>
              <p className="text-[11px] text-slate-500">
                Selecciona una receta para vincular al planificador de producción o ingresa un producto libre.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-900 border border-violet-200/80 hover:bg-violet-100 text-xs font-semibold transition-all min-h-[44px] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar producto
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Selector de receta existente */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Recetario Amasia (opcional)
                  </label>
                  <select
                    value={line.recipe_id || ''}
                    onChange={(e) => handleSelectRecipe(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[38px]"
                  >
                    <option value="">Producto libre / Sin receta</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.yield_quantity} {r.yield_unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombre del producto */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Descripción / Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={line.product_name}
                    onChange={(e) => handleUpdateLine(idx, { product_name: e.target.value })}
                    placeholder="Ej: Lemon Pie 24cm"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[38px]"
                  />
                </div>

                {/* Cantidad y Unidad */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cantidad ({line.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={line.quantity}
                    onChange={(e) =>
                      handleUpdateLine(idx, { quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[38px]"
                  />
                </div>

                {/* Precio unitario acordado */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Precio unitario ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={line.unit_price}
                    onChange={(e) =>
                      handleUpdateLine(idx, { unit_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[38px]"
                  />
                </div>

                {/* Botón eliminar línea */}
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors min-h-[38px] flex items-center justify-center cursor-pointer"
                    aria-label={`Eliminar producto ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subtotal y notas específicas del producto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/50">
                <input
                  type="text"
                  value={line.notes || ''}
                  onChange={(e) => handleUpdateLine(idx, { notes: e.target.value })}
                  placeholder="Detalles específicos: dedicatoria, sin nueces, velas..."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#7f22fe] focus:ring-1 focus:ring-[#7f22fe]/20"
                />

                <div className="flex items-center gap-3 font-mono shrink-0">
                  {line.reference_cost_per_unit ? (
                    <span className="text-[11px] text-slate-400">
                      Costo ref: ${(line.quantity * line.reference_cost_per_unit).toFixed(0)}
                    </span>
                  ) : null}
                  <span className="font-bold text-slate-900">
                    Subtotal: ${(line.quantity * line.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 4: Desglose Financiero y Anticipos */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <DollarSign className="w-5 h-5 text-[#7f22fe]" />
          <h2 className="text-sm font-bold text-slate-900 font-sans">
            Desglose comercial y pagos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descuento acordado ($)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Costo de envío / Logística ($)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Seña / Anticipo cobrado ($)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] min-h-[44px]"
            />
          </div>
        </div>

        {/* Panel consolidado de totales */}
        <div className="p-4 rounded-xl bg-violet-50/40 border border-violet-200/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-0.5 text-xs text-slate-600">
            <div>
              Subtotal de productos:{' '}
              <span className="font-semibold text-slate-900 font-mono">
                ${financials.subtotal.toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="text-red-600 font-semibold">
                Descuento: -${discountAmount.toFixed(2)}
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="text-slate-700">
                Envío: +${deliveryFee.toFixed(2)}
              </div>
            )}
            {financials.totalReferenceCost > 0 && (
              <div className="text-slate-500 pt-1">
                Costo estimado de recetas: ${financials.totalReferenceCost.toFixed(2)} · Margen aprox:{' '}
                <span className="font-semibold text-emerald-600">
                  {financials.estimatedMarginPct}% (${financials.estimatedProfit.toFixed(0)})
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Total del pedido</div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ${financials.totalAmount.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">
              Saldo a cobrar al entregar: ${financials.balanceAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 5: Observaciones Generales */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Observaciones generales del pedido y logística
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instrucciones para despacho, datos de facturación informal, contacto de recepción..."
          className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] resize-none"
        />
      </div>

      {/* Modal para crear cliente rápido */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />
    </form>
  )
}
