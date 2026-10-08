'use client';

import { useState, useMemo } from 'react';
import { tools } from "@/data/tools"
import { Calculator, Shield, Zap } from "lucide-react"

const COUNTRIES = [
  { id: 'ar', name: 'Argentina', vat: 0.21 },
  { id: 'mx', name: 'México', vat: 0.16 },
  { id: 'cl', name: 'Chile', vat: 0.19 },
  { id: 'co', name: 'Colombia', vat: 0.19 },
  { id: 'es', name: 'España', vat: 0.21 },
  { id: 'uy', name: 'Uruguay', vat: 0.22 },
];

export default function TrustStrip() {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [priceStr, setPriceStr] = useState('1000');
  const [countryId, setCountryId] = useState('ar');

  const selectedCountry = COUNTRIES.find(c => c.id === countryId)!;
  const vatRate = selectedCountry.vat;

  const parseNum = (str: string) => {
    if (!str) return 0;
    const val = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    return Number.isNaN(val) ? 0 : val;
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,]/g, '');
    const parts = val.split(',');
    let integerPart = parts[0];
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    val = parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
    setPriceStr(val);
  };

  const price = parseNum(priceStr);

  const result = useMemo(() => {
    if (price <= 0) return { finalPrice: 0, vatAmount: 0 };
    if (mode === 'add') {
      return {
        finalPrice: price * (1 + vatRate),
        vatAmount: price * vatRate
      };
    } else {
      return {
        finalPrice: price / (1 + vatRate),
        vatAmount: price - (price / (1 + vatRate))
      };
    }
  }, [price, vatRate, mode]);

  return (
    <section className="bg-brand-light py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          
          {/* Texto y Franja de números */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Probalo ahora, sin registrarte
              </h2>
              <p className="text-lg text-foreground-muted">
                Calculá al instante el IVA según las regulaciones de tu país.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-6 py-6 border-y border-brand/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand mb-1">{tools.length}</div>
                <div className="text-sm font-medium text-foreground-muted">Herramientas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand mb-1">0</div>
                <div className="text-sm font-medium text-foreground-muted">Registros</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand mb-1">{COUNTRIES.length}</div>
                <div className="text-sm font-medium text-foreground-muted">Países</div>
              </div>
            </div>

            <div className="flex items-start gap-4 text-sm text-foreground-muted bg-white/50 p-4 rounded-xl">
              <Shield className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <p>
                <strong>Privacidad por defecto:</strong> Las herramientas básicas corren en tu navegador y no guardan lo que ingresás.
              </p>
            </div>
          </div>

          {/* Calculadora Embebida */}
          <div className="bg-white rounded-2xl shadow-xl shadow-brand/5 border border-brand/10 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="w-24 h-24 text-brand" />
            </div>
            
            <div className="relative z-10 space-y-6">
              
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button
                  onClick={() => setMode('add')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'add' ? 'bg-white shadow-sm text-brand' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Agregar IVA
                </button>
                <button
                  onClick={() => setMode('remove')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'remove' ? 'bg-white shadow-sm text-brand' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Desglosar IVA
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">
                    País
                  </label>
                  <select
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-brand focus:border-brand block p-2.5 outline-none"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({(c.vat*100).toString().replace('.', ',')}%)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">
                    {mode === 'add' ? 'Monto Base' : 'Monto Final'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceStr}
                      onChange={handleCurrencyChange}
                      className="w-full bg-white border border-neutral-200 text-neutral-900 font-medium text-sm rounded-lg focus:ring-brand focus:border-brand block pl-7 p-2.5 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 text-white rounded-xl p-5">
                <div className="text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  {mode === 'add' ? 'Precio con IVA' : 'Precio sin IVA'}
                </div>
                <div className="text-3xl sm:text-4xl font-bold mb-3">
                  ${result.finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-light font-medium bg-white/10 w-fit px-3 py-1 rounded-full">
                  <Zap className="w-4 h-4 fill-current" />
                  IVA: ${result.vatAmount.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
