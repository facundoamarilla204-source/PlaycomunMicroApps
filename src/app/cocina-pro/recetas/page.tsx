import type { Metadata } from 'next'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { RecipesViewer } from '@/components/cocina-pro/recetas/RecipesViewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Recetario Profesional · Cocina Pro',
  description:
    'Consultá tus recetas guardadas, ingredientes, rendimientos y costos de elaboración en Cocina Pro.',
}

export default async function CocinaProRecipesPage() {
  const result = await getUserRecipesServer()
  const recipes = result.data || []

  return (
    <div className="animate-in fade-in duration-150">
      <RecipesViewer initialRecipes={recipes} />
    </div>
  )
}
