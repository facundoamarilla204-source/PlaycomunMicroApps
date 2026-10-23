import type { Metadata } from 'next'
import { getSuppliersServer, getSupplierIngredientsMapServer } from '@/app/actions/suppliers'
import { getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'
import { getProductionPlanByIdServer } from '@/app/actions/production-plans'
import { getIngredientStockSummariesServer } from '@/app/actions/inventory'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { calculateProductionPlan } from '@/lib/gastronomia/production-plan'
import { calculateProductionShortages } from '@/lib/gastronomia/inventory'
import { PurchaseOrderEditor } from '@/components/cocina-pro/compras/PurchaseOrderEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nueva Orden de Compra · Amasia',
  description: 'Confeccioná una orden de compra o borrador para proveedores en Amasia.',
}

interface PageProps {
  searchParams: Promise<{
    supplier_id?: string
    from_plan_id?: string
  }>
}

export default async function NuevaOrdenCompraPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supplierId = params.supplier_id
  const fromPlanId = params.from_plan_id

  const [suppliersRes, ingredientsRes, mapRes] = await Promise.all([
    getSuppliersServer(),
    getKitchenIngredientsServer(),
    getSupplierIngredientsMapServer(),
  ])

  const suppliers = suppliersRes.data || []
  const ingredients = ingredientsRes.data || []
  const supplierMap = mapRes.data || {}

  let prefillItems: any[] | undefined = undefined

  // Si proviene de un plan de producción, calcular los faltantes automáticamente
  if (fromPlanId) {
    const [planRes, stockRes, recipesRes] = await Promise.all([
      getProductionPlanByIdServer(fromPlanId),
      getIngredientStockSummariesServer(),
      getUserRecipesServer(),
    ])

    if (planRes.data && stockRes.data && recipesRes.data) {
      const recipesMap = new Map(recipesRes.data.map((r) => [r.id!, r]))
      const planItems = (planRes.data.items || []).map((it) => ({
        recipeId: it.recipe_id,
        targetQuantity: it.target_quantity,
        targetUnit: it.target_unit,
      }))

      const summary = calculateProductionPlan(
        planItems,
        (id) => recipesMap.get(id),
        undefined,
        new Set(planRes.data.checked_ingredients || [])
      )

      const shortages = calculateProductionShortages(
        summary.consolidatedIngredients,
        stockRes.data,
        supplierMap
      )

      // Filtrar únicamente los que tienen faltante > 0
      const actualShortages = shortages.filter((s) => !s.isCovered && s.packagesToOrder > 0)
      if (actualShortages.length > 0) {
        prefillItems = actualShortages.map((s) => {
          const ing = ingredients.find((i) => i.id === s.ingredientId)
          const unitPrice =
            s.packagesToOrder > 0 ? s.estimatedPurchaseCost / s.packagesToOrder : 0

          return {
            ingredient_id: s.ingredientId || '',
            ingredient_name: s.ingredientName,
            ordered_quantity: s.packagesToOrder,
            package_size: s.suggestedPackageSize,
            package_unit: s.suggestedPackageUnit,
            unit_price: unitPrice || Number(ing?.current_price) || 0,
          }
        })
      }
    }
  }

  return (
    <div className="animate-in fade-in duration-150 py-2">
      <PurchaseOrderEditor
        suppliers={suppliers}
        ingredients={ingredients}
        supplierIngredientsMap={supplierMap}
        prefillSupplierId={supplierId}
        prefillPlanId={fromPlanId}
        prefillItems={prefillItems}
      />
    </div>
  )
}
