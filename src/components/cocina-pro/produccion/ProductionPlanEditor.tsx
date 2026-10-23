'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Save,
  Trash2,
  Plus,
  ArrowLeft,
  ChefHat,
  ShoppingCart,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
  Coins,
  PackageCheck,
  Boxes,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '@/lib/costo-receta';
import type {
  ProductionPlan,
  ProductionPlanItem,
  ProductionPlanStatus,
} from '@/lib/gastronomia/types';
import {
  calculateProductionPlan,
  type ProductionPlanRecipeInput,
  type ProductionPlanSummary,
} from '@/lib/gastronomia/production-plan';
import { formatCurrency } from '@/lib/costo-receta';
import { RecipePickerModal } from './RecipePickerModal';
import { ConsolidatedShoppingList } from './ConsolidatedShoppingList';
import { PrintableProductionSheet } from './PrintableProductionSheet';
import { ProductionShortagesTab } from './ProductionShortagesTab';
import {
  saveProductionPlanServer,
  deleteProductionPlanServer,
  togglePlanIngredientCheckedServer,
} from '@/app/actions/production-plans';

interface ProductionPlanEditorProps {
  initialPlan?: ProductionPlan | null;
  initialItems?: ProductionPlanItem[];
  userRecipes: Recipe[];
  preselectedRecipeId?: string;
}

export interface LocalPlanItem {
  recipeId: string;
  recipeName: string;
  category: string;
  targetQuantity: number;
  targetUnit: string;
  baseYieldQuantity: number;
  baseYieldUnit: string;
  notes?: string;
}

export function ProductionPlanEditor({
  initialPlan,
  initialItems = [],
  userRecipes,
  preselectedRecipeId,
}: ProductionPlanEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic Form State
  const [planId, setPlanId] = useState<string | undefined>(initialPlan?.id);
  const [name, setName] = useState<string>(
    initialPlan?.name ||
      `Producción ${new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      })}`
  );
  const [productionDate, setProductionDate] = useState<string>(
    initialPlan?.production_date || new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<ProductionPlanStatus>(
    initialPlan?.status || 'draft'
  );
  const [notes, setNotes] = useState<string>(initialPlan?.notes || '');

  // Active Tab: 'items' | 'shopping' | 'shortages' | 'print'
  const [activeTab, setActiveTab] = useState<'items' | 'shopping' | 'shortages' | 'print'>('items');

  // Recipes lookup map
  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    userRecipes.forEach((r) => {
      if (r.id) map.set(r.id, r);
    });
    return map;
  }, [userRecipes]);

  // Items State
  const [items, setItems] = useState<LocalPlanItem[]>(() => {
    if (initialItems.length > 0) {
      return initialItems.map((item) => {
        const recipe = recipesMap.get(item.recipe_id);
        return {
          recipeId: item.recipe_id,
          recipeName: item.snapshot_recipe_name || recipe?.name || 'Receta',
          category: recipe?.category || '',
          targetQuantity: item.target_quantity,
          targetUnit: item.target_unit,
          baseYieldQuantity: item.snapshot_yield_quantity || recipe?.yield_quantity || 1,
          baseYieldUnit: item.snapshot_yield_unit || recipe?.yield_unit || 'unidades',
          notes: item.notes || '',
        };
      });
    }

    if (preselectedRecipeId && recipesMap.has(preselectedRecipeId)) {
      const r = recipesMap.get(preselectedRecipeId)!;
      return [
        {
          recipeId: r.id || preselectedRecipeId,
          recipeName: r.name,
          category: r.category || '',
          targetQuantity: r.yield_quantity || 1,
          targetUnit: r.yield_unit || 'unidades',
          baseYieldQuantity: r.yield_quantity || 1,
          baseYieldUnit: r.yield_unit || 'unidades',
          notes: '',
        },
      ];
    }

    return [];
  });

  // Modal Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Status & Feedback
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Checked ingredients for shopping list
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (initialPlan?.checked_ingredients && Array.isArray(initialPlan.checked_ingredients)) {
      initialPlan.checked_ingredients.forEach((key: string) => {
        set.add(key);
      });
    }
    return set;
  });

  // Reactive Calculation Engine
  const summary: ProductionPlanSummary = useMemo(() => {
    const plannedInputs: ProductionPlanRecipeInput[] = items.map((i) => ({
      recipeId: i.recipeId,
      targetQuantity: i.targetQuantity,
      targetUnit: i.targetUnit,
      notes: i.notes,
    }));
    const resolveRecipe = (id: string) => recipesMap.get(id);
    return calculateProductionPlan(plannedInputs, resolveRecipe, undefined, checkedKeys);
  }, [items, recipesMap, checkedKeys]);

  // Handlers for modifying items
  const handleAddRecipe = (recipe: Recipe) => {
    if (!recipe.id) return;
    const rId = recipe.id;
    setItems((prev) => {
      const existing = prev.find((i) => i.recipeId === rId);
      if (existing) return prev;

      return [
        ...prev,
        {
          recipeId: rId,
          recipeName: recipe.name,
          category: recipe.category || '',
          targetQuantity: recipe.yield_quantity || 1,
          targetUnit: recipe.yield_unit || 'unidades',
          baseYieldQuantity: recipe.yield_quantity || 1,
          baseYieldUnit: recipe.yield_unit || 'unidades',
          notes: '',
        },
      ];
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0 || isNaN(quantity)) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], targetQuantity: quantity };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleChecked = (key: string, isChecked: boolean) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (isChecked) next.add(key);
      else next.delete(key);
      return next;
    });

    if (planId) {
      startTransition(async () => {
        await togglePlanIngredientCheckedServer(planId, key, isChecked);
      });
    }
  };

  // Save Plan
  const handleSave = () => {
    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Ingresá un nombre para el plan de producción.' });
      return;
    }

    if (items.length === 0) {
      setSaveMessage({
        type: 'error',
        text: 'Agregá al menos una receta para guardar el plan de producción.',
      });
      return;
    }

    setSaveMessage(null);

    startTransition(async () => {
      const result = await saveProductionPlanServer({
        id: planId,
        name: name.trim(),
        production_date: productionDate,
        status,
        notes: notes.trim(),
        checked_ingredients: Array.from(checkedKeys),
        items: items.map((item, idx) => ({
          recipe_id: item.recipeId,
          target_quantity: item.targetQuantity,
          target_unit: item.targetUnit,
          position: idx,
          notes: item.notes || '',
          snapshot_recipe_name: item.recipeName,
          snapshot_yield_quantity: item.baseYieldQuantity,
          snapshot_yield_unit: item.baseYieldUnit,
        })),
      });

      if (result.error || !result.data) {
        setSaveMessage({
          type: 'error',
          text: result.error || 'Error al guardar el plan de producción.',
        });
      } else {
        setSaveMessage({
          type: 'success',
          text: 'Plan de producción guardado con éxito.',
        });
        setPlanId(result.data.id);
        if (!planId) {
          router.replace(`/cocina-pro/produccion/${result.data.id}`);
        }
      }
    });
  };

  // Delete Plan
  const handleDelete = () => {
    if (!planId) return;
    const ok = window.confirm(
      '¿Estás seguro de que deseas eliminar este plan de producción? Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteProductionPlanServer(planId);
      if (result.success) {
        router.push('/cocina-pro/produccion');
      } else {
        setSaveMessage({
          type: 'error',
          text: result.error || 'No se pudo eliminar el plan.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/cocina-pro/produccion')}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.98]"
            title="Volver a planes de producción"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
                Obrador y Cocina
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Amasia</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-[#7f22fe] inline-block" />
              {initialPlan ? 'Editar Plan de Producción' : 'Nuevo Plan de Producción'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {planId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="p-2.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Eliminar este plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Imprimir Ficha</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] active:scale-[0.98] rounded-xl shadow-xs transition-all disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Guardando...' : 'Guardar Plan'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveMessage(null)}
              className="text-stone-400 hover:text-stone-700 font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Header Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Plan Name */}
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nombre del plan
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Producción Fin de Semana, Pedido Boda 24/10..."
              className="w-full px-3.5 py-2.5 text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all min-h-[44px]"
            />
          </div>

          {/* Production Date */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Fecha de elaboración
            </label>
            <div className="relative">
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all min-h-[44px]"
              />
              <Calendar className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Status */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Estado del plan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductionPlanStatus)}
              className="w-full px-3 py-2.5 text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all min-h-[44px]"
            >
              <option value="draft">Borrador</option>
              <option value="planned">Planificado</option>
              <option value="in_progress">En producción</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-12">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Indicaciones u observaciones del obrador (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Comenzar fermentaciones en bloque a las 06:00 hs. Hornear panes antes que la pastelería fina..."
              className="w-full px-3.5 py-2 text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Global Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-0.5">
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
              Recetas en plan
            </div>
            <p className="text-base font-bold text-stone-900">
              {summary.items.length}
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-0.5">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              Insumos consolidados
            </div>
            <p className="text-base font-bold text-stone-900">
              {summary.consolidatedIngredients.length}
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-0.5">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              Costo insumos estimado
            </div>
            <p className="text-base font-bold text-amber-900">
              {formatCurrency(summary.totalEstimatedCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'items'
              ? 'border-[#7f22fe] text-violet-900 bg-violet-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Elaboraciones a producir</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 font-bold">
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shopping')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'shopping'
              ? 'border-[#7f22fe] text-violet-900 bg-violet-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>2. Lista consolidada de compras</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-violet-100 text-violet-900 font-bold">
            {summary.consolidatedIngredients.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shortages')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'shortages'
              ? 'border-[#7f22fe] text-violet-900 bg-violet-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>3. Control de stock y faltantes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('print')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'print'
              ? 'border-[#7f22fe] text-violet-900 bg-violet-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>4. Hoja imprimible de obrador</span>
        </button>
      </div>

      {/* TAB 1: Items / Elaboraciones */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Recetas seleccionadas para este lote
              </h2>
              <p className="text-xs text-slate-500">
                Indicá la cantidad de unidades o peso que necesitás producir de cada receta.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 rounded-xl shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-[#7f22fe]" />
              <span>Añadir receta al plan</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet-50 border border-violet-200/80 flex items-center justify-center text-[#7f22fe]">
                <ChefHat className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-sans mb-1">
                No hay recetas en este plan de producción
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Seleccioná las recetas que vas a elaborar en tu cocina u obrador. Podés elegir
                tortas, panes, alfajores o subrecetas independientes.
              </p>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#7f22fe] hover:bg-[#6c1ce0] rounded-xl shadow-xs transition-all active:scale-[0.98] min-h-[44px]"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Explorar mi recetario</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.items.map((calculated, idx) => {
                const itemRef = items[idx];
                return (
                  <motion.div
                    key={calculated.recipeId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 bg-white border border-stone-200 rounded-2xl shadow-xs hover:border-amber-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Recipe Name & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                            #{idx + 1}
                          </span>
                          {calculated.category && (
                            <span className="text-[10px] font-medium text-stone-500">
                              {calculated.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-stone-900 truncate">
                          {calculated.recipeName}
                        </h3>

                        {/* Subrecipes Callout */}
                        {calculated.expandedSubrecipes.length > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-800">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Subrecetas incluidas:{' '}
                              <strong>
                                {calculated.expandedSubrecipes.map((s) => s.subrecipeName).join(', ')}
                              </strong>
                            </span>
                          </div>
                        )}

                        <div className="mt-1 text-xs text-stone-500">
                          Rendimiento base:{' '}
                          <span className="font-semibold text-stone-700">
                            {calculated.baseYieldQuantity} {calculated.baseYieldUnit}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity Controls & Scaling Factor */}
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-start sm:self-center">
                        {/* Target Stepper */}
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-[10px] font-semibold text-stone-500 mb-1">
                            A producir ({calculated.targetUnit})
                          </span>
                          <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                            <button
                              type="button"
                              onClick={() => {
                                const step = calculated.baseYieldQuantity || 1;
                                handleUpdateQuantity(
                                  idx,
                                  Math.max(1, calculated.targetQuantity - step)
                                );
                              }}
                              className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-200 active:scale-90 font-bold transition-all"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={calculated.targetQuantity}
                              onChange={(e) =>
                                handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 h-9 text-center text-xs font-bold text-stone-900 bg-white border-x border-stone-200 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const step = calculated.baseYieldQuantity || 1;
                                handleUpdateQuantity(idx, calculated.targetQuantity + step);
                              }}
                              className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-200 active:scale-90 font-bold transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Scaling Factor Badge */}
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-stone-500 block mb-0.5">
                            Factor
                          </span>
                          <span className="inline-block px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 rounded-lg">
                            ×{calculated.scalingFactor.toFixed(2)}
                          </span>
                        </div>

                        {/* Cost */}
                        <div className="text-right min-w-[80px]">
                          <span className="text-[10px] font-semibold text-stone-500 block mb-0.5">
                            Costo insumos
                          </span>
                          <span className="text-xs font-bold text-stone-900">
                            {formatCurrency(calculated.estimatedCost)}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90 min-h-[40px]"
                          title="Quitar receta del plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-2xl text-xs font-bold text-stone-600 hover:text-amber-800 transition-all flex items-center justify-center gap-2 active:scale-98 min-h-[44px]"
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Añadir otra receta al lote</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Consolidated Shopping List */}
      {activeTab === 'shopping' && (
        <ConsolidatedShoppingList
          summary={summary}
          onToggleChecked={handleToggleChecked}
        />
      )}

      {/* TAB 3: Control de Stock y Faltantes */}
      {activeTab === 'shortages' && (
        <ProductionShortagesTab
          planId={planId}
          planName={name}
          status={status}
          consolidatedIngredients={summary.consolidatedIngredients}
          onPlanStatusChanged={(newStatus) => setStatus(newStatus)}
        />
      )}

      {/* TAB 4: Printable Sheet */}
      {activeTab === 'print' && (
        <PrintableProductionSheet
          planName={name}
          productionDate={productionDate}
          notes={notes}
          summary={summary}
          onBack={() => setActiveTab('items')}
        />
      )}

      {/* Recipe Picker Modal */}
      <RecipePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        recipes={userRecipes}
        alreadySelectedIds={items.map((i) => i.recipeId)}
        onSelectRecipe={handleAddRecipe}
      />
    </div>
  );
}
