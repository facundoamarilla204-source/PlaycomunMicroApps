'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  ChefHat,
  Search,
  Layers,
  ArrowRight,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductionPlan, ProductionPlanStatus } from '@/lib/gastronomia/types';
import { deleteProductionPlanServer } from '@/app/actions/production-plans';

interface ProductionPlansListProps {
  initialPlans: ProductionPlan[];
}

const statusConfig: Record<
  ProductionPlanStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  draft: {
    label: 'Borrador',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  planned: {
    label: 'Planificado',
    bg: 'bg-violet-50',
    text: 'text-violet-900',
    border: 'border-violet-200/80',
  },
  in_progress: {
    label: 'En producción',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
  },
  completed: {
    label: 'Completado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export function ProductionPlansList({ initialPlans }: ProductionPlansListProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<ProductionPlan[]>(initialPlans);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || plan.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    const ok = window.confirm(`¿Deseas eliminar el plan "${name}"?`);
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteProductionPlanServer(id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || 'No se pudo eliminar el plan.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              Obrador y Cocina
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Amasia</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans flex items-center gap-2.5">
            <ChefHat className="w-6 h-6 text-[#7f22fe]" />
            Planificador de Producción ({plans.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Planificá qué recetas vas a elaborar, escalá sus cantidades automáticamente y obtené
            la lista consolidada de compras sin sumar ingredientes a mano.
          </p>
        </div>

        <Link
          href="/cocina-pro/produccion/nuevo"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] rounded-xl shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Crear Nuevo Plan</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de plan..."
            className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-all placeholder:text-slate-400 min-h-[44px]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all min-h-[38px] active:scale-[0.98] ${
              selectedStatus === 'all'
                ? 'bg-[#7f22fe] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({plans.length})
          </button>
          {(['draft', 'planned', 'in_progress', 'completed'] as ProductionPlanStatus[]).map(
            (st) => {
              const count = plans.filter((p) => p.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all min-h-[38px] active:scale-[0.98] ${
                    selectedStatus === st
                      ? 'bg-[#7f22fe] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {statusConfig[st].label} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-50 border border-violet-200/80 flex items-center justify-center text-[#7f22fe]">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-sans mb-1">
            {plans.length === 0
              ? 'Aún no creaste planes de producción'
              : 'No se encontraron planes con los filtros actuales'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
            {plans.length === 0
              ? 'Un plan de producción te permite seleccionar tus recetas, definir las unidades deseadas para un día o pedido especial y calcular automáticamente todos los ingredientes y costos.'
              : 'Probá modificando el término de búsqueda o seleccionando otro estado.'}
          </p>
          <Link
            href="/cocina-pro/produccion/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#7f22fe] hover:bg-[#6c1ce0] rounded-xl shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Crear primer plan de producción</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredPlans.map((plan) => {
              const st = statusConfig[plan.status] || statusConfig.draft;
              const formattedDate = plan.production_date
                ? new Date(plan.production_date + 'T12:00:00').toLocaleDateString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Sin fecha';

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#7f22fe]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Date & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="capitalize">{formattedDate}</span>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    {/* Plan Name */}
                    <h2 className="text-base font-bold text-slate-900 font-sans group-hover:text-[#7f22fe] transition-colors line-clamp-1 mb-2">
                      {plan.name}
                    </h2>

                    {/* Notes preview if any */}
                    {plan.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        {plan.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id, plan.name)}
                      disabled={isPending}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                      title="Eliminar plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/cocina-pro/produccion/${plan.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-violet-50 hover:text-violet-900 border border-transparent hover:border-violet-200/60 rounded-xl transition-all active:scale-[0.98] min-h-[38px]"
                    >
                      <span>Abrir plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
