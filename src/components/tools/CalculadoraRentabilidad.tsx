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
    <div className="grid gap-8 items-start w-full lg:grid-cols-12 max-w-5xl mx-auto">
      {/* Form Column */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-6">
        {/* Mode Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Tipo de cálculo
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setMode('rentabilidad');
                setMarginStr('');
              }}
              className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center ${
                mode === 'rentabilidad'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ganancia y margen
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('inverso');
                setPriceStr('');
              }}
              className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center ${
                mode === 'inverso'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Precio según margen
            </button>
          </div>
        </div>

        {/* Primary Inputs */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-sm text-slate-900">Variables de costo y venta</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Costo {qty > 1 ? 'unitario' : 'del producto o servicio'}
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Cuánto te cuesta producirlo, adquirirlo o prestar el servicio.
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-base">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={costStr}
                onChange={handleCurrencyChange(setCostStr)}
                className="block w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-base transition-colors placeholder:text-slate-400"
                placeholder="600"
              />
            </div>
          </div>

          {mode === 'rentabilidad' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Precio de venta {qty > 1 ? 'unitario' : ''}
              </label>
              <p className="text-xs text-slate-500 mb-2">
                A cuánto lo vas a vender al cliente final.
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-base">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceStr}
                  onChange={handleCurrencyChange(setPriceStr)}
                  className="block w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-base transition-colors placeholder:text-slate-400"
                  placeholder="1.000"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Margen de ganancia deseado
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Qué porcentaje del precio final querés que represente tu ganancia.
              </p>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={marginStr}
                  onChange={handlePercentageChange(setMarginStr)}
                  className={`block w-full pl-4 pr-9 py-3 rounded-xl border ${
                    errorMargin
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                  } text-slate-900 font-medium text-base transition-colors placeholder:text-slate-400`}
                  placeholder="40"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-base">
                  %
                </span>
              </div>
              {errorMargin && <p className="mt-1.5 text-xs text-red-600 font-medium">{errorMargin}</p>}
            </div>
          )}
        </section>

        {/* Quantities */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-sm text-slate-900">Volumen proyectado (opcional)</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Cantidad de unidades
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Proyectá la facturación y ganancia bruta multiplicada por lote.
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={quantityStr}
              onChange={handleQuantityChange}
              className="block w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors"
              placeholder="1"
            />
          </div>
        </section>
      </div>

      {/* Result Card Column */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 w-full">
        {result ? (
          <div
            aria-live="polite"
            className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg"
          >
            {result.type === 'rentabilidad' ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Ganancia {qty > 1 ? 'Total' : 'Neta'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                    {result.margin.toLocaleString('es-AR', { maximumFractionDigits: 1 })}% margen
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
                  ${result.profit.toLocaleString('es-AR', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6 text-sm">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Margen sobre venta</span>
                    <span className="font-semibold text-white">
                      {result.margin.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Markup (recargo al costo)</span>
                    <span className="font-semibold text-purple-300">
                      {result.markup.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Costo total ({qty} un.)</span>
                    <span className="font-semibold text-slate-200">
                      ${result.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200 pt-2 border-t border-slate-800">
                    <span className="font-medium">Ingresos brutos</span>
                    <span className="font-bold text-white text-base">
                      ${result.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Precio {qty > 1 ? 'Unitario ' : ''}Recomendado
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-semibold">
                    Margen objetivo
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
                  ${result.targetPrice!.toLocaleString('es-AR', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6 text-sm">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Ganancia {qty > 1 ? 'total' : 'unitaria'}</span>
                    <span className="font-semibold text-emerald-400">
                      + ${result.profit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Markup equivalente</span>
                    <span className="font-semibold text-purple-300">
                      {result.markup.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Costo total ({qty} un.)</span>
                    <span className="font-semibold text-slate-200">
                      ${result.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200 pt-2 border-t border-slate-800">
                    <span className="font-medium">Facturación estimada</span>
                    <span className="font-bold text-white text-base">
                      ${result.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 bg-white text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado al portapapeles' : 'Copiar resultados'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Limpiar
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
              <strong>Tip:</strong> El <em>margen</em> es la porción de la venta que te queda como ganancia. El <em>markup</em> es el porcentaje que le sumás a tu costo.
            </p>
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-2xl p-7 text-center bg-white/70">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center mx-auto mb-3">
              $
            </div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Cálculo de rentabilidad</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Ingresá tu costo y precio de venta para obtener al instante tu margen real, markup y ganancias por volumen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


