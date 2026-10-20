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
    <div className="grid gap-8 items-start w-full lg:grid-cols-12 max-w-5xl mx-auto">
      {/* Input Form */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-6">
        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Operación
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`py-2.5 min-h-[44px] flex items-center justify-center text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'add'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agregar IVA (+21%)
            </button>
            <button
              type="button"
              onClick={() => setMode('remove')}
              className={`py-2.5 min-h-[44px] flex items-center justify-center text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'remove'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Desglosar IVA (Quitar)
            </button>
          </div>
        </div>

        {/* Input Value */}
        <section className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              {mode === 'add' ? 'Precio neto (sin IVA)' : 'Precio final facturado (con IVA)'}
            </label>
            <p className="text-xs text-slate-500 mb-2">
              {mode === 'add'
                ? 'Ingresá el importe base sobre el cual aplicar el impuesto.'
                : 'Ingresá el importe total cobrado o facturado para discriminar el impuesto.'}
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
                className="block w-full pl-8 pr-4 py-3 min-h-[44px] rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-base transition-colors placeholder:text-slate-400"
                placeholder="10.000,00"
              />
            </div>
          </div>

          {/* Quick Rate Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Alícuota de IVA
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {VAT_RATES.map((rate) => {
                const isSelected = parseFloat(vatRateStr) === rate.value;
                return (
                  <button
                    key={rate.label}
                    type="button"
                    onClick={() => setVatRateStr(rate.value.toString())}
                    className={`py-2 px-1 min-h-[40px] flex items-center justify-center text-center rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {rate.label}
                  </button>
                );
              })}
            </div>

            <select
              value={vatRateStr}
              onChange={(e) => setVatRateStr(e.target.value)}
              className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-medium bg-white text-slate-700"
            >
              {VAT_RATES.map((rate) => (
                <option key={rate.label} value={rate.value}>
                  {rate.label} {rate.value === 0.21 ? '— Tasa General' : rate.value === 0.105 ? '— Tasa Reducida (Bienes de capital, carnes, etc.)' : rate.value === 0.27 ? '— Servicios públicos / Telecom' : ''}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>

      {/* Result Card */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 w-full">
        {result ? (
          <div
            aria-live="polite"
            className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                {mode === 'add' ? 'Precio Final (con IVA)' : 'Precio Neto (sin IVA)'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-medium">
                Alícuota {(vatRate * 100).toLocaleString('es-AR')}%
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
              ${(mode === 'add' ? result.finalPrice : result.netPrice).toLocaleString('es-AR', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Precio neto base</span>
                <span className="font-semibold text-white">
                  ${result.netPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Impuesto IVA ({(vatRate * 100).toLocaleString('es-AR')}%)</span>
                <span className="font-semibold text-purple-300">
                  + ${result.vatAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-200 pt-2 border-t border-slate-800">
                <span className="font-medium">Total facturado</span>
                <span className="font-bold text-white text-base">
                  ${result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Step-by-step account */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-3.5 py-2 min-h-[38px] inline-flex items-center transition-colors"
              >
                {showSteps ? 'Ocultar cuenta paso a paso' : 'Ver cuenta paso a paso'}
              </button>
              {showSteps && (
                <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300 font-mono">
                  {result.steps.map((step, idx) => (
                    <div key={idx}>{step}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 bg-white text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors py-3 px-4 min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado al portapapeles' : 'Copiar desglose'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-3 min-h-[44px] border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
              >
                Limpiar
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-2xl p-7 text-center bg-white/70">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center mx-auto mb-3">
              %
            </div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Ingresá un importe</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Escribí el precio para calcular de forma inmediata el desglose impositivo y el paso a paso contable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


