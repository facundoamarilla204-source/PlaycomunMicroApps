import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookX } from 'lucide-react'
import { getRecipeByIdServer, getUserRecipesServer } from '@/app/actions/recipes'
import { getRecipeStepsServer } from '@/app/actions/recipe-steps'
import { getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'
import { RecipeEditor } from '@/components/cocina-pro/recetas/editor/RecipeEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Editar Receta · Amasia',
  description: 'Modificá ingredientes, mermas, rendimientos, costos y pasos de elaboración de tu receta técnica en Amasia.',
}

export default async function EditarRecetaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [recipeRes, stepsRes, ingredientsRes, userRecipesRes] = await Promise.all([
    getRecipeByIdServer(id),
    getRecipeStepsServer(id),
    getKitchenIngredientsServer(),
    getUserRecipesServer(),
  ])

  if (recipeRes.error || !recipeRes.data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
        <BookX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h1 className="text-base sm:text-lg font-bold text-slate-900">
          Receta no encontrada
        </h1>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
          {recipeRes.error || 'La receta solicitada no existe, fue eliminada o no pertenece a tu cuenta.'}
        </p>
        <div className="mt-6">
          <Link
            href="/cocina-pro/recetas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-xs min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mis recetas</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-150">
      <RecipeEditor
        initialRecipe={recipeRes.data}
        initialSteps={stepsRes.data}
        libraryIngredients={ingredientsRes.data || []}
        availableRecipes={userRecipesRes.data || []}
        mode="edit"
      />
    </div>
  )
}
