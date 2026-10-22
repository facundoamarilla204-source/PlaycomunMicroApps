import type { Metadata } from 'next'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { RecipesViewer } from '@/components/cocina-pro/recetas/RecipesViewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Recetario Profesional · Amasia',
  description:
    'Consultá tus recetas guardadas, ingredientes, rendimientos y costos de elaboración en Amasia.',
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
