'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

const VAT_RATES = [
  { label: '21%', value: 0.21 },
  { label: '10,5%', value: 0.105 },
  { label: '27%', value: 0.27 },
  { label: '5%', value: 0.05 },
  { label: '2,5%', value: 0.025 },
  { label: '0%', value: 0 },
];

export function CalculadoraIVA() {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [priceStr, setPriceStr] = useState('');
  const [vatRateStr, setVatRateStr] = useState('0.21');

  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const parseNum = (str: string) => {
    if (!str) return 0;
    const val = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    return Number.isNaN(val) ? 0 : val;
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

  const price = parseNum(priceStr);
  const vatRate = parseFloat(vatRateStr);

  const result = useMemo(() => {
    if (price <= 0) return null;

    let netPrice = 0;
    let vatAmount = 0;
    let finalPrice = 0;
    const steps: string[] = [];

    if (mode === 'add') {
      netPrice = price;
      vatAmount = netPrice * vatRate;
      finalPrice = netPrice + vatAmount;
      steps.push(`1. Precio neto: $${netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
      steps.push(`2. Alícuota de IVA: ${(vatRate * 100).toLocaleString('es-AR')}%`);
      steps.push(`3. Cálculo del IVA: $${netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })} × ${vatRate} = $${vatAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
      steps.push(`4. Precio final: $${netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })} + $${vatAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })} = $${finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
    } else {
      finalPrice = price;
      netPrice = finalPrice / (1 + vatRate);
      vatAmount = finalPrice - netPrice;
      steps.push(`1. Precio final: $${finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
      steps.push(`2. Alícuota de IVA: ${(vatRate * 100).toLocaleString('es-AR')}%`);
      steps.push(`3. Cálculo del precio neto: $${finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ÷ (1 + ${vatRate}) = $${netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
      steps.push(`4. Cálculo del IVA: $${finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })} - $${netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })} = $${vatAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
    }

    return {
      netPrice,
      vatAmount,
      finalPrice,
      steps
    };
  }, [mode, price, vatRate]);

  const handleCopy = () => {
    if (!result) return;
    const text = mode === 'add'
      ? `Precio Final (con IVA): $${result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
      : `Precio Neto (sin IVA): $${result.netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPriceStr('');
    setVatRateStr('0.21');
  };

  return (
    <div className={`grid gap-8 items-start w-full ${result ? 'lg:grid-cols-2 max-w-5xl mx-auto' : 'max-w-xl mx-auto'}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        {/* Mode Selection */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('add')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${mode === 'add' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Agregar IVA
          </button>
          <button
            onClick={() => setMode('remove')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${mode === 'remove' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Quitar IVA
          </button>
        </div>

        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {mode === 'add' ? 'Precio Neto (sin IVA)' : 'Precio Final (con IVA)'}
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              {mode === 'add' ? 'Ingresá el importe al que querés sumarle el impuesto.' : 'Ingresá el importe total para desglosar el impuesto.'}
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Alícuota de IVA</label>
            <select
              value={vatRateStr}
              onChange={(e) => setVatRateStr(e.target.value)}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm bg-white"
            >
              {VAT_RATES.map((rate) => (
                <option key={rate.label} value={rate.value}>
                  {rate.label} {rate.value === 0.21 ? '(General)' : rate.value === 0.105 ? '(Reducida)' : ''}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>

      {/* Result Card (Sticky on desktop, below on mobile) */}
      <div className={`
        ${result ? 'block' : 'hidden'} 
        lg:block lg:sticky lg:top-8
        mt-8 lg:mt-0 w-full
      `}>
        {result && (
          <div aria-live="polite" className="bg-[#7C3AED] text-white rounded-2xl p-6 lg:p-8 shadow-xl w-full">
            <h3 className="text-white text-sm font-semibold mb-1 opacity-90">
              {mode === 'add' ? 'PRECIO FINAL (CON IVA)' : 'PRECIO NETO (SIN IVA)'}
            </h3>
            <div className="text-4xl lg:text-5xl font-bold mb-6">
              ${mode === 'add' 
                ? result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) 
                : result.netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Precio neto (sin IVA)</span>
                <span className="font-semibold">${result.netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Monto del IVA ({vatRate * 100}%)</span>
                <span className="font-semibold">${result.vatAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                <span className="opacity-90">Precio final (con IVA)</span>
                <span className="font-semibold">${result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
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
              Herramienta gratuita provista por PlayComun Online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
