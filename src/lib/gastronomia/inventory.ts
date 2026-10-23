/**
 * Cocina Pro - Núcleo Matemático Gastronómico
 * inventory.ts: Motor de cálculo de existencias, contraste de faltantes en producción,
 * conversión de unidades de compras y sugerencia inteligente de pedidos.
 *
 * Sigue las directrices de Antislop e Impeccable:
 * - Rigor matemático sin conversiones arbitrarias.
 * - Trazabilidad auditable mediante movimientos.
 * - Distinción explícita entre faltante de consumo y compra de paquetes enteros.
 */

import { convertUnits, normalizeUnit } from './conversions'
import type {
  ConsolidatedIngredientItem,
} from './production-plan'
import type {
  IngredientStockSummary,
  InventoryShortageComparison,
  SupplierIngredient,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryMovement,
} from './types'

/**
 * Compara las necesidades brutas calculadas de producción contra el stock
 * real disponible en inventario y calcula los faltantes y sugerencias de compra.
 */
export function calculateProductionShortages(
  consolidatedIngredients: ConsolidatedIngredientItem[],
  stockInput: Map<string, IngredientStockSummary> | IngredientStockSummary[],
  supplierInput?:
    | Map<string, SupplierIngredient[]>
    | Record<string, SupplierIngredient[]>
): InventoryShortageComparison[] {
  const stockMap: Map<string, IngredientStockSummary> = Array.isArray(stockInput)
    ? new Map(stockInput.map((s) => [s.ingredient_id, s]))
    : stockInput

  const supplierPresentationsMap: Map<string, SupplierIngredient[]> = !supplierInput
    ? new Map<string, SupplierIngredient[]>()
    : supplierInput instanceof Map
    ? supplierInput
    : new Map(Object.entries(supplierInput))

  const comparisons: InventoryShortageComparison[] = []

  for (const item of consolidatedIngredients) {
    const ingredientId = item.ingredientId || null
    const warnings: string[] = [...item.warnings]
    let isProvisional = item.isProvisional

    let availableStock = 0
    let stockUnit = item.unit
    let stockSummary: IngredientStockSummary | undefined

    if (ingredientId && stockMap.has(ingredientId)) {
      stockSummary = stockMap.get(ingredientId)!
      stockUnit = stockSummary.package_unit || item.unit
      availableStock = Number(stockSummary.current_balance) || 0
    }

    // Convertir stock a la unidad requerida de la receta si son compatibles
    let convertedAvailableStock = availableStock
    if (ingredientId && stockSummary && normalizeUnit(stockUnit) !== normalizeUnit(item.unit)) {
      const conv = convertUnits(
        availableStock,
        stockUnit,
        item.unit,
        stockSummary.reference_package_size ? { density: undefined } : undefined
      )
      if (conv && conv.success) {
        convertedAvailableStock = conv.value
      } else {
        warnings.push(
          `La unidad de stock (${stockUnit}) no se puede convertir a la unidad de la receta (${item.unit}) sin equivalencia.`
        )
        isProvisional = true
      }
    }

    // Calcular faltante real
    const shortageQuantity = Math.max(0, item.totalGrossQuantity - convertedAvailableStock)
    const isCovered = shortageQuantity === 0

    // Buscar presentación de compra preferida del proveedor o paquete de referencia
    let suggestedPackageSize = 1
    let suggestedPackageUnit = item.unit
    let packagePrice = 0
    let preferredSupplierId: string | null = null
    let preferredSupplierName: string | null = null

    if (ingredientId && supplierPresentationsMap && supplierPresentationsMap.has(ingredientId)) {
      const presentations = supplierPresentationsMap.get(ingredientId)!
      const preferred = presentations.find((p) => p.is_preferred) || presentations[0]
      if (preferred) {
        suggestedPackageSize = Number(preferred.package_size) || 1
        suggestedPackageUnit = preferred.package_unit || item.unit
        packagePrice = Number(preferred.price) || 0
        preferredSupplierId = preferred.supplier_id
        preferredSupplierName = preferred.supplier?.name || null
      }
    } else if (stockSummary && stockSummary.reference_package_size > 0) {
      suggestedPackageSize = Number(stockSummary.reference_package_size) || 1
      suggestedPackageUnit = stockSummary.package_unit || item.unit
      packagePrice = Number(stockSummary.current_price) || 0
    } else if (item.libraryItem && item.libraryItem.package_quantity > 0) {
      suggestedPackageSize = Number(item.libraryItem.package_quantity) || 1
      suggestedPackageUnit = item.libraryItem.package_unit || item.unit
      packagePrice = Number(item.libraryItem.current_price) || 0
    }

    // Convertir faltante a unidad de paquete para calcular cantidad de paquetes a pedir
    let shortageInPackageUnit = shortageQuantity
    if (shortageQuantity > 0 && normalizeUnit(item.unit) !== normalizeUnit(suggestedPackageUnit)) {
      const conv = convertUnits(shortageQuantity, item.unit, suggestedPackageUnit)
      if (conv && conv.success) {
        shortageInPackageUnit = conv.value
      } else {
        warnings.push(
          `No se pudo convertir el faltante (${item.unit}) a la unidad de compra (${suggestedPackageUnit}).`
        )
        isProvisional = true
      }
    }

    const packagesToOrder = shortageQuantity > 0 && suggestedPackageSize > 0
      ? Math.ceil(shortageInPackageUnit / suggestedPackageSize)
      : 0

    const estimatedPurchaseCost = packagesToOrder * packagePrice

    comparisons.push({
      ingredientId,
      ingredientName: item.name,
      requiredGrossQuantity: item.totalGrossQuantity,
      requiredUnit: item.unit,
      availableStock: convertedAvailableStock,
      stockUnit: item.unit,
      shortageQuantity,
      isCovered,
      isProvisional,
      suggestedPackageSize,
      suggestedPackageUnit,
      packagesToOrder,
      estimatedPurchaseCost,
      preferredSupplierId,
      preferredSupplierName,
      warnings,
    })
  }

  return comparisons
}

/**
 * Valida y calcula el saldo acumulado en orden cronológico a partir de movimientos.
 */
export function auditInventoryMovements(
  movements: InventoryMovement[]
): {
  isValid: boolean
  calculatedBalance: number
  recordedBalance: number
  hasInconsistencies: boolean
  negativeBalanceEncountered: boolean
  discrepancies: string[]
  duplicateKeyErrors: string[]
  errors: string[]
} {
  let balance = 0
  let hasInconsistencies = false
  let negativeBalanceEncountered = false
  const discrepancies: string[] = []
  const duplicateKeyErrors: string[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  // Ordenar cronológicamente ascendente
  const sorted = [...movements].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  for (let idx = 0; idx < sorted.length; idx++) {
    const mov = sorted[idx]
    const qty = mov.normalized_quantity || mov.quantity

    if (mov.idempotency_key) {
      if (seenKeys.has(mov.idempotency_key)) {
        duplicateKeyErrors.push(
          `Clave de idempotencia duplicada: ${mov.idempotency_key} en movimiento #${idx + 1}`
        )
      } else {
        seenKeys.add(mov.idempotency_key)
      }
    }

    if (mov.direction === 'in') {
      balance += qty
    } else if (mov.direction === 'out') {
      balance -= qty
    }

    if (balance < 0 && !negativeBalanceEncountered) {
      negativeBalanceEncountered = true
      errors.push(`El saldo se tornó negativo (${balance.toFixed(2)}) en el movimiento #${idx + 1}.`)
    }

    if (Math.abs(mov.balance_after - balance) > 0.001) {
      hasInconsistencies = true
      discrepancies.push(
        `Discrepancia en movimiento #${idx + 1}: saldo guardado ${mov.balance_after}, saldo calculado ${balance.toFixed(2)}.`
      )
    }
  }

  const lastMovement = sorted[sorted.length - 1]
  const recordedBalance = lastMovement ? lastMovement.balance_after : 0
  const isValid =
    !hasInconsistencies &&
    discrepancies.length === 0 &&
    duplicateKeyErrors.length === 0 &&
    !negativeBalanceEncountered

  return {
    isValid,
    calculatedBalance: Math.max(0, balance),
    recordedBalance,
    hasInconsistencies,
    negativeBalanceEncountered,
    discrepancies,
    duplicateKeyErrors,
    errors,
  }
}

/**
 * Genera un borrador de Orden de Compra agrupado a partir de los faltantes seleccionados.
 */
export function buildPurchaseDraftFromShortages(
  shortages: InventoryShortageComparison[],
  supplierId?: string,
  supplierName?: string,
  orderNumber?: string
): {
  status: 'draft'
  order_number: string
  supplier_id: string | null
  supplier_name: string
  subtotal: number
  total: number
  notes: string
  items: Array<Omit<PurchaseOrderItem, 'id' | 'purchase_order_id'>>
  order: Partial<PurchaseOrder>
} {
  const items: Array<Omit<PurchaseOrderItem, 'id' | 'purchase_order_id'>> = []
  let subtotal = 0

  for (const s of shortages) {
    if (s.packagesToOrder > 0) {
      const packagePrice = s.packagesToOrder > 0 ? s.estimatedPurchaseCost / s.packagesToOrder : 0
      const totalPrice = s.packagesToOrder * packagePrice
      subtotal += totalPrice

      items.push({
        ingredient_id: s.ingredientId || null,
        ingredient_name: s.ingredientName,
        ordered_quantity: s.packagesToOrder,
        package_size: s.suggestedPackageSize,
        package_unit: s.suggestedPackageUnit,
        unit_price: packagePrice,
        total_price: totalPrice,
        received_quantity: 0,
        notes: `Generado desde faltantes de producción`,
      })
    }
  }

  const generatedOrderNumber = orderNumber || `OC-DRAFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
  const generatedSupplierName = supplierName || 'Proveedor a confirmar'

  const order: Partial<PurchaseOrder> = {
    order_number: generatedOrderNumber,
    supplier_id: supplierId || null,
    supplier_name: generatedSupplierName,
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    subtotal: Math.round(subtotal * 100) / 100,
    shipping_cost: 0,
    taxes_amount: 0,
    discount_amount: 0,
    total: Math.round(subtotal * 100) / 100,
    notes: 'Borrador generado a partir de faltantes calculados en Amasia.',
  }

  return {
    status: 'draft',
    order_number: generatedOrderNumber,
    supplier_id: supplierId || null,
    supplier_name: generatedSupplierName,
    subtotal: order.subtotal || 0,
    total: order.total || 0,
    notes: order.notes || '',
    items,
    order,
  }
}
