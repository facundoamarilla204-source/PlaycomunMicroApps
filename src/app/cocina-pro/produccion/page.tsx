import type { Metadata } from 'next';
import { getProductionPlansServer } from '@/app/actions/production-plans';
import { ProductionPlansList } from '@/components/cocina-pro/produccion/ProductionPlansList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Planificador de Producción · Amasia',
  description:
    'Planificá lotes de elaboración gastronómica, escalá recetas y generá listas consolidadas de compras en Amasia.',
};

export default async function CocinaProProduccionPage() {
  const result = await getProductionPlansServer();
  const plans = result.data || [];

  return (
    <div className="animate-in fade-in duration-150">
      <ProductionPlansList initialPlans={plans} />
    </div>
  );
}
