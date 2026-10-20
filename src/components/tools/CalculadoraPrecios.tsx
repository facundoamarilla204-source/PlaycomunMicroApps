'use client';

import { useState, useMemo } from 'react';
import { calculatePrice } from '@/lib/precio-venta';
import { PRECIO_VENTA_CONFIG } from '@/lib/precio-venta.config';
import { CheckCircle2, Copy } from 'lucide-react';

export function CalculadoraPrecios() {
  const [mode, setMode] = useState<'target' | 'profit'>('target');
  const [productCostStr, setProductCostStr] = useState('');
  const [otherVariableCostsStr, setOtherVariableCostsStr] = useState('');
  
  const [showFixedCosts, setShowFixedCosts] = useState(false);
  const [fixedMonthlyCostsStr, setFixedMonthlyCostsStr] = useState('');
  const [unitsPerMonthStr, setUnitsPerMonthStr] = useState('');
  
  const [vatRateStr, setVatRateStr] = useState('0.21');
  const [paymentFeeStr, setPaymentFeeStr] = useState('');
  const [grossIncomeTaxStr, setGrossIncomeTaxStr] = useState('');
  
  const [targetType, setTargetType] = useState<'margin' | 'markup'>('margin');
  const [targetValueStr, setTargetValueStr] = useState('');
  const [finalPriceStr, setFinalPriceStr] = useState('');

  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Parsing inputs
  const parseNum = (str: string) => {
    if (!str) return 0;
    const val = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    return Number.isNaN(val) ? 0 : val;
  };

  const productCost = parseNum(productCostStr);
  const otherVariableCosts = parseNum(otherVariableCostsStr);
  const fixedMonthlyCosts = parseNum(fixedMonthlyCostsStr);
  const unitsPerMonth = parseNum(unitsPerMonthStr);
  const vatRate = parseFloat(vatRateStr);
  const paymentFee = parseNum(paymentFeeStr) / 100;
  const grossIncomeTax = parseNum(grossIncomeTaxStr) / 100;
  const targetValue = parseNum(targetValueStr) / 100;
  const finalPrice = parseNum(finalPriceStr);

  const result = useMemo(() => {
    if (productCost <= 0) return null;
    if (showFixedCosts && fixedMonthlyCosts > 0 && unitsPerMonth <= 0) return null;
    if (mode === 'target' && targetValueStr === '') return null;
    if (mode === 'profit' && finalPrice <= 0) return null;

    return calculatePrice({
      mode,
      productCost,
      otherVariableCosts,
      fixedMonthlyCosts: showFixedCosts ? fixedMonthlyCosts : 0,
      unitsPerMonth: showFixedCosts ? unitsPerMonth : 0,
      vatRate,
      paymentFee,
      grossIncomeTax,
      target: mode === 'target' ? { type: targetType, value: targetValue } : undefined,
      finalPrice: mode === 'profit' ? finalPrice : undefined,
    });
  }, [
    mode, productCost, otherVariableCosts, showFixedCosts, fixedMonthlyCosts, unitsPerMonth,
    vatRate, paymentFee, grossIncomeTax, targetType, targetValue, targetValueStr, finalPrice
  ]);

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

  const handleCopy = () => {
    if (!result || !result.ok) return;
    const text = mode === 'target' 
      ? `Mi precio de venta final es: $${result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
      : `Mi ganancia por unidad es: $${result.profitPerUnit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setProductCostStr('');
    setOtherVariableCostsStr('');
    setFixedMonthlyCostsStr('');
    setUnitsPerMonthStr('');
    setShowFixedCosts(false);
    setVatRateStr('0.21');
    setPaymentFeeStr('');
    setGrossIncomeTaxStr('');
    setTargetValueStr('');
    setFinalPriceStr('');
  };

  return (
    <div className="grid gap-8 items-start w-full lg:grid-cols-12 max-w-5xl mx-auto">
      {/* Form Section */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        
        {/* Mode Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setMode('target')}
            className={`flex-1 min-h-[44px] py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center ${
              mode === 'target' 
                ? 'bg-white text-slate-900 shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calcular mi precio
          </button>
          <button
            type="button"
            onClick={() => setMode('profit')}
            className={`flex-1 min-h-[44px] py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center ${
              mode === 'profit' 
                ? 'bg-white text-slate-900 shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calcular mi ganancia
          </button>
        </div>

        {/* 1. Costos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Costos por unidad</h3>
            <span className="text-xs text-slate-500">Materia prima y variables</span>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Costo del producto o servicio *</label>
            <p className="text-xs text-slate-500 mb-1.5">Lo que te cuesta producir o comprar una unidad.</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm">$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={productCostStr}
                onChange={handleCurrencyChange(setProductCostStr)}
                className="block w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
                placeholder="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Otros costos variables (opcional)</label>
            <p className="text-xs text-slate-500 mb-1.5">Envase, embalaje, envío o mano de obra directa.</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm">$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={otherVariableCostsStr}
                onChange={handleCurrencyChange(setOtherVariableCostsStr)}
                className="block w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showFixedCosts}
                onChange={(e) => setShowFixedCosts(e.target.checked)}
                className="w-4 h-4 accent-brand rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">Prorratear costos fijos mensuales</span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6.5">Alquiler, sueldos, servicios e internet.</p>
          </div>

          {showFixedCosts && (
            <div className="grid grid-cols-2 gap-3 pl-6.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fijos del mes</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xs">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fixedMonthlyCostsStr}
                    onChange={handleCurrencyChange(setFixedMonthlyCostsStr)}
                    className="block w-full pl-6 pr-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="200000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unidades al mes</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={unitsPerMonthStr}
                  onChange={handleCurrencyChange(setUnitsPerMonthStr)}
                  className="block w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="500"
                />
              </div>
            </div>
          )}
        </section>

        {/* 2. Impuestos y comisiones */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Impuestos y cobro</h3>
            <span className="text-xs text-slate-500">Comisiones y retenciones</span>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Condición de IVA</label>
            <select
              value={vatRateStr}
              onChange={(e) => setVatRateStr(e.target.value)}
              className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 shadow-2xs focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {PRECIO_VENTA_CONFIG.IVA_RATES.map((rate) => (
                <option key={rate.label} value={rate.value}>
                  {rate.label} {rate.value === 0 ? '(Monotributista o exento)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Comisión pasarela / tarjeta (%)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentFeeStr}
                  onChange={handleCurrencyChange(setPaymentFeeStr)}
                  className="block w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="5,99"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ingresos Brutos (%)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={grossIncomeTaxStr}
                  onChange={handleCurrencyChange(setGrossIncomeTaxStr)}
                  className="block w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="3"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Objetivo */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Margen u objetivo</h3>
          </div>
          
          {mode === 'target' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Tipo de ganancia deseada</label>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <label className={`cursor-pointer rounded-lg border p-2.5 flex items-center gap-2.5 transition-colors ${
                  targetType === 'margin' 
                    ? 'border-brand bg-purple-50/40 text-slate-900' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}>
                  <input 
                    type="radio" 
                    checked={targetType === 'margin'} 
                    onChange={() => setTargetType('margin')}
                    className="w-4 h-4 accent-brand"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Margen de ganancia</span>
                    <span className="text-[11px] text-slate-500">Sobre el precio de venta</span>
                  </div>
                </label>
                <label className={`cursor-pointer rounded-lg border p-2.5 flex items-center gap-2.5 transition-colors ${
                  targetType === 'markup' 
                    ? 'border-brand bg-purple-50/40 text-slate-900' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}>
                  <input 
                    type="radio" 
                    checked={targetType === 'markup'} 
                    onChange={() => setTargetType('markup')}
                    className="w-4 h-4 accent-brand"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Recargo (Markup)</span>
                    <span className="text-[11px] text-slate-500">Sobre el costo total</span>
                  </div>
                </label>
              </div>

              <div className="relative w-full sm:w-1/2 pt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetValueStr}
                  onChange={handleCurrencyChange(setTargetValueStr)}
                  className={`block w-full pl-3 pr-8 py-2.5 rounded-lg border ${result && !result.ok ? 'border-red-300' : 'border-slate-300'} text-sm text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20`}
                  placeholder="30"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none pt-1">
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Precio de venta final cobrado</label>
              <p className="text-xs text-slate-500 mb-1.5">Lo que abona el cliente con IVA incluido.</p>
              <div className="relative w-full sm:w-1/2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">$</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={finalPriceStr}
                  onChange={handleCurrencyChange(setFinalPriceStr)}
                  className="block w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="1500"
                />
              </div>
            </div>
          )}

          {result && !result.ok && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {result.error}
            </div>
          )}
        </section>
      </div>

      {/* Result Card */}
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        {result?.ok ? (
          <div aria-live="polite" className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl p-5 sm:p-7 shadow-sm border border-slate-800">
            <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">
              {mode === 'target' ? 'Precio de venta final sugerido' : 'Ganancia neta por unidad'}
            </h3>
            <div className="text-3xl sm:text-4xl font-extrabold mb-5 tracking-tight text-white">
              ${mode === 'target' 
                ? result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) 
                : result.profitPerUnit.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
            </div>
            
            <div className="space-y-2.5 mb-5 text-xs sm:text-sm">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Precio neto (sin IVA)</span>
                <span className="font-semibold text-slate-200">${result.netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">IVA ({vatRate * 100}%)</span>
                <span className="font-semibold text-slate-200">${result.vat.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Costo total por unidad</span>
                <span className="font-semibold text-slate-200">${result.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Margen neto real</span>
                <span className="font-semibold text-emerald-400">{(result.realMargin * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Recargo (markup) real</span>
                <span className="font-semibold text-slate-200">{(result.realMarkup * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
              </div>
              {result.monthlyProfit !== undefined && (
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Ganancia mensual est.</span>
                  <span className="font-semibold text-emerald-400">${result.monthlyProfit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Visual Breakdown Bar */}
            <div className="mb-5 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
              <p className="text-[11px] text-slate-400 mb-2 font-medium">Composición por cada $100 netos:</p>
              <div className="h-3 w-full flex rounded-full overflow-hidden bg-slate-800">
                <div style={{ width: `${Math.max(0, (result.breakdown.cost / result.netPrice) * 100)}%` }} className="bg-emerald-500" title="Costos" />
                <div style={{ width: `${Math.max(0, (result.breakdown.taxes / result.netPrice) * 100)}%` }} className="bg-amber-500" title="Impuestos" />
                <div style={{ width: `${Math.max(0, (result.breakdown.fee / result.netPrice) * 100)}%` }} className="bg-rose-500" title="Comisiones" />
                <div style={{ width: `${Math.max(0, (result.breakdown.profit / result.netPrice) * 100)}%` }} className="bg-brand" title="Ganancia" />
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Costos: ${(result.breakdown.cost / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Impuestos: ${(result.breakdown.taxes / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Comisiones: ${((result.breakdown.fee / (1+vatRate)) / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand" /> Ganancia: ${(result.breakdown.profit / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
              </div>
            </div>

            {/* Steps Toggle */}
            <div className="mb-5">
              <button 
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors min-h-[38px] inline-flex items-center"
              >
                {showSteps ? 'Ocultar cuenta paso a paso' : 'Ver detalle del cálculo paso a paso'}
              </button>
              {showSteps && (
                <div className="mt-2.5 p-3 bg-slate-950/70 rounded-lg text-xs space-y-1.5 text-slate-300 font-mono border border-slate-800">
                  {result.steps.map((step, idx) => (
                    <div key={idx}>{step}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs sm:text-sm font-semibold py-3 px-4 min-h-[44px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar resultado'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-3 min-h-[44px] border border-slate-700 hover:bg-slate-800/80 rounded-xl text-xs sm:text-sm font-medium text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Ingresá el costo unitario del producto y tu porcentaje de ganancia o precio de venta para ver el resultado en tiempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


