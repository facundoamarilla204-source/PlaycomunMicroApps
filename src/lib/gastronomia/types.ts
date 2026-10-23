/**
 * Cocina Pro - Definiciones de Tipos del Modelo de Datos Gastronómico
 * Biblioteca personal de ingredientes, historial de precios, pasos de elaboración
 * y vinculaciones relacionales con recetas.
 */

import { Unit } from '../costo-receta'

/**
 * Ingrediente reutilizable de la biblioteca personal del usuario.
 */
export interface KitchenIngredient {
  id: string
  user_id: string
  name: string
  category?: string | null
  package_unit: Unit
  package_quantity: number
  current_price: number
  price_updated_at: string
  density_g_ml?: number | null
  density_source?: string | null
  is_flour: boolean
  is_water: boolean
  estimated_water_percentage?: number | null
  water_percentage_source?: string | null
  brand?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

/**
 * Input para crear un nuevo ingrediente en la biblioteca.
 */
export interface CreateKitchenIngredientInput {
  name: string
  category?: string | null
  package_unit: Unit
  package_quantity: number
  current_price: number
  density_g_ml?: number | null
  density_source?: string | null
  is_flour?: boolean
  is_water?: boolean
  estimated_water_percentage?: number | null
  water_percentage_source?: string | null
  brand?: string | null
  notes?: string | null
}

/**
 * Input para actualizar un ingrediente existente en la biblioteca.
 */
export interface UpdateKitchenIngredientInput extends Partial<CreateKitchenIngredientInput> {
  priceChangeReason?: string
}

/**
 * Registro histórico inmutable de cambio de precio de un ingrediente.
 */
export interface KitchenIngredientPriceHistory {
  id: string
  ingredient_id: string
  user_id: string
  previous_price: number
  new_price: number
  change_reason?: string | null
  recorded_at: string
}

/**
 * Paso de elaboración ordenado de una receta profesional.
 */
export interface RecipeStep {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
  duration_minutes?: number | null
  temperature_celsius?: number | null
  equipment?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

/**
 * Input para crear o editar un paso de elaboración.
 */
export interface RecipeStepInput {
  id?: string
  step_number: number
  instruction: string
  duration_minutes?: number | null
  temperature_celsius?: number | null
  equipment?: string | null
  notes?: string | null
}

/**
 * Ingrediente vinculado con su biblioteca y datos vigentes.
 */
export interface LinkedRecipeIngredient {
  recipeIngredientId: string
  recipeId: string
  name: string
  quantity: number
  unit: Unit
  // Precios guardados históricamente en la receta
  savedReferenceQuantity: number
  savedReferenceUnit: Unit
  savedReferencePrice: number
  savedCalculatedCost: number
  // Referencia a biblioteca
  ingredientId?: string | null
  libraryIngredient?: KitchenIngredient | null
  // Merma del ingrediente crudo
  wastePercentage?: number
  // Precios vigentes recalculados si está vinculado
  liveReferencePrice?: number
  liveCalculatedCost?: number
  hasPriceDivergence?: boolean
}

/**
 * Comparativa entre costeo guardado en receta y costeo con precios vigentes de la biblioteca.
 */
export interface RecipeLiveFinancialPreview {
  recipeId?: string
  recipeName: string
  savedCostTotal: number
  liveCostTotal: number
  differenceAmount: number
  percentageChange: number
  hasPriceDivergences: boolean
  linkedIngredientsCount: number
  unlinkedIngredientsCount: number
  items: Array<{
    name: string
    quantity: number
    unit: Unit
    savedCost: number
    liveCost: number
    difference: number
    isLinked: boolean
    ingredientName?: string
  }>
}

/**
 * Relación estructurada de subreceta incorporada en una receta principal.
 */
export interface RecipeSubrecipe {
  id: string
  recipe_id: string
  subrecipe_id: string
  quantity: number
  unit: Unit
  waste_percentage: number
  position: number
  notes?: string | null
  reference_yield_quantity?: number | null
  reference_yield_unit?: Unit | null
  reference_unit_cost?: number | null
  reference_total_cost?: number | null
  created_at?: string
  updated_at?: string
  // Metadatos de la subreceta resuelta para visualización inmediata
  subrecipe_name?: string
  subrecipe_yield_quantity?: number
  subrecipe_yield_unit?: Unit
  subrecipe_category?: string
}

/**
 * Input para crear o editar una relación de subreceta.
 */
export interface RecipeSubrecipeInput {
  id?: string
  subrecipe_id: string
  quantity: number
  unit: Unit
  waste_percentage?: number
  position?: number
  notes?: string | null
  reference_yield_quantity?: number | null
  reference_yield_unit?: Unit | null
  reference_unit_cost?: number | null
  reference_total_cost?: number | null
}

/**
 * Desglose financiero y proporcional de una subreceta incorporada.
 */
export interface SubrecipeFinancialItem {
  subrecipeRelationId: string
  subrecipeId: string
  subrecipeName: string
  netQuantity: number
  grossQuantity: number
  unit: Unit
  wastePercentage: number
  subrecipeYieldQuantity: number
  subrecipeYieldUnit: Unit
  subrecipeTotalCost: number
  subrecipeUnitCost: number
  calculatedCost: number
  percentageOfTotal: number
  savedHistoricalCost?: number | null
  hasCostDivergence: boolean
  hasYieldDivergence: boolean
  conversionError?: string | null
  isProvisional: boolean
  childSubrecipes?: SubrecipeFinancialItem[]
}

/**
 * Resultado completo del motor de costeo financiero para recetas compuestas.
 */
export interface CompositeRecipeFinancials {
  directIngredientsCost: number
  subrecipesCost: number
  additionalCosts: number
  totalCost: number
  unitCost: number
  suggestedPrice: number
  profitPerUnit: number
  totalProfit: number
  realMarginPct: number
  hasConversionErrors: boolean
  hasProvisionalCosts: boolean
  invalidItemsCount: number
  subrecipesBreakdown: SubrecipeFinancialItem[]
}

/**
 * Estado operativo de un plan de producción.
 */
export type ProductionPlanStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Item o receta incorporada dentro de un plan de producción.
 */
export interface ProductionPlanItem {
  id: string
  plan_id: string
  recipe_id: string
  target_quantity: number
  target_unit: string
  scaling_factor: number
  position: number
  notes?: string | null
  snapshot_recipe_name: string
  snapshot_yield_quantity: number
  snapshot_yield_unit: string
  snapshot_category?: string | null
  snapshot_cost_per_unit?: number | null
  snapshot_total_cost?: number | null
  created_at?: string
  updated_at?: string
}

/**
 * Plan de producción persistido en base de datos.
 */
export interface ProductionPlan {
  id: string
  user_id: string
  name: string
  production_date: string
  status: ProductionPlanStatus
  notes?: string | null
  checked_ingredients: string[]
  created_at: string
  updated_at: string
  items?: ProductionPlanItem[]
  items_count?: number
}

/**
 * Payload para guardar o actualizar un plan de producción.
 */
export interface SaveProductionPlanInput {
  id?: string
  name: string
  production_date?: string
  status?: ProductionPlanStatus
  notes?: string | null
  checked_ingredients?: string[]
  items: Array<{
    id?: string
    recipe_id: string
    target_quantity: number
    target_unit: string
    scaling_factor?: number
    position?: number
    notes?: string | null
    snapshot_recipe_name?: string
    snapshot_yield_quantity?: number
    snapshot_yield_unit?: string
    snapshot_category?: string | null
    snapshot_cost_per_unit?: number | null
    snapshot_total_cost?: number | null
  }>
}

/**
 * Proveedor gastronómico.
 */
export interface Supplier {
  id: string
  user_id: string
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  ingredients_count?: number
}

/**
 * Presentación comercial de un ingrediente provista por un proveedor.
 */
export interface SupplierIngredient {
  id: string
  user_id: string
  supplier_id: string
  ingredient_id: string
  package_size: number
  package_unit: string
  price: number
  supplier_code?: string | null
  notes?: string | null
  is_preferred: boolean
  last_purchased_at?: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
  ingredient?: KitchenIngredient
}

/**
 * Tipo de movimiento de stock en inventario.
 */
export type InventoryMovementType =
  | 'initial'
  | 'in'
  | 'out'
  | 'adjustment'
  | 'compensation'

/**
 * Dirección del flujo de inventario.
 */
export type InventoryMovementDirection = 'in' | 'out'

/**
 * Registro auditable de movimiento de inventario.
 */
export interface InventoryMovement {
  id: string
  user_id: string
  ingredient_id: string
  ingredient_name?: string
  movement_type: InventoryMovementType
  direction: InventoryMovementDirection
  quantity: number
  unit: string
  normalized_quantity: number
  balance_after: number
  reference_type?:
    | 'purchase_order'
    | 'production_plan'
    | 'manual'
    | 'inventory_audit'
    | 'correction'
    | null
  reference_id?: string | null
  idempotency_key?: string | null
  reason?: string | null
  lot_number?: string | null
  expiration_date?: string | null
  unit_cost?: number | null
  created_at: string
}

/**
 * Resumen de existencias y valorización por ingrediente.
 */
export interface IngredientStockSummary {
  ingredient_id: string
  ingredient_name: string
  category?: string | null
  current_balance: number
  package_unit: string
  reference_package_size: number
  current_price: number
  total_value: number
  last_movement_at?: string | null
  expiring_soon_count?: number
}

/**
 * Estados del ciclo de vida de una orden de compra.
 */
export type PurchaseOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'received'
  | 'partially_received'
  | 'cancelled'

/**
 * Orden de compra a proveedor.
 */
export interface PurchaseOrder {
  id: string
  user_id: string
  order_number: string
  supplier_id?: string | null
  supplier_name: string
  status: PurchaseOrderStatus
  issue_date: string
  expected_delivery_date?: string | null
  received_at?: string | null
  subtotal: number
  shipping_cost: number
  taxes_amount: number
  discount_amount: number
  total: number
  notes?: string | null
  origin_plan_id?: string | null
  items?: PurchaseOrderItem[]
  items_count?: number
  created_at: string
  updated_at: string
}

/**
 * Línea o ítem dentro de una orden de compra.
 */
export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  ingredient_id?: string | null
  ingredient_name: string
  ordered_quantity: number
  package_size: number
  package_unit: string
  unit_price: number
  total_price: number
  received_quantity: number
  lot_number?: string | null
  expiration_date?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Comparación de necesidades de producción contra existencias de inventario.
 */
export interface InventoryShortageComparison {
  ingredientId?: string | null
  ingredientName: string
  requiredGrossQuantity: number
  requiredUnit: string
  availableStock: number
  stockUnit: string
  shortageQuantity: number
  isCovered: boolean
  isProvisional: boolean
  suggestedPackageSize: number
  suggestedPackageUnit: string
  packagesToOrder: number
  estimatedPurchaseCost: number
  preferredSupplierId?: string | null
  preferredSupplierName?: string | null
  warnings: string[]
}

/**
 * Cliente registrado en el directorio gastronómico de Amasia.
 */
export interface KitchenClient {
  id: string
  user_id: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  orders_count?: number
}

/**
 * Input para crear o actualizar un cliente.
 */
export interface SaveKitchenClientInput {
  id?: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active?: boolean
}

/**
 * Estados del ciclo de vida de un pedido gastronómico.
 */
export type KitchenOrderStatus =
  | 'recibido'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado'

/**
 * Registro individual en la auditoría de cambios de estado del pedido.
 */
export interface KitchenOrderStatusHistoryItem {
  status: KitchenOrderStatus
  timestamp: string
  note?: string
  user_email?: string
}

/**
 * Línea o producto dentro de un pedido comercial.
 */
export interface KitchenOrderItem {
  id: string
  order_id: string
  recipe_id?: string | null
  product_name: string
  quantity: number
  unit: string
  unit_price: number
  subtotal: number
  reference_cost_per_unit?: number | null
  reference_total_cost?: number | null
  notes?: string | null
  position: number
  created_at?: string
}

/**
 * Pedido comercial completo de Amasia.
 */
export interface KitchenOrder {
  id: string
  user_id: string
  order_code: string
  client_id?: string | null
  client_name_snapshot: string
  client_contact_snapshot?: string | null
  order_date: string
  delivery_date: string
  delivery_time?: string | null
  status: KitchenOrderStatus
  status_updated_at: string
  notes?: string | null
  subtotal: number
  discount_amount: number
  delivery_fee: number
  total_amount: number
  deposit_amount: number
  balance_amount: number
  status_history: KitchenOrderStatusHistoryItem[]
  items?: KitchenOrderItem[]
  items_count?: number
  linked_plans?: Array<{
    plan_id: string
    plan_name: string
    production_date: string
    status: ProductionPlanStatus
  }>
  created_at: string
  updated_at: string
}

/**
 * Payload para guardar o actualizar un pedido comercial.
 */
export interface SaveKitchenOrderInput {
  id?: string
  order_code?: string
  client_id?: string | null
  client_name_snapshot: string
  client_contact_snapshot?: string | null
  order_date?: string
  delivery_date: string
  delivery_time?: string | null
  status?: KitchenOrderStatus
  notes?: string | null
  discount_amount?: number
  delivery_fee?: number
  deposit_amount?: number
  items: Array<{
    id?: string
    recipe_id?: string | null
    product_name: string
    quantity: number
    unit?: string
    unit_price: number
    subtotal?: number
    reference_cost_per_unit?: number | null
    reference_total_cost?: number | null
    notes?: string | null
    position?: number
  }>
  status_history?: KitchenOrderStatusHistoryItem[]
}

/**
 * Vinculación entre un pedido comercial y un plan de producción.
 */
export interface OrderProductionPlanLink {
  id: string
  user_id: string
  order_id: string
  plan_id: string
  linked_at: string
  notes?: string | null
  order?: KitchenOrder
  plan?: ProductionPlan
}

/**
 * Resumen financiero y de margen calculado para un pedido comercial.
 */
export interface OrderFinancialSummary {
  subtotal: number
  discountAmount: number
  deliveryFee: number
  totalAmount: number
  depositAmount: number
  balanceAmount: number
  totalReferenceCost: number
  estimatedProfit: number
  estimatedMarginPct: number
  hasMissingCosts: boolean
}



