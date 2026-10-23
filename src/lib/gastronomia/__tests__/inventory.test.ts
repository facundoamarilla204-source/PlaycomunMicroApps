import { describe, it, expect } from 'vitest'
import {
  calculateProductionShortages,
  auditInventoryMovements,
  buildPurchaseDraftFromShortages,
} from '../inventory'
import type {
  ConsolidatedIngredientItem,
} from '../production-plan'
import type {
  IngredientStockSummary,
  SupplierIngredient,
  InventoryMovement,
} from '../types'

describe('Amasia - Fase 9: Motor Matemático de Inventario, Faltantes y Compras', () => {
  const mockStockHarina: IngredientStockSummary = {
    ingredient_id: 'ing-harina-000',
    ingredient_name: 'Harina 000',
    category: 'Secos',
    current_balance: 1200,
    package_unit: 'g',
    reference_package_size: 1000,
    current_price: 1500,
    total_value: 1800,
    last_movement_at: '2026-10-22T10:00:00Z',
  }

  const mockStockManteca: IngredientStockSummary = {
    ingredient_id: 'ing-manteca',
    ingredient_name: 'Manteca',
    category: 'Lácteos',
    current_balance: 500,
    package_unit: 'g',
    reference_package_size: 200,
    current_price: 1200,
    total_value: 3000,
  }

  const mockStockHuevos: IngredientStockSummary = {
    ingredient_id: 'ing-huevos',
    ingredient_name: 'Huevos',
    category: 'Frescos',
    current_balance: 24,
    package_unit: 'unidades',
    reference_package_size: 30,
    current_price: 4500,
    total_value: 3600,
  }

  const mockSupplierHarina: SupplierIngredient = {
    id: 'si-harina-molino',
    user_id: 'user-1',
    supplier_id: 'sup-molino-central',
    ingredient_id: 'ing-harina-000',
    package_size: 5,
    package_unit: 'kg',
    price: 6500,
    is_preferred: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    supplier: {
      id: 'sup-molino-central',
      user_id: 'user-1',
      name: 'Molino Central S.A.',
      is_active: true,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  }

  describe('1. Contraste de Necesidades de Producción vs. Existencias Reales', () => {
    it('calcula faltante exacto en misma unidad cuando la demanda supera el stock', () => {
      // Necesita 2.000 g de Harina, stock disponible 1.200 g -> Faltante 800 g
      const requiredItems: ConsolidatedIngredientItem[] = [
        {
          key: 'ing-harina-000',
          ingredientId: 'ing-harina-000',
          name: 'Harina 000',
          totalGrossQuantity: 2000,
          totalNetQuantity: 2000,
          unit: 'g',
          dimension: 'mass',
          estimatedConsumptionCost: 3000,
          origins: [],
          isProvisional: false,
          warnings: [],
        },
      ]

      const shortages = calculateProductionShortages(
        requiredItems,
        [mockStockHarina],
        { 'ing-harina-000': [mockSupplierHarina] }
      )

      expect(shortages).toHaveLength(1)
      const res = shortages[0]
      expect(res.ingredientName).toBe('Harina 000')
      expect(res.requiredGrossQuantity).toBe(2000)
      expect(res.availableStock).toBe(1200)
      expect(res.shortageQuantity).toBe(800)
      expect(res.isCovered).toBe(false)
      // Sugerencia de compra a proveedor preferido: bulto de 5 kg (5.000 g).
      // Faltante = 800 g (0.16 kg) -> 1 bulto de 5 kg = $6.500
      expect(res.suggestedPackageSize).toBe(5)
      expect(res.suggestedPackageUnit).toBe('kg')
      expect(res.packagesToOrder).toBe(1)
      expect(res.estimatedPurchaseCost).toBe(6500)
      expect(res.preferredSupplierName).toBe('Molino Central S.A.')
    })

    it('marca insumo como cubierto cuando el stock disponible es mayor o igual a la necesidad', () => {
      // Necesita 300 g de Manteca, stock disponible 500 g -> Faltante 0, cubierto
      const requiredItems: ConsolidatedIngredientItem[] = [
        {
          key: 'ing-manteca',
          ingredientId: 'ing-manteca',
          name: 'Manteca',
          totalGrossQuantity: 300,
          totalNetQuantity: 300,
          unit: 'g',
          dimension: 'mass',
          estimatedConsumptionCost: 1800,
          origins: [],
          isProvisional: false,
          warnings: [],
        },
      ]

      const shortages = calculateProductionShortages(requiredItems, [mockStockManteca])
      expect(shortages).toHaveLength(1)
      const res = shortages[0]
      expect(res.shortageQuantity).toBe(0)
      expect(res.isCovered).toBe(true)
      expect(res.packagesToOrder).toBe(0)
      expect(res.estimatedPurchaseCost).toBe(0)
    })

    it('convierte unidades compatibles (kg y g) sin perder rigor dimensional', () => {
      // Necesita 1.5 kg de Manteca, stock en almacén: 500 g -> Faltante 1 kg
      const requiredItems: ConsolidatedIngredientItem[] = [
        {
          key: 'ing-manteca',
          ingredientId: 'ing-manteca',
          name: 'Manteca',
          totalGrossQuantity: 1.5,
          totalNetQuantity: 1.5,
          unit: 'kg',
          dimension: 'mass',
          estimatedConsumptionCost: 9000,
          origins: [],
          isProvisional: false,
          warnings: [],
        },
      ]

      const shortages = calculateProductionShortages(requiredItems, [mockStockManteca])
      expect(shortages).toHaveLength(1)
      const res = shortages[0]
      // Stock disponible convertido a kg: 500 g = 0.5 kg
      expect(res.availableStock).toBe(0.5)
      expect(res.shortageQuantity).toBe(1) // 1.5 - 0.5 = 1 kg
      expect(res.isCovered).toBe(false)
      // Paquete de referencia en biblioteca: 200 g (0.2 kg) a $1.200
      // 1 kg / 0.2 kg = 5 paquetes
      expect(res.packagesToOrder).toBe(5)
      expect(res.estimatedPurchaseCost).toBe(5 * 1200)
    })

    it('advierte y marca como provisional ante unidades incompatibles sin equivalencia', () => {
      // Necesita 500 ml de Harina, stock registrado en g sin densidad
      const requiredItems: ConsolidatedIngredientItem[] = [
        {
          key: 'ing-harina-000',
          ingredientId: 'ing-harina-000',
          name: 'Harina 000',
          totalGrossQuantity: 500,
          totalNetQuantity: 500,
          unit: 'ml',
          dimension: 'volume',
          estimatedConsumptionCost: 1000,
          origins: [],
          isProvisional: false,
          warnings: [],
        },
      ]

      const shortages = calculateProductionShortages(requiredItems, [mockStockHarina])
      expect(shortages).toHaveLength(1)
      const res = shortages[0]
      expect(res.isProvisional).toBe(true)
      expect(res.warnings.length).toBeGreaterThan(0)
      expect(res.warnings[0]).toContain('no se puede convertir')
    })
  })

  describe('2. Auditoría y Trazabilidad Cronológica de Movimientos (FIFO)', () => {
    it('calcula y audita el saldo cronológico acumulado a partir de movimientos sucesivos', () => {
      const movements: InventoryMovement[] = [
        {
          id: 'mov-1',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'initial',
          direction: 'in',
          quantity: 1000,
          unit: 'g',
          normalized_quantity: 1000,
          balance_after: 1000,
          created_at: '2026-10-01T08:00:00Z',
        },
        {
          id: 'mov-2',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'in',
          direction: 'in',
          quantity: 2000,
          unit: 'g',
          normalized_quantity: 2000,
          balance_after: 3000,
          created_at: '2026-10-02T09:00:00Z',
        },
        {
          id: 'mov-3',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'out',
          direction: 'out',
          quantity: 1500,
          unit: 'g',
          normalized_quantity: 1500,
          balance_after: 1500,
          created_at: '2026-10-03T14:00:00Z',
        },
      ]

      const audit = auditInventoryMovements(movements)
      expect(audit.isValid).toBe(true)
      expect(audit.calculatedBalance).toBe(1500)
      expect(audit.recordedBalance).toBe(1500)
      expect(audit.discrepancies).toHaveLength(0)
      expect(audit.duplicateKeyErrors).toHaveLength(0)
    })

    it('detecta alteración o discrepancia en el saldo tras un movimiento', () => {
      const tamperedMovements: InventoryMovement[] = [
        {
          id: 'mov-1',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'initial',
          direction: 'in',
          quantity: 1000,
          unit: 'g',
          normalized_quantity: 1000,
          balance_after: 1000,
          created_at: '2026-10-01T08:00:00Z',
        },
        {
          id: 'mov-2',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'out',
          direction: 'out',
          quantity: 300,
          unit: 'g',
          normalized_quantity: 300,
          balance_after: 900, // Error intencional: debería ser 700
          created_at: '2026-10-02T09:00:00Z',
        },
      ]

      const audit = auditInventoryMovements(tamperedMovements)
      expect(audit.isValid).toBe(false)
      expect(audit.discrepancies.length).toBeGreaterThan(0)
      expect(audit.discrepancies[0]).toContain('Discrepancia')
    })

    it('detecta claves de idempotencia duplicadas para prevenir doble imputación', () => {
      const duplicateKeyMovements: InventoryMovement[] = [
        {
          id: 'mov-1',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'in',
          direction: 'in',
          quantity: 500,
          unit: 'g',
          normalized_quantity: 500,
          balance_after: 500,
          idempotency_key: 'rec_po_123_line_1',
          created_at: '2026-10-01T08:00:00Z',
        },
        {
          id: 'mov-2',
          user_id: 'user-1',
          ingredient_id: 'ing-harina-000',
          movement_type: 'in',
          direction: 'in',
          quantity: 500,
          unit: 'g',
          normalized_quantity: 500,
          balance_after: 1000,
          idempotency_key: 'rec_po_123_line_1', // Duplicada
          created_at: '2026-10-01T08:00:05Z',
        },
      ]

      const audit = auditInventoryMovements(duplicateKeyMovements)
      expect(audit.isValid).toBe(false)
      expect(audit.duplicateKeyErrors).toHaveLength(1)
      expect(audit.duplicateKeyErrors[0]).toContain('rec_po_123_line_1')
    })
  })

  describe('3. Preparación de Borrador de Compra desde Faltantes', () => {
    it('construye borrador de compra sin confirmarla automáticamente ni modificar existencias', () => {
      const shortages = calculateProductionShortages(
        [
          {
            key: 'ing-harina-000',
            ingredientId: 'ing-harina-000',
            name: 'Harina 000',
            totalGrossQuantity: 2000,
            totalNetQuantity: 2000,
            unit: 'g',
            dimension: 'mass',
            estimatedConsumptionCost: 3000,
            origins: [],
            isProvisional: false,
            warnings: [],
          },
          {
            key: 'ing-huevos',
            ingredientId: 'ing-huevos',
            name: 'Huevos',
            totalGrossQuantity: 40,
            totalNetQuantity: 40,
            unit: 'unidades',
            dimension: 'count',
            estimatedConsumptionCost: 6000,
            origins: [],
            isProvisional: false,
            warnings: [],
          },
        ],
        [mockStockHarina, mockStockHuevos],
        { 'ing-harina-000': [mockSupplierHarina] }
      )

      // Shortages: Harina faltan 800 g (1 bulto de 5 kg x $6.500)
      // Huevos faltan 16 u (stock 24 vs req 40) -> 1 bulto de 30 u x $4.500
      const draft = buildPurchaseDraftFromShortages(shortages, 'sup-molino-central')

      expect(draft.status).toBe('draft')
      expect(draft.items).toHaveLength(2)
      expect(draft.supplier_id).toBe('sup-molino-central')
      expect(draft.subtotal).toBe(6500 + 4500)
      expect(draft.total).toBe(11000)
      expect(draft.notes).toContain('Borrador generado a partir de faltantes')
    })
  })
})
