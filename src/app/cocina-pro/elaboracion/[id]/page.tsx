import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react'
import { getRecipeByIdServer } from '@/app/actions/recipes'
import { CookingSession } from '@/components/cocina-pro/elaboracion/CookingSession'

export const dynamic = 'force-dynamic'

interface CookingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CookingPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: recipe } = await getRecipeByIdServer(id)

  if (!recipe) {
    return {
      title: 'Elaboración no encontrada · Amasia',
    }
  }

  return {
    title: `Elaborando: ${recipe.name} · Amasia`,
    description: `Seguí el paso a paso, tiempos de cocción y mise en place para ${recipe.name} en Amasia.`,
  }
}

export default async function CocinaProElaboracionPage({ params }: CookingPageProps) {
  const { id } = await params
  const { data: recipe, error, isLocked } = await getRecipeByIdServer(id)

  if (isLocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-purple-100 text-brand flex items-center justify-center mx-auto">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Función exclusiva Amasia</h2>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          El modo de elaboración paso a paso en cocina requiere una suscripción Pro activa.
        </p>
        <Link
          href="/cocina-pro"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Amasia</span>
        </Link>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Receta no encontrada</h2>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {error || 'La receta seleccionada no existe o no tenés permisos para visualizarla.'}
        </p>
        <Link
          href="/cocina-pro/recetas"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al recetario</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-150">
      <CookingSession recipe={recipe} />
    </div>
  )
}
