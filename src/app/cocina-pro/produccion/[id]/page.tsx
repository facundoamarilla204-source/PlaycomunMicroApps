import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { getProductionPlanByIdServer } from '@/app/actions/production-plans';
import { getUserRecipesServer } from '@/app/actions/recipes';
import { ProductionPlanEditor } from '@/components/cocina-pro/produccion/ProductionPlanEditor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Plan de Producción · Amasia',
  description:
    'Editá tu plan de producción, ajustá cantidades y revisá la lista consolidada de compras.',
};

interface EditProductionPlanPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductionPlanPage({
  params,
}: EditProductionPlanPageProps) {
  const { id } = await params;
  const [planResult, recipesResult] = await Promise.all([
    getProductionPlanByIdServer(id),
    getUserRecipesServer(),
  ]);

  if (planResult.error || !planResult.data) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-50 border border-violet-200/80 flex items-center justify-center text-[#7f22fe]">
          <ChefHat className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2 font-sans">
          Plan de producción no encontrado
        </h1>
        <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto font-sans">
          El plan de producción solicitado no existe o no tenés permisos para visualizarlo.
        </p>
        <Link
          href="/cocina-pro/produccion"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#7f22fe] hover:bg-[#6c1ce0] rounded-xl transition-all shadow-xs min-h-[44px] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al planificador</span>
        </Link>
      </div>
    );
  }

  const recipes = recipesResult.data || [];

  return (
    <div className="animate-in fade-in duration-150">
      <ProductionPlanEditor
        initialPlan={planResult.data}
        initialItems={planResult.data.items || []}
        userRecipes={recipes}
      />
    </div>
  );
}
