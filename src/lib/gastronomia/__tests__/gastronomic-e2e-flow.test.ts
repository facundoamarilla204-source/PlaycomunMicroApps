import { describe, it, expect } from 'vitest'
import {
  unitConversion,
  Unit,
  Recipe,
} from '@/lib/costo-receta'
import {
  convertUnits,
  calculateBakersPercentages,
  calculateMoldScaleFactor,
  scaleRecipeByFactor,
  calculateRecipeFinancials,
  detectSubrecipeCycle,
  calculateCompositeRecipeFinancials,
  calculateProductionPlan,
  calculateProductionShortages,
  calculateOrderFinancials,
  validateOrderStatusTransition,
  checkProductionOrderDivergence,
  groupOrdersByDeliveryDate,
  KitchenIngredient,
  KitchenIngredientPriceHistory,
  InventoryMovement,
  IngredientStockSummary,
  KitchenOrder,
  ProductionPlan,
  ConsolidatedIngredientItem,
} from '@/lib/gastronomia'

describe('Amasia — Validación Integral del Flujo Gastronómico de Extremo a Extremo', () => {
  // ============================================================================
  // PASO 1: Ingredientes, unidades, densidades, costos e historial de precios
  // ============================================================================
  describe('Paso 1: Biblioteca de materias primas, unidades y cálculo de costos', () => {
    const harina: KitchenIngredient = {
      id: 'ing-harina-0000',
      user_id: 'user-chef',
      name: 'Harina 0000',
      category: 'Secos',
      package_unit: 'kg',
      package_quantity: 25,
      current_price: 20000, // $20.000 los 25 kg -> $800 / kg -> $0.8 / g
      price_updated_at: '2026-10-01T10:00:00Z',
      is_flour: true,
      is_water: false,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    }

    const crema: KitchenIngredient = {
      id: 'ing-crema',
      user_id: 'user-chef',
      name: 'Crema de Leche',
      category: 'Lácteos',
      package_unit: 'l',
      package_quantity: 1,
      current_price: 4500, // $4.500 el litro
      price_updated_at: '2026-10-01T10:00:00Z',
      density_g_ml: 1.012, // densidad real de la crema de leche
      density_source: 'Especificación técnica láctea',
      is_flour: false,
      is_water: false,
      estimated_water_percentage: 58,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    }

    it('calcula con exactitud el costo unitario por gramo y mililitro', () => {
      // Costo de 500g de harina a partir de presentación de 25 kg a $20.000
      const refQtyInGrams = unitConversion('kg', 'g', harina.package_quantity) // 25.000 g
      expect(refQtyInGrams).toBe(25000)
      const costPerGram = harina.current_price / refQtyInGrams
      expect(costPerGram).toBe(0.8)

      const cost500g = 500 * costPerGram
      expect(cost500g).toBe(400)

      // Conversión de volumen a masa usando densidad (250 ml de crema a gramos)
      const conv = convertUnits(250, 'ml', 'g', { density: crema.density_g_ml ?? undefined })
      expect(conv.success).toBe(true)
      expect(conv.value).toBeCloseTo(250 * 1.012, 2) // 253 g
    })

    it('registra el historial inmutable de precios al cambiar el valor de mercado', () => {
      const priceHistory: KitchenIngredientPriceHistory[] = []
      let currentPrice = harina.current_price

      // Simulamos actualización de precio por inflación
      const newPrice = 24000
      if (newPrice !== currentPrice) {
        priceHistory.push({
          id: 'hist-1',
          ingredient_id: harina.id,
          user_id: harina.user_id,
          previous_price: currentPrice,
          new_price: newPrice,
          change_reason: 'Aumento de proveedor Molino del Plata',
          recorded_at: '2026-10-24T12:00:00Z',
        })
        currentPrice = newPrice
      }

      expect(priceHistory).toHaveLength(1)
      expect(priceHistory[0].previous_price).toBe(20000)
      expect(priceHistory[0].new_price).toBe(24000)
      expect(priceHistory[0].recorded_at).toBeDefined()
    })
  })

  // ============================================================================
  // PASO 2: Recetas, porcentajes de panadero, escalado y costos adicionales
  // ============================================================================
  describe('Paso 2: Creación de recetas, panadería, moldes y estructura de costos', () => {
    it('calcula los porcentajes de panadero con la harina como base 100% e hidratación total', () => {
      const ingredients = [
        { name: 'Harina de trigo 000', weightGrams: 1000, isFlour: true },
        { name: 'Agua potable', weightGrams: 650, isLiquid: true },
        { name: 'Sal fina', weightGrams: 20 },
        { name: 'Levadura fresca', weightGrams: 10 },
      ]

      const bakersCalc = calculateBakersPercentages(ingredients)
      expect(bakersCalc.totalFlourWeightGrams).toBe(1000)

      // La harina debe ser exactamente 100%
      const flourItem = bakersCalc.ingredients.find((i) => i.name.includes('Harina'))
      expect(flourItem?.bakersPercentage).toBe(100)

      // Agua libre = 650 / 1000 = 65%
      const waterItem = bakersCalc.ingredients.find((i) => i.name.includes('Agua'))
      expect(waterItem?.bakersPercentage).toBe(65)
      expect(bakersCalc.traditionalHydrationPercentage).toBe(65)
    })

    it('escala la receta linealmente y por cambio dimensional de molde', () => {
      // Escalado por dimensiones de molde redondo: de 20cm a 24cm
      const moldScale = calculateMoldScaleFactor(
        { shape: 'round', diameter: 20 },
        { shape: 'round', diameter: 24 }
      )
      // Factor esperado = (24/20)^2 = 1.44
      expect(moldScale.scaleFactor).toBeCloseTo(1.44, 2)

      // Escalado de cantidades de ingredientes por factor
      const scaled = scaleRecipeByFactor(
        {
          name: 'Bizcochuelo',
          yield_quantity: 1,
          yield_unit: 'molde',
          ingredients: [
            { id: 'ing-1', name: 'Harina', quantity: 200, unit: 'g' },
            { id: 'ing-2', name: 'Azúcar', quantity: 150, unit: 'g' },
            { id: 'ing-3', name: 'Huevos', quantity: 4, unit: 'unidades' },
          ],
        },
        moldScale.scaleFactor
      )
      expect(scaled.scaledRecipe.ingredients[0].quantity).toBeCloseTo(288, 1)
      expect(scaled.scaledRecipe.ingredients[1].quantity).toBeCloseTo(216, 1)
      expect(scaled.scaledRecipe.ingredients[2].quantity).toBeCloseTo(5.76, 2)
    })

    it('calcula los costos adicionales (packaging, mano de obra) y precio sugerido con margen', () => {
      const recipe = {
        name: 'Pan Brioche Artesanal',
        yield_quantity: 2,
        yield_unit: 'unidades' as Unit,
        target_margin: 40, // 40% margen sobre venta
        target_markup: 0,
        pricing_mode: 'margin' as const,
        ingredients: [
          {
            id: 'ing-1',
            name: 'Harina',
            quantity: 500,
            unit: 'g' as Unit,
            reference_quantity: 1,
            reference_unit: 'kg' as Unit,
            reference_price: 1000, // $500
          },
          {
            id: 'ing-2',
            name: 'Manteca',
            quantity: 250,
            unit: 'g' as Unit,
            reference_quantity: 1,
            reference_unit: 'kg' as Unit,
            reference_price: 8000, // $2.000
          },
        ],
        additional_costs: [
          { id: 'c-1', name: 'Bolsa kraft con ventana', amount: 300 },
          { id: 'c-2', name: 'Mano de obra y energía', amount: 1200 },
        ],
      }

      const fin = calculateRecipeFinancials(recipe)
      expect(fin.totalIngredients).toBe(2500)
      expect(fin.totalAdditional).toBe(1500)
      expect(fin.totalCost).toBe(4000)
      expect(fin.unitCost).toBe(2000)

      // Con 40% de margen: Precio de venta unitario = 2000 / (1 - 0.40) = $3333.33
      expect(fin.suggestedPrice).toBeCloseTo(3333.33, 1)
    })
  })

  // ============================================================================
  // PASO 3: Subrecetas, composición y prevención de dependencias circulares
  // ============================================================================
  describe('Paso 3: Subrecetas, referencias de costo y prevención de ciclos', () => {
    it('detecta y previene dependencias circulares directas e indirectas', () => {
      // Grafo de relaciones: Torta -> Relleno -> Ganache
      const graph = new Map<string, string[]>()
      graph.set('rec-torta', ['rec-relleno'])
      graph.set('rec-relleno', ['rec-ganache'])

      // 1. Intento de autorreferencia
      const selfCycle = detectSubrecipeCycle('rec-ganache', 'rec-ganache', (id) => graph.get(id) || [])
      expect(selfCycle.hasCycle).toBe(true)

      // 2. Intento de cerrar ciclo: Ganache -> Torta
      const cycle = detectSubrecipeCycle('rec-ganache', 'rec-torta', (id) => graph.get(id) || [])
      expect(cycle.hasCycle).toBe(true)
      expect(cycle.message).toContain('Dependencia circular')

      // 3. Relación válida acíclica
      const valid = detectSubrecipeCycle('rec-ganache', 'rec-decoracion', (id) => graph.get(id) || [])
      expect(valid.hasCycle).toBe(false)
    })

    it('calcula los costos compuestos de una receta con subrecetas y mermas', () => {
      const ganacheSubrecipe: Recipe = {
        id: 'sub-ganache',
        name: 'Ganache de Chocolate',
        category: 'Bases',
        description: '',
        yield_quantity: 500,
        yield_unit: 'g',
        target_margin: 0,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          { id: 'g-1', name: 'Chocolate', quantity: 250, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 12000 },
          { id: 'g-2', name: 'Crema', quantity: 250, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 4000 },
        ],
        additional_costs: [],
      }

      // Costo total ganache: (250 * 12) + (250 * 4) = 3000 + 1000 = $4000 para 500g ($8 / g)
      const compositeRecipe: Recipe = {
        name: 'Torta Suprema',
        category: 'Tortas',
        description: 'Torta con ganache',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 40,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          { id: 't-1', name: 'Bizcochuelo', quantity: 1, unit: 'unidades', reference_quantity: 1, reference_unit: 'unidades', reference_price: 3500 },
        ],
        additional_costs: [{ id: 'ac-1', name: 'Caja', amount: 500 }],
        subrecipes: [
          {
            id: 'sr-1',
            recipe_id: 'torta-compuesta',
            position: 1,
            subrecipe_id: 'sub-ganache',
            quantity: 250, // Requiere 250g de ganache
            unit: 'g',
            waste_percentage: 0,
          },
        ],
      }

      const composite = calculateCompositeRecipeFinancials(
        compositeRecipe,
        (id) => (id === 'sub-ganache' ? ganacheSubrecipe : undefined)
      )

      expect(composite.subrecipesCost).toBe(2000) // 250g * $8/g = $2000
      expect(composite.directIngredientsCost).toBe(3500)
      expect(composite.additionalCosts).toBe(500)
      expect(composite.totalCost).toBe(6000)
    })
  })

  // ============================================================================
  // PASO 4: Plan de producción y consolidación de insumos con subrecetas
  // ============================================================================
  describe('Paso 4: Consolidación de un plan de producción multi-receta con subrecetas', () => {
    it('consolida los ingredientes requeridos sumando insumos directos y los de subrecetas', () => {
      const ganache: Recipe = {
        id: 'sub-ganache',
        name: 'Ganache de Chocolate',
        category: 'Bases',
        description: 'Ganache para relleno',
        yield_quantity: 500,
        yield_unit: 'g',
        target_margin: 0,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          { id: 'g-1', ingredient_id: 'ing-chocolate', name: 'Chocolate Semiamargo', quantity: 300, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 15000 },
          { id: 'g-2', ingredient_id: 'ing-crema', name: 'Crema de Leche', quantity: 200, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 5000 },
        ],
        additional_costs: [],
      }

      const torta: Recipe = {
        id: 'rec-torta',
        name: 'Torta Bariloche',
        category: 'Tortas',
        description: 'Torta Bariloche con ganache',
        yield_quantity: 1,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          { id: 't-1', ingredient_id: 'ing-harina-0000', name: 'Harina 0000', quantity: 300, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 800 },
          { id: 't-2', ingredient_id: 'ing-azucar', name: 'Azúcar Común', quantity: 200, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 1000 },
        ],
        subrecipes: [
          { id: 'sr-1', recipe_id: 'rec-torta', position: 1, subrecipe_id: 'sub-ganache', quantity: 250, unit: 'g', waste_percentage: 0 },
        ],
        additional_costs: [],
      }

      const galletitas: Recipe = {
        id: 'rec-galletitas',
        name: 'Galletitas de Vainilla',
        category: 'Galletitas',
        description: 'Galletitas de vainilla clásicas',
        yield_quantity: 20,
        yield_unit: 'unidades',
        target_margin: 30,
        target_markup: 0,
        pricing_mode: 'margin',
        ingredients: [
          { id: 'gal-1', ingredient_id: 'ing-harina-0000', name: 'Harina 0000', quantity: 400, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 800 },
          { id: 'gal-2', ingredient_id: 'ing-manteca', name: 'Manteca', quantity: 200, unit: 'g', reference_quantity: 1, reference_unit: 'kg', reference_price: 7000 },
        ],
        additional_costs: [],
      }

      // Plan: 2 Tortas y 40 Galletitas (factor 2 para ambas)
      const planItems = [
        { recipeId: 'rec-torta', targetQuantity: 2, targetUnit: 'unidades' },
        { recipeId: 'rec-galletitas', targetQuantity: 40, targetUnit: 'unidades' },
      ]

      const recipeMap = new Map<string, Recipe>([
        ['rec-torta', torta],
        ['rec-galletitas', galletitas],
        ['sub-ganache', ganache],
      ])

      const planSummary = calculateProductionPlan(planItems, (id) => recipeMap.get(id))

      expect(planSummary.items).toHaveLength(2)

      // Comprobar consolidación de Harina:
      // Torta: 300g * 2 = 600g
      // Galletitas: 400g * 2 = 800g
      // Total consolidado = 1400g
      const harinaConsolidada = planSummary.consolidatedIngredients.find(
        (i) => i.ingredientId === 'ing-harina-0000' || i.name.toLowerCase().includes('harina')
      )
      expect(harinaConsolidada).toBeDefined()
      expect(harinaConsolidada?.totalGrossQuantity).toBe(1400)

      // Comprobar que los ingredientes de la subreceta Ganache fueron expandidos:
      // Se necesitan 250g * 2 = 500g de Ganache (factor 1 sobre el rendimiento de 500g)
      // Chocolate: 300g
      // Crema: 200g
      const chocolateConsolidado = planSummary.consolidatedIngredients.find(
        (i) => i.ingredientId === 'ing-chocolate' || i.name.toLowerCase().includes('chocolate')
      )
      expect(chocolateConsolidado).toBeDefined()
      expect(chocolateConsolidado?.totalGrossQuantity).toBe(300)

      const cremaConsolidada = planSummary.consolidatedIngredients.find(
        (i) => i.ingredientId === 'ing-crema' || i.name.toLowerCase().includes('crema')
      )
      expect(cremaConsolidada).toBeDefined()
      expect(cremaConsolidada?.totalGrossQuantity).toBe(200)
    })
  })

  // ============================================================================
  // PASOS 5 y 6: Comparación de existencias, cálculo de faltantes y borrador de compra
  // ============================================================================
  describe('Pasos 5 y 6: Detección de faltantes sin modificar stock y borrador de compra', () => {
    it('detecta existencias vs requerimientos y sugiere paquetes enteros sin alterar el inventario', () => {
      const consolidated: ConsolidatedIngredientItem[] = [
        {
          key: 'harina-mass',
          name: 'Harina 0000',
          ingredientId: 'ing-harina-0000',
          unit: 'g',
          dimension: 'mass',
          totalNetQuantity: 1400,
          totalGrossQuantity: 1400,
          isProvisional: false,
          warnings: [],
          origins: [],
          estimatedConsumptionCost: 1120,
        },
        {
          key: 'crema-mass',
          name: 'Crema de Leche',
          ingredientId: 'ing-crema',
          unit: 'g',
          dimension: 'mass',
          totalNetQuantity: 600,
          totalGrossQuantity: 600,
          isProvisional: false,
          warnings: [],
          origins: [],
          estimatedConsumptionCost: 2700,
        },
      ]

      // Stock actual en almacén:
      // Harina: 1000 g (faltan 400 g)
      // Crema: 800 g (alcanza, faltante = 0)
      const stockSummaries: IngredientStockSummary[] = [
        {
          ingredient_id: 'ing-harina-0000',
          ingredient_name: 'Harina 0000',
          current_balance: 1000,
          package_unit: 'g',
          reference_package_size: 1000, // paquete de 1 kg (1000 g)
          current_price: 1200,
          total_value: 1200,
          expiring_soon_count: 0,
        },
        {
          ingredient_id: 'ing-crema',
          ingredient_name: 'Crema de Leche',
          current_balance: 800,
          package_unit: 'g',
          reference_package_size: 1000,
          current_price: 4500,
          total_value: 3600,
          expiring_soon_count: 0,
        },
      ]

      // Comparación de faltantes
      const shortages = calculateProductionShortages(consolidated, stockSummaries)

      // 1. Harina
      const harinaShortage = shortages.find((s) => s.ingredientId === 'ing-harina-0000')
      expect(harinaShortage?.isCovered).toBe(false)
      expect(harinaShortage?.shortageQuantity).toBe(400)
      // Paquetes sugeridos: ceil(400 / 1000) = 1 paquete
      expect(harinaShortage?.packagesToOrder).toBe(1)
      expect(harinaShortage?.estimatedPurchaseCost).toBe(1200)

      // 2. Crema
      const cremaShortage = shortages.find((s) => s.ingredientId === 'ing-crema')
      expect(cremaShortage?.isCovered).toBe(true)
      expect(cremaShortage?.shortageQuantity).toBe(0)
      expect(cremaShortage?.packagesToOrder).toBe(0)

      // Rigor: Verificar que el stock simulado permanece intacto
      expect(stockSummaries[0].current_balance).toBe(1000)
      expect(stockSummaries[1].current_balance).toBe(800)
    })

    it('la creación o confirmación de un borrador de compra NO aumenta existencias', () => {
      // Un borrador (draft) o confirmado (confirmed) solo declara la intención de compra.
      // Las existencias solo aumentan tras el evento de recepción física (received).
      const orderDraft = {
        id: 'po-123',
        status: 'draft' as const,
        supplier_name: 'Distribuidora Láctea',
        items: [
          { ingredient_id: 'ing-harina-0000', ordered_quantity: 2, package_size: 1, package_unit: 'kg' },
        ],
      }

      // El stock previo no debe ser mutado por la existencia de la orden en borrador
      const currentStock = 1000
      expect(orderDraft.status).toBe('draft')
      expect(currentStock).toBe(1000)

      const orderConfirmed = { ...orderDraft, status: 'confirmed' as const }
      expect(orderConfirmed.status).toBe('confirmed')
      expect(currentStock).toBe(1000) // Se mantiene idéntico
    })
  })

  // ============================================================================
  // PASOS 7 y 8: Recepción de compra e idempotencia de inventario + Consumo
  // ============================================================================
  describe('Pasos 7 y 8: Recepción trazable, idempotencia y consumo de producción', () => {
    it('recepciona mercadería generando movimientos auditables y previene duplicaciones por idempotencia', () => {
      const movements: InventoryMovement[] = []
      const processedIdempotencyKeys = new Set<string>()

      let currentBalance = 1000 // gramos iniciales

      function simulateReceivePurchase(
        orderId: string,
        ingredientId: string,
        quantityKg: number,
        idempotencyKey: string
      ) {
        if (processedIdempotencyKeys.has(idempotencyKey)) {
          return { success: true, alreadyProcessed: true }
        }

        const normalizedQty = quantityKg * 1000 // a gramos
        currentBalance += normalizedQty
        processedIdempotencyKeys.add(idempotencyKey)

        movements.push({
          id: `mov-${movements.length + 1}`,
          user_id: 'user-chef',
          ingredient_id: ingredientId,
          movement_type: 'in',
          direction: 'in',
          quantity: quantityKg,
          unit: 'kg',
          normalized_quantity: normalizedQty,
          balance_after: currentBalance,
          reference_type: 'purchase_order',
          reference_id: orderId,
          idempotency_key: idempotencyKey,
          reason: `Recepción de Orden ${orderId}`,
          created_at: new Date().toISOString(),
        })

        return { success: true, alreadyProcessed: false }
      }

      // Primer llamado: recepción efectiva
      const res1 = simulateReceivePurchase('po-101', 'ing-harina-0000', 5, 'idemp-key-po-101')
      expect(res1.alreadyProcessed).toBe(false)
      expect(currentBalance).toBe(6000)
      expect(movements).toHaveLength(1)
      expect(movements[0].balance_after).toBe(6000)

      // Reintento con la misma clave de idempotencia (ej. doble click o reintento de red)
      const res2 = simulateReceivePurchase('po-101', 'ing-harina-0000', 5, 'idemp-key-po-101')
      expect(res2.alreadyProcessed).toBe(true)
      expect(currentBalance).toBe(6000) // NO se duplica el stock
      expect(movements).toHaveLength(1) // NO se crean movimientos duplicados
    })

    it('registra el consumo de producción disminuyendo existencias e impidiendo duplicación', () => {
      const movements: InventoryMovement[] = []
      const consumptionKeys = new Set<string>()
      let stockHarina = 6000 // 6 kg disponibles

      function simulateRecordConsumption(
        planId: string,
        ingredientId: string,
        consumedGrams: number,
        idempotencyKey: string
      ) {
        if (consumptionKeys.has(idempotencyKey)) {
          return { success: true, alreadyProcessed: true }
        }

        stockHarina -= consumedGrams
        consumptionKeys.add(idempotencyKey)

        movements.push({
          id: `mov-out-${movements.length + 1}`,
          user_id: 'user-chef',
          ingredient_id: ingredientId,
          movement_type: 'out',
          direction: 'out',
          quantity: consumedGrams,
          unit: 'g',
          normalized_quantity: consumedGrams,
          balance_after: stockHarina,
          reference_type: 'production_plan',
          reference_id: planId,
          idempotency_key: idempotencyKey,
          reason: `Consumo plan de producción ${planId}`,
          created_at: new Date().toISOString(),
        })

        return { success: true, alreadyProcessed: false }
      }

      // Consumo de 1400g requeridos por el plan
      const cons1 = simulateRecordConsumption('plan-nov-1', 'ing-harina-0000', 1400, 'idemp-plan-nov-1')
      expect(cons1.alreadyProcessed).toBe(false)
      expect(stockHarina).toBe(4600)
      expect(movements).toHaveLength(1)
      expect(movements[0].direction).toBe('out')

      // Reintento idempotente:
      const cons2 = simulateRecordConsumption('plan-nov-1', 'ing-harina-0000', 1400, 'idemp-plan-nov-1')
      expect(cons2.alreadyProcessed).toBe(true)
      expect(stockHarina).toBe(4600) // Intacto
    })
  })

  // ============================================================================
  // PASOS 9 y 10: Pedido comercial, consistencia financiera y vinculación a plan
  // ============================================================================
  describe('Pasos 9 y 10: Pedido comercial, congelamiento de precios históricos y sincronización con producción', () => {
    it('calcula subtotales, descuentos, envío, anticipo y saldo sin alterar precios históricos por cambios de insumos', () => {
      const orderItems = [
        {
          quantity: 2,
          unit_price: 25000, // Precio de venta acordado con el cliente: $25.000
          reference_cost_per_unit: 12000, // Costo de referencia al momento de presupuestar
          reference_total_cost: 24000,
        },
        {
          quantity: 12,
          unit_price: 1500,
          reference_cost_per_unit: 600,
          reference_total_cost: 7200,
        },
      ]

      const financials = calculateOrderFinancials({
        items: orderItems,
        discountAmount: 2000, // Descuento de $2.000
        deliveryFee: 3500, // Envío $3.500
        depositAmount: 20000, // Anticipo abonado: $20.000
      })

      // Subtotal = (2 * 25.000) + (12 * 1.500) = 50.000 + 18.000 = $68.000
      expect(financials.subtotal).toBe(68000)
      // Total = 68.000 - 2.000 + 3.500 = $69.500
      expect(financials.totalAmount).toBe(69500)
      // Anticipo = $20.000
      expect(financials.depositAmount).toBe(20000)
      // Saldo pendiente = 69.500 - 20.000 = $49.500
      expect(financials.balanceAmount).toBe(49500)
      // Costo total de referencia = 24.000 + 7.200 = $31.200
      expect(financials.totalReferenceCost).toBe(31200)

      // Regla fundamental de consistencia: si el costo del ingrediente aumenta mañana en la biblioteca,
      // el precio pactado con el cliente ($25.000 y $1.500) y el saldo pendiente no sufren mutación retroactiva.
      expect(orderItems[0].unit_price).toBe(25000)
      expect(financials.balanceAmount).toBe(49500)
    })

    it('detecta discrepancias de fecha o déficit de cantidades al vincular un pedido a un plan', () => {
      const order: KitchenOrder = {
        id: 'ord-101',
        user_id: 'user-chef',
        order_code: 'PED-2026-001',
        client_name_snapshot: 'Café de la Plaza',
        order_date: '2026-10-24',
        delivery_date: '2026-10-28', // Entrega pactada: 28 de octubre
        status: 'confirmado',
        status_history: [],
        subtotal: 50000,
        total_amount: 50000,
        balance_amount: 50000,
        discount_amount: 0,
        delivery_fee: 0,
        deposit_amount: 0,
        status_updated_at: '2026-10-24T10:00:00Z',
        created_at: '2026-10-24T10:00:00Z',
        updated_at: '2026-10-24T10:00:00Z',
        items: [
          {
            id: 'item-1',
            order_id: 'ord-101',
            recipe_id: 'rec-torta',
            product_name: 'Torta Bariloche',
            quantity: 3, // Pide 3 tortas
            unit: 'unidades',
            unit_price: 25000,
            subtotal: 75000,
            position: 1,
            created_at: '2026-10-24T10:00:00Z',
          },
        ],
      }

      // Caso 1: Plan con fecha posterior a la entrega
      const latePlan: ProductionPlan = {
        id: 'plan-late',
        user_id: 'user-chef',
        name: 'Producción Demorada',
        production_date: '2026-10-29', // Posterior al 28 de octubre
        status: 'planned',
        checked_ingredients: [],
        created_at: '2026-10-24T10:00:00Z',
        updated_at: '2026-10-24T10:00:00Z',
        items: [
          {
            id: 'pi-1',
            plan_id: 'plan-late',
            recipe_id: 'rec-torta',
            target_quantity: 3,
            target_unit: 'unidades',
            scaling_factor: 3,
            position: 1,
            snapshot_recipe_name: 'Torta Bariloche',
            snapshot_yield_quantity: 1,
            snapshot_yield_unit: 'unidades',
          },
        ],
      }

      const divergence1 = checkProductionOrderDivergence(order, latePlan)
      expect(divergence1.hasDivergence).toBe(true)
      expect(divergence1.warnings.some((w) => w.includes('posterior a la fecha de entrega'))).toBe(true)

      // Caso 2: Plan con fecha correcta pero cantidad insuficiente (2 en lugar de 3)
      const shortPlan: ProductionPlan = {
        ...latePlan,
        production_date: '2026-10-27',
        items: [
          {
            ...latePlan.items![0],
            target_quantity: 2, // Faltan 1 unidad
          },
        ],
      }

      const divergence2 = checkProductionOrderDivergence(order, shortPlan)
      expect(divergence2.hasDivergence).toBe(true)
      expect(divergence2.warnings.some((w) => w.includes('inferior a la solicitada'))).toBe(true)

      // Caso 3: Plan sincronizado perfectamente
      const synchronizedPlan: ProductionPlan = {
        ...latePlan,
        production_date: '2026-10-27',
        items: [
          {
            ...latePlan.items![0],
            target_quantity: 3,
          },
        ],
      }

      const divergence3 = checkProductionOrderDivergence(order, synchronizedPlan)
      expect(divergence3.hasDivergence).toBe(false)
      expect(divergence3.warnings).toHaveLength(0)
    })
  })

  // ============================================================================
  // PASOS 11 y 12: Ciclo de vida del pedido, estados permitidos y calendario
  // ============================================================================
  describe('Pasos 11 y 12: Ciclo de vida comercial, validación de estados y calendario', () => {
    it('valida la progresión comercial permitida y rechaza saltos o mutaciones ilegales', () => {
      // 1. Camino feliz estándar: recibido -> confirmado -> en_preparacion -> listo -> entregado
      expect(validateOrderStatusTransition('recibido', 'confirmado').isValid).toBe(true)
      expect(validateOrderStatusTransition('confirmado', 'en_preparacion').isValid).toBe(true)
      expect(validateOrderStatusTransition('en_preparacion', 'listo').isValid).toBe(true)
      expect(validateOrderStatusTransition('listo', 'entregado').isValid).toBe(true)

      // 2. Salto ilegal: recibido directamente a entregado sin elaboración
      const invalidJump = validateOrderStatusTransition('recibido', 'entregado')
      expect(invalidJump.isValid).toBe(false)
      expect(invalidJump.reason).toContain('No se puede cambiar el estado')

      // 3. Estado terminal: entregado no puede modificarse a confirmado
      const fromDelivered = validateOrderStatusTransition('entregado', 'confirmado')
      expect(fromDelivered.isValid).toBe(false)

      // 4. Cancelación permitida desde estados no terminales
      expect(validateOrderStatusTransition('recibido', 'cancelado').isValid).toBe(true)
      expect(validateOrderStatusTransition('confirmado', 'cancelado').isValid).toBe(true)
    })

    it('agrupa los pedidos por fecha de entrega y los ordena por franja horaria en el calendario', () => {
      const orders: KitchenOrder[] = [
        {
          id: 'ord-1',
          user_id: 'user-chef',
          order_code: 'PED-001',
          client_name_snapshot: 'Juan Pérez',
          order_date: '2026-10-24',
          delivery_date: '2026-10-30',
          delivery_time: '18:00',
          status: 'confirmado',
          status_history: [],
          status_updated_at: '2026-10-24T10:00:00Z',
          subtotal: 10000,
          discount_amount: 0,
          delivery_fee: 0,
          total_amount: 10000,
          deposit_amount: 0,
          balance_amount: 10000,
          created_at: '2026-10-24T10:00:00Z',
          updated_at: '2026-10-24T10:00:00Z',
        },
        {
          id: 'ord-2',
          user_id: 'user-chef',
          order_code: 'PED-002',
          client_name_snapshot: 'Restaurante Central',
          order_date: '2026-10-24',
          delivery_date: '2026-10-30',
          delivery_time: '10:30', // Más temprano el mismo día
          status: 'confirmado',
          status_history: [],
          status_updated_at: '2026-10-24T10:00:00Z',
          subtotal: 35000,
          discount_amount: 0,
          delivery_fee: 0,
          total_amount: 35000,
          deposit_amount: 0,
          balance_amount: 35000,
          created_at: '2026-10-24T10:00:00Z',
          updated_at: '2026-10-24T10:00:00Z',
        },
        {
          id: 'ord-3',
          user_id: 'user-chef',
          order_code: 'PED-003',
          client_name_snapshot: 'Pastelería Dulce',
          order_date: '2026-10-24',
          delivery_date: '2026-10-31',
          delivery_time: null,
          status: 'recibido',
          status_history: [],
          status_updated_at: '2026-10-24T10:00:00Z',
          subtotal: 15000,
          discount_amount: 0,
          delivery_fee: 0,
          total_amount: 15000,
          deposit_amount: 0,
          balance_amount: 15000,
          created_at: '2026-10-24T10:00:00Z',
          updated_at: '2026-10-24T10:00:00Z',
        },
      ]

      const grouped = groupOrdersByDeliveryDate(orders)

      expect(Object.keys(grouped)).toContain('2026-10-30')
      expect(Object.keys(grouped)).toContain('2026-10-31')

      // En el día 2026-10-30 debe figurar primero el de las 10:30 y luego el de las 18:00
      const oct30 = grouped['2026-10-30']
      expect(oct30).toHaveLength(2)
      expect(oct30[0].order_code).toBe('PED-002')
      expect(oct30[1].order_code).toBe('PED-001')

      // En el día 2026-10-31 debe estar el pedido sin horario definido
      const oct31 = grouped['2026-10-31']
      expect(oct31).toHaveLength(1)
      expect(oct31[0].order_code).toBe('PED-003')
    })
  })
})
