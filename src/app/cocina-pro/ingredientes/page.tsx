import type { Metadata } from 'next'
import { getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'
import { IngredientsManager } from '@/components/cocina-pro/ingredientes/IngredientsManager'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Biblioteca de Ingredientes · Cocina Pro',
  description:
    'Administrá tu biblioteca personal de insumos, presentaciones de compra e historial inmutable de precios.',
}

export default async function CocinaProIngredientsPage() {
  const { data } = await getKitchenIngredientsServer()

  return (
    <div className="animate-in fade-in duration-150">
      <IngredientsManager initialIngredients={data || []} />
    </div>
  )
}
