import type { Metadata } from 'next'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { BakersCalculator } from '@/components/cocina-pro/panaderia/BakersCalculator'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Calculadora de Panadería y Porcentaje Panadero · Cocina Pro',
  description:
    'Calculá porcentajes panaderos, balanceá hidratación tradicional y de líquidos, y formulá recetas de pan y pizza en Cocina Pro.',
}

export default async function CocinaProPanaderiaPage() {
  const result = await getUserRecipesServer()
  const recipes = result.data || []

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-150">
      <BakersCalculator initialRecipes={recipes} />
    </div>
  )
}
