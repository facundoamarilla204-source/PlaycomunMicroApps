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
    <div className={`grid gap-8 items-start ${result?.ok ? 'lg:grid-cols-2' : 'max-w-xl mx-auto'}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        {/* Mode Selection */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('target')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'target' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Calcular mi precio
          </button>
          <button
            onClick={() => setMode('profit')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'profit' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Calcular mi ganancia
          </button>
        </div>

        {/* 1. Costos */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-neutral-900">1. Costos (por unidad)</h3>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Costo del producto o servicio</label>
            <p className="text-xs text-neutral-500 mb-2">Lo que te cuesta producir o comprar una unidad.</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={productCostStr}
                onChange={handleCurrencyChange(setProductCostStr)}
                className="block w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                placeholder="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Otros costos variables (opcional)</label>
            <p className="text-xs text-neutral-500 mb-2">Envase, envío, mano de obra directa.</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={otherVariableCostsStr}
                onChange={handleCurrencyChange(setOtherVariableCostsStr)}
                className="block w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showFixedCosts}
                onChange={(e) => setShowFixedCosts(e.target.checked)}
                className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED] border-neutral-300 rounded text-[#7C3AED]"
              />
              <span className="text-sm font-medium text-neutral-700">Sumar mis costos fijos</span>
            </label>
            <p className="text-xs text-neutral-500 mt-1 ml-7">Alquiler, sueldos, servicios y todo lo que pagás aunque no vendas.</p>
          </div>

          {showFixedCosts && (
            <div className="grid grid-cols-2 gap-4 pl-7 pt-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Costos fijos del mes</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fixedMonthlyCostsStr}
                    onChange={handleCurrencyChange(setFixedMonthlyCostsStr)}
                    className="block w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm"
                    placeholder="200000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Unidades al mes</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={unitsPerMonthStr}
                  onChange={handleCurrencyChange(setUnitsPerMonthStr)}
                  className="block w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm"
                  placeholder="500"
                />
              </div>
            </div>
          )}
        </section>

        <hr className="border-neutral-200" />

        {/* 2. Impuestos y comisiones */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-neutral-900">2. Impuestos y comisiones</h3>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Condición frente al IVA</label>
            <select
              value={vatRateStr}
              onChange={(e) => setVatRateStr(e.target.value)}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm bg-white"
            >
              {PRECIO_VENTA_CONFIG.IVA_RATES.map((rate) => (
                <option key={rate.label} value={rate.value}>
                  {rate.label} {rate.value === 0 ? '(Monotributista o exento)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Comisión de cobro (%)</label>
              <p className="text-xs text-neutral-500 mb-2 min-h-[32px]">Mirá el porcentaje en Mercado Pago o tarjeta.</p>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentFeeStr}
                  onChange={handleCurrencyChange(setPaymentFeeStr)}
                  className="block w-full pl-3 pr-8 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm"
                  placeholder="5,99"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Ingresos Brutos (%)</label>
              <p className="text-xs text-neutral-500 mb-2 min-h-[32px]">Depende de tu provincia y actividad.</p>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={grossIncomeTaxStr}
                  onChange={handleCurrencyChange(setGrossIncomeTaxStr)}
                  className="block w-full pl-3 pr-8 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm"
                  placeholder="3"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-neutral-200" />

        {/* 3. Objetivo */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-neutral-900">3. Objetivo</h3>
          
          {mode === 'target' ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">¿Cómo querés calcular tu ganancia?</label>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <label className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-colors ${targetType === 'margin' ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                  <input 
                    type="radio" 
                    checked={targetType === 'margin'} 
                    onChange={() => setTargetType('margin')}
                    className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Margen de ganancia</span>
                    <span className="text-xs text-neutral-500">Sobre precio sin IVA</span>
                  </div>
                </label>
                <label className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-colors ${targetType === 'markup' ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                  <input 
                    type="radio" 
                    checked={targetType === 'markup'} 
                    onChange={() => setTargetType('markup')}
                    className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Recargo (Markup)</span>
                    <span className="text-xs text-neutral-500">Sobre tus costos</span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-neutral-500 mb-3">
                Un 30% de recargo equivale a un margen menor. <a href="#margen-vs-recargo" className="text-[#7C3AED] hover:underline">¿Cuál es la diferencia?</a>
              </p>
              <div className="relative w-1/2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetValueStr}
                  onChange={handleCurrencyChange(setTargetValueStr)}
                  className={`block w-full pl-3 pr-8 py-3 rounded-xl border ${result && !result.ok ? 'border-red-300' : 'border-neutral-300'} focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm`}
                  placeholder="30"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Precio de venta final</label>
              <p className="text-xs text-neutral-500 mb-2">Lo que va a pagar el cliente (con IVA incluido).</p>
              <div className="relative w-1/2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={finalPriceStr}
                  onChange={handleCurrencyChange(setFinalPriceStr)}
                  className="block w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                  placeholder="1500"
                />
              </div>
            </div>
          )}

          {result && !result.ok && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {result.error}
            </div>
          )}
        </section>
      </div>

      {/* Result Card */}
      <div className={`
        ${result?.ok ? 'block mt-8 lg:mt-0' : 'hidden'} 
        lg:block lg:sticky lg:top-8
      `}>
        {result?.ok && (
          <div aria-live="polite" className="bg-[#7C3AED] text-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-[#7C3AED] text-sm font-medium mb-1 opacity-90">
              {mode === 'target' ? 'PRECIO FINAL (CON IVA)' : 'GANANCIA NETA POR UNIDAD'}
            </h3>
            <div className="text-4xl lg:text-5xl font-bold mb-6">
              ${mode === 'target' 
                ? result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) 
                : result.profitPerUnit.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Precio neto (sin IVA)</span>
                <span className="font-semibold">${result.netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">IVA ({vatRate * 100}%)</span>
                <span className="font-semibold">${result.vat.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Costo total por unidad</span>
                <span className="font-semibold">${result.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Margen real</span>
                <span className="font-semibold">{(result.realMargin * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Recargo real (markup)</span>
                <span className="font-semibold">{(result.realMarkup * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</span>
              </div>
              {result.monthlyProfit !== undefined && (
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Ganancia mensual est.</span>
                  <span className="font-semibold">${result.monthlyProfit.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Visual Breakdown */}
            <div className="mb-6">
              <p className="text-xs opacity-90 mb-2 font-medium">De cada $100 de tu precio sin IVA:</p>
              <div className="h-4 w-full flex rounded-full overflow-hidden bg-white/20">
                <div style={{ width: `${Math.max(0, (result.breakdown.cost / result.netPrice) * 100)}%` }} className="bg-[#10b981]" title="Costos" />
                <div style={{ width: `${Math.max(0, (result.breakdown.taxes / result.netPrice) * 100)}%` }} className="bg-[#f59e0b]" title="Impuestos" />
                <div style={{ width: `${Math.max(0, (result.breakdown.fee / result.netPrice) * 100)}%` }} className="bg-[#ef4444]" title="Comisiones" />
                <div style={{ width: `${Math.max(0, (result.breakdown.profit / result.netPrice) * 100)}%` }} className="bg-white" title="Ganancia" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Costos: ${(result.breakdown.cost / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Impuestos: ${(result.breakdown.taxes / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Comisiones: ${((result.breakdown.fee / (1+vatRate)) / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white" /> Ganancia: ${(result.breakdown.profit / result.netPrice * 100).toLocaleString('es-AR', {maximumFractionDigits:1})}</div>
              </div>
            </div>

            {/* Steps Toggle */}
            <div className="mb-6">
              <button 
                onClick={() => setShowSteps(!showSteps)}
                className="text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors"
              >
                {showSteps ? 'Ocultar cuenta paso a paso' : 'Ver la cuenta paso a paso'}
              </button>
              {showSteps && (
                <div className="mt-3 p-3 bg-white/10 rounded-xl text-xs space-y-2 opacity-90 font-mono">
                  {result.steps.map((step, idx) => (
                    <div key={idx}>{step}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-white text-[#7C3AED] hover:bg-white/90 active:bg-white transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado' : 'Copiar resultado'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 border border-white/30 hover:bg-white/10 rounded-xl font-medium transition-colors"
              >
                Limpiar
              </button>
            </div>
            
            <p className="text-center text-xs opacity-70 mt-4">
              Resultado orientativo. Para temas impositivos, consultá con un contador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
