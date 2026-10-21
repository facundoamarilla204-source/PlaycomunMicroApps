import type { Metadata } from 'next'
import { getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'
import { getUserRecipesServer } from '@/app/actions/recipes'
import { RecipeEditor } from '@/components/cocina-pro/recetas/editor/RecipeEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nueva Receta · Cocina Pro',
  description: 'Creá una nueva receta técnica con escandallo dinámico, ingredientes de tu biblioteca y pasos de elaboración en Cocina Pro.',
}

export default async function NuevaRecetaPage() {
  const [ingredientsRes, recipesRes] = await Promise.all([
    getKitchenIngredientsServer(),
    getUserRecipesServer(),
  ])
  const libraryIngredients = ingredientsRes.data || []
  const availableRecipes = recipesRes.data || []

  return (
    <div className="animate-in fade-in duration-150">
      <RecipeEditor
        libraryIngredients={libraryIngredients}
        availableRecipes={availableRecipes}
        mode="create"
      />
    </div>
  )
}
