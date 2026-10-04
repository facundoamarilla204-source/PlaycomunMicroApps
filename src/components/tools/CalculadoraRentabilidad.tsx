'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

export function CalculadoraRentabilidad() {
  const [mode, setMode] = useState<'rentabilidad' | 'inverso'>('rentabilidad');
  const [costStr, setCostStr] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [marginStr, setMarginStr] = useState('');
  const [quantityStr, setQuantityStr] = useState('1');

  const [copied, setCopied] = useState(false);

  const parseNum = (str: string) => {
    if (!str) return 0;
    const val = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    return Number.isNaN(val) ? 0 : val;
  };

  const parseQty = (str: string) => {
    if (!str) return 1;
    const val = parseInt(str.replace(/\D/g, ''), 10);
    return Number.isNaN(val) || val <= 0 ? 1 : val;
  };

  const handleCurrencyChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,]/g, '');
    const parts = val.split(',');
    let integerPart = parts[0];
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    val = parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
    setter(val);
  };

  const handlePercentageChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,]/g, '');
    setter(val);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setQuantityStr(val);
  };

  const cost = parseNum(costStr);
  const price = parseNum(priceStr);
  const marginPct = parseNum(marginStr);
  const qty = parseQty(quantityStr);

  type Result = 
    | { type: 'rentabilidad'; profit: number; margin: number; markup: number; totalCost: number; totalRevenue: number }
    | { type: 'inverso'; targetPrice: number; profit: number; markup: number; totalCost: number; totalRevenue: number };

  const result = useMemo<Result | null>(() => {
    if (mode === 'rentabilidad') {
      if (cost <= 0 || price <= 0) return null;

      const totalCost = cost * qty;
      const totalRevenue = price * qty;
      const profit = totalRevenue - totalCost;
      
      const margin = (profit / totalRevenue) * 100;
      const markup = (profit / totalCost) * 100;

      return {
        type: 'rentabilidad',
        profit,
        margin,
        markup,
        totalCost,
        totalRevenue
      };
    } else {
      if (cost <= 0 || marginPct <= 0 || marginPct >= 100) return null;

      const marginDecimal = marginPct / 100;
      const targetPrice = cost / (1 - marginDecimal);
      const totalCost = cost * qty;
      const totalRevenue = targetPrice * qty;
      const profit = totalRevenue - totalCost;
      const markup = (profit / totalCost) * 100;

      return {
        type: 'inverso',
        targetPrice,
        profit,
        markup,
        totalCost,
        totalRevenue
      };
    }
  }, [mode, cost, price, marginPct, qty]);

  const errorMargin = mode === 'inverso' && marginPct >= 100 ? 'El margen debe ser menor a 100%' : null;

  const handleCopy = () => {
    if (!result) return;
    let text = '';
    if (result.type === 'rentabilidad') {
      text = `Ganancia: $${result.profit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}\nMargen: ${result.margin.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%\nMarkup: ${result.markup.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
    } else {
      text = `Precio sugerido: $${result.targetPrice!.toLocaleString('es-AR', { maximumFractionDigits: 2 })}\nGanancia: $${result.profit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setCostStr('');
    setPriceStr('');
    setMarginStr('');
    setQuantityStr('1');
  };

  return (
    <div className={`grid gap-8 items-start w-full ${result ? 'lg:grid-cols-2 max-w-5xl mx-auto' : 'max-w-xl mx-auto'}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        {/* Mode Selection */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => { setMode('rentabilidad'); setMarginStr(''); }}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg transition-colors ${mode === 'rentabilidad' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Calcular ganancia y margen
          </button>
          <button
            onClick={() => { setMode('inverso'); setPriceStr(''); }}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg transition-colors ${mode === 'inverso' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Calcular precio por margen
          </button>
        </div>

        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-neutral-900">1. Datos principales</h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Costo {qty > 1 ? 'unitario' : ''}
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Cuánto te cuesta el producto o servicio.
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={costStr}
                onChange={handleCurrencyChange(setCostStr)}
                className="block w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                placeholder="600"
              />
            </div>
          </div>

          {mode === 'rentabilidad' ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Precio de venta {qty > 1 ? 'unitario' : ''}
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                A cuánto vendés el producto o servicio.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceStr}
                  onChange={handleCurrencyChange(setPriceStr)}
                  className="block w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                  placeholder="1000"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Margen de ganancia deseado
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Qué porcentaje del precio final querés que sea ganancia.
              </p>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={marginStr}
                  onChange={handlePercentageChange(setMarginStr)}
                  className={`block w-full pl-3 pr-8 py-3 rounded-xl border ${errorMargin ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]'} sm:text-sm transition-colors`}
                  placeholder="40"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 sm:text-sm">%</span>
                </div>
              </div>
              {errorMargin && <p className="mt-1 text-xs text-red-500">{errorMargin}</p>}
            </div>
          )}
        </section>

        <hr className="border-neutral-200" />

        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-neutral-900">2. Unidades (Opcional)</h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cantidad
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Cuántas unidades querés calcular (opcional).
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={quantityStr}
              onChange={handleQuantityChange}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
              placeholder="1"
            />
          </div>
        </section>
      </div>

      {/* Result Card */}
      <div className={`
        ${result ? 'block' : 'hidden'} 
        lg:block lg:sticky lg:top-8
        mt-8 lg:mt-0 w-full
      `}>
        {result && (
          <div aria-live="polite" className="bg-[#7C3AED] text-white rounded-2xl p-6 lg:p-8 shadow-xl w-full">
            {result.type === 'rentabilidad' ? (
              <>
                <h3 className="text-white text-sm font-semibold mb-1 opacity-90">
                  GANANCIA {qty > 1 ? 'TOTAL' : 'NETA'}
                </h3>
                <div className="text-4xl lg:text-5xl font-bold mb-6">
                  ${result.profit.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Margen de rentabilidad</span>
                    <span className="font-semibold">{result.margin.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Markup (Recargo al costo)</span>
                    <span className="font-semibold">{result.markup.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Costo total</span>
                    <span className="font-semibold">${result.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Ingresos totales</span>
                    <span className="font-semibold">${result.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-white text-sm font-semibold mb-1 opacity-90">
                  PRECIO DE VENTA {qty > 1 ? 'UNITARIO ' : ''}RECOMENDADO
                </h3>
                <div className="text-4xl lg:text-5xl font-bold mb-6">
                  ${result.targetPrice!.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Ganancia {qty > 1 ? 'total' : 'neta'}</span>
                    <span className="font-semibold">${result.profit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Markup (Recargo al costo)</span>
                    <span className="font-semibold">{result.markup.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Costo total</span>
                    <span className="font-semibold">${result.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                    <span className="opacity-90">Ingresos totales</span>
                    <span className="font-semibold">${result.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-white text-[#7C3AED] hover:bg-white/90 active:bg-white transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 border border-white/30 hover:bg-white/10 rounded-xl font-medium transition-colors"
              >
                Limpiar
              </button>
            </div>
            
            <p className="text-center text-xs opacity-70 mt-4">
              Margen y Markup no son lo mismo. El margen es sobre el precio de venta, el markup es sobre el costo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
