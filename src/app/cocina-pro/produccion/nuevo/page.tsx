import type { Metadata } from 'next';
import { getUserRecipesServer } from '@/app/actions/recipes';
import { ProductionPlanEditor } from '@/components/cocina-pro/produccion/ProductionPlanEditor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nuevo Plan de Producción · Amasia',
  description:
    'Creá un plan de producción gastronómica, calculá ingredientes consolidados y estimá costos de insumos.',
};

interface NewProductionPlanPageProps {
  searchParams: Promise<{
    addRecipeId?: string;
  }>;
}

export default async function NewProductionPlanPage({
  searchParams,
}: NewProductionPlanPageProps) {
  const resolvedParams = await searchParams;
  const result = await getUserRecipesServer();
  const recipes = result.data || [];

  return (
    <div className="animate-in fade-in duration-150">
      <ProductionPlanEditor
        userRecipes={recipes}
        preselectedRecipeId={resolvedParams.addRecipeId}
      />
    </div>
  );
}
