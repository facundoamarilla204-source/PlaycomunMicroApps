'use client';

import React from 'react';
import { Printer, Calendar, CheckSquare, ChefHat, Sparkles, AlertTriangle } from 'lucide-react';
import type {
  ProductionPlanSummary,
  ProductionPlanItemCalculation,
  ConsolidatedIngredientItem,
} from '@/lib/gastronomia/production-plan';
import { formatCurrency } from '@/lib/costo-receta';

interface PrintableProductionSheetProps {
  planName: string;
  productionDate: string;
  notes?: string | null;
  summary: ProductionPlanSummary;
  onBack?: () => void;
}

export function PrintableProductionSheet({
  planName,
  productionDate,
  notes,
  summary,
  onBack,
}: PrintableProductionSheetProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = productionDate
    ? new Date(productionDate + 'T12:00:00').toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Fecha a confirmar';

  // Extract unique intermediate subrecipes from all planned items
  const allSubrecipes = summary.items.flatMap((item: ProductionPlanItemCalculation) =>
    item.expandedSubrecipes.map((sub) => ({
      ...sub,
      parentRecipeName: item.recipeName,
    }))
  );

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-stone-900 bg-white">
      {/* Action Bar (Hidden when printing) */}
      <div className="print:hidden sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-4 mb-6 bg-stone-900 text-stone-100 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Vista de impresión y obrador</h2>
            <p className="text-xs text-stone-400">Lista optimizada para imprimir o llevar en papel al obrador y compras</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors min-h-[38px]"
            >
              Volver al editor
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all active:scale-95 min-h-[38px]"
          >
            <Printer className="w-4 h-4" />
            Imprimir o Guardar PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet Body */}
      <div className="p-8 border border-stone-200 rounded-2xl print:border-none print:p-0 print:rounded-none">
        {/* Header */}
        <header className="border-b-2 border-stone-900 pb-4 mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-['Fugaz_One'] text-amber-600 text-lg uppercase tracking-wider">Amasia</span>
              <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">Hoja de Producción</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900">{planName || 'Plan de Producción sin título'}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-600">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span className="capitalize">{formattedDate}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-stone-500">Costo insumos estimado</p>
            <p className="text-lg font-bold text-stone-900">
              {formatCurrency(summary.totalEstimatedCost)}
            </p>
            <p className="text-[11px] text-stone-500">
              {summary.items.length} elaboraciones en lote
            </p>
          </div>
        </header>

        {/* Notes callout if any */}
        {notes && (
          <div className="mb-6 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700">
            <span className="font-semibold text-stone-900 block mb-0.5">Indicaciones del obrador:</span>
            <p className="whitespace-pre-line">{notes}</p>
          </div>
        )}

        {/* Section 1: Plan de elaboración (Recetas) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-900">
              1. Elaboraciones a producir ({summary.items.length})
            </h2>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-300 text-stone-500 font-semibold">
                <th className="py-2 pr-2">Receta</th>
                <th className="py-2 px-2 text-right">Rend. Base</th>
                <th className="py-2 px-2 text-right">A Elaborar</th>
                <th className="py-2 px-2 text-right">Factor</th>
                <th className="py-2 pl-2 text-right">Costo Consumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {summary.items.map((r: ProductionPlanItemCalculation, idx: number) => (
                <tr key={idx} className="hover:bg-stone-50">
                  <td className="py-2.5 pr-2 font-medium text-stone-900">
                    {r.recipeName}
                    {r.expandedSubrecipes.length > 0 && (
                      <span className="block text-[11px] text-stone-500 font-normal">
                        Incluye subrecetas: {r.expandedSubrecipes.map((s) => s.subrecipeName).join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-stone-600">
                    {r.baseYieldQuantity} {r.baseYieldUnit}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-amber-800">
                    {r.targetQuantity} {r.targetUnit}
                  </td>
                  <td className="py-2.5 px-2 text-right text-stone-600">
                    ×{r.scalingFactor.toFixed(2)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-medium text-stone-900">
                    {formatCurrency(r.estimatedCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 2: Subrecetas compuestas si existen */}
        {allSubrecipes.length > 0 && (
          <section className="mb-8 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h2 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Subrecetas previas a preparar ({allSubrecipes.length})
              </h2>
            </div>
            <p className="text-[11px] text-stone-600 mb-3">
              Preparar con anticipación para integrar en las recetas principales del plan:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {allSubrecipes.map((sub, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white border border-amber-200/80 rounded-lg">
                  <div>
                    <span className="font-semibold text-stone-900">{sub.subrecipeName}</span>
                    <span className="block text-[10px] text-stone-500">
                      Para: {sub.parentRecipeName}
                    </span>
                  </div>
                  <span className="font-bold text-amber-900 text-sm">
                    {sub.requiredGrossQuantity.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {sub.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Lista Consolidada de Insumos */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-900">
                2. Lista consolidada de insumos para compras y producción ({summary.consolidatedIngredients.length})
              </h2>
            </div>
            <span className="text-[11px] text-stone-500 italic">
              Cantidades brutas contemplan mermas
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-800 text-stone-700 font-bold">
                <th className="py-2 w-8 text-center">OK</th>
                <th className="py-2 pr-2">Ingrediente</th>
                <th className="py-2 px-2 text-right">Cant. Necesaria</th>
                <th className="py-2 px-2">Unidad</th>
                <th className="py-2 px-2 text-left">Recetas de origen</th>
                <th className="py-2 pl-2 text-right">Costo Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {summary.consolidatedIngredients.map((ing: ConsolidatedIngredientItem) => (
                <tr key={ing.key} className="hover:bg-stone-50 break-inside-avoid">
                  <td className="py-2 w-8 text-center">
                    <div className="w-4 h-4 mx-auto border-2 border-stone-400 rounded-xs"></div>
                  </td>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-stone-900">{ing.name}</span>
                    {ing.totalGrossQuantity !== ing.totalNetQuantity && (
                      <span className="block text-[10px] text-stone-500">
                        Neto: {ing.totalNetQuantity.toLocaleString('es-AR', { maximumFractionDigits: 1 })} {ing.unit}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-stone-900 text-sm">
                    {ing.totalGrossQuantity.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 font-medium text-stone-600">
                    {ing.unit}
                  </td>
                  <td className="py-2 px-2 text-stone-500 text-[11px]">
                    {ing.origins.map((o) => `${o.recipeName} (${o.grossQuantity.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ${o.unit})`).join(' + ')}
                  </td>
                  <td className="py-2 pl-2 text-right font-medium text-stone-800">
                    {ing.estimatedConsumptionCost > 0 ? formatCurrency(ing.estimatedConsumptionCost) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Warnings if any */}
        {summary.warnings.length > 0 && (
          <section className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Observaciones del plan:
            </div>
            <ul className="list-disc pl-4 text-[11px] text-amber-900 space-y-0.5">
              {summary.warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-stone-300 text-center text-[10px] text-stone-400 flex items-center justify-between">
          <span>Amasia por PlayComun Online · Planificador de Producción</span>
          <span>Generado el {new Date().toLocaleDateString('es-AR')}</span>
        </footer>
      </div>
    </div>
  );
}
