'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

export function CalculadoraCuotas() {
  const [mode, setMode] = useState<'sin_interes' | 'con_interes'>('sin_interes');
  const [montoStr, setMontoStr] = useState('');
  const [cuotasStr, setCuotasStr] = useState('12');
  const [tasaStr, setTasaStr] = useState('');
  const [tipoTasa, setTipoTasa] = useState<'mensual' | 'anual'>('mensual');
  const [copied, setCopied] = useState(false);

  const parseNum = (str: string) => {
    if (!str) return 0;
    const val = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    return Number.isNaN(val) ? 0 : val;
  };

  const parseQty = (str: string) => {
    if (!str) return 0;
    const val = parseInt(str.replace(/\D/g, ''), 10);
    return Number.isNaN(val) || val <= 0 ? 0 : val;
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
    setCuotasStr(val);
  };

  const monto = parseNum(montoStr);
  const cuotas = parseQty(cuotasStr);
  const tasaInput = parseNum(tasaStr);

  const result = useMemo(() => {
    if (monto <= 0 || cuotas <= 0) return null;

    if (mode === 'sin_interes') {
      const valorCuota = monto / cuotas;
      return {
        montoFinanciado: monto,
        cantidadCuotas: cuotas,
        valorCuota: valorCuota,
        totalPagado: monto,
        totalIntereses: 0,
        tasaEfectivaMensual: 0
      };
    } else {
      if (tasaStr === '') return null;
      if (tasaInput < 0) return null;

      // Si la tasa es 0, es igual a sin interés
      if (tasaInput === 0) {
        return {
          montoFinanciado: monto,
          cantidadCuotas: cuotas,
          valorCuota: monto / cuotas,
          totalPagado: monto,
          totalIntereses: 0,
          tasaEfectivaMensual: 0
        };
      }

      // Convertir la tasa a mensual decimal
      let iMensual = 0;
      if (tipoTasa === 'mensual') {
        iMensual = tasaInput / 100;
      } else {
        // TNA a TEM (dividiendo por 12 asumiendo capitalización mensual)
        iMensual = (tasaInput / 100) / 12;
      }

      // Sistema Francés
      // Cuota = P * [ i * (1+i)^n ] / [ (1+i)^n - 1 ]
      const factor = Math.pow(1 + iMensual, cuotas);
      const valorCuota = monto * ((iMensual * factor) / (factor - 1));
      
      const totalPagado = valorCuota * cuotas;
      const totalIntereses = totalPagado - monto;

      return {
        montoFinanciado: monto,
        cantidadCuotas: cuotas,
        valorCuota: valorCuota,
        totalPagado: totalPagado,
        totalIntereses: totalIntereses,
        tasaEfectivaMensual: iMensual * 100
      };
    }
  }, [mode, monto, cuotas, tasaInput, tasaStr, tipoTasa]);

  const handleCopy = () => {
    if (!result) return;
    const text = `Cuota mensual: $${result.valorCuota.toLocaleString('es-AR', { maximumFractionDigits: 2 })}\nTotal pagado: $${result.totalPagado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}\nTotal de intereses: $${result.totalIntereses.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setMontoStr('');
    setCuotasStr('12');
    setTasaStr('');
    setTipoTasa('mensual');
  };

  // Desglose de cuotas (Sistema francés o lineal)
  const getDesglose = () => {
    if (!result || result.cantidadCuotas > 120) return []; // Evitar arrays enormes para performance

    const desglose = [];
    let saldo = result.montoFinanciado;
    
    if (mode === 'sin_interes' || result.tasaEfectivaMensual === 0) {
      const capitalPorCuota = result.montoFinanciado / result.cantidadCuotas;
      for (let i = 1; i <= result.cantidadCuotas; i++) {
        desglose.push({
          nro: i,
          cuota: capitalPorCuota,
          capital: capitalPorCuota,
          interes: 0,
          saldoResidual: Math.max(0, saldo - capitalPorCuota)
        });
        saldo -= capitalPorCuota;
      }
    } else {
      const iDecimal = result.tasaEfectivaMensual / 100;
      for (let i = 1; i <= result.cantidadCuotas; i++) {
        const interes = saldo * iDecimal;
        const capital = result.valorCuota - interes;
        saldo = Math.max(0, saldo - capital);
        
        desglose.push({
          nro: i,
          cuota: result.valorCuota,
          capital: capital,
          interes: interes,
          saldoResidual: saldo
        });
      }
    }
    
    return desglose;
  };

  const desglose = useMemo(() => getDesglose(), [result]);

  return (
    <div className="grid gap-8 items-start w-full lg:grid-cols-2 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        {/* Mode Selection */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => { setMode('sin_interes'); }}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg transition-colors ${mode === 'sin_interes' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Sin interés
          </button>
          <button
            onClick={() => { setMode('con_interes'); }}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg transition-colors ${mode === 'con_interes' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Con interés
          </button>
        </div>

        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-neutral-900">1. Datos principales</h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monto a financiar
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              El valor total de la compra o préstamo.
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={montoStr}
                onChange={handleCurrencyChange(setMontoStr)}
                className="block w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
                placeholder="120.000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cantidad de cuotas
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cuotasStr}
              onChange={handleQuantityChange}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
              placeholder="12"
            />
            {cuotasStr !== '' && cuotas === 0 && (
              <p className="mt-1 text-xs text-red-500">Debe ser mayor a 0</p>
            )}
          </div>

          {mode === 'con_interes' && (
            <div className="pt-2 border-t border-neutral-100">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tasa de interés
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Especificá la tasa y su periodicidad.
              </p>
              
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tasaStr}
                    onChange={handlePercentageChange(setTasaStr)}
                    className="block w-full pl-3 pr-8 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
                    placeholder="50"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 sm:text-sm">%</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <select
                    value={tipoTasa}
                    onChange={(e) => setTipoTasa(e.target.value as 'mensual' | 'anual')}
                    className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors bg-white"
                  >
                    <option value="mensual">Mensual (TEM)</option>
                    <option value="anual">Anual (TNA)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3 bg-neutral-50 p-2 rounded-lg">
                La calculadora utiliza el <strong>sistema de amortización francés</strong> (cuota fija), calculando el interés sobre el saldo deudor.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Result Card */}
      <div className={`
        ${result ? 'block' : 'hidden'} 
        lg:block lg:sticky lg:top-28
        mt-8 lg:mt-0 w-full flex flex-col gap-6
      `}>
        {result && (
          <>
            <div aria-live="polite" className="bg-neutral-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl w-full">
              <h3 className="text-white text-sm font-semibold mb-1 opacity-90">
                VALOR DE LA CUOTA
              </h3>
              <div className="text-4xl lg:text-5xl font-bold mb-6">
                ${result.valorCuota.toLocaleString('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Monto financiado</span>
                  <span className="font-semibold">${result.montoFinanciado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Cantidad de cuotas</span>
                  <span className="font-semibold">{result.cantidadCuotas}</span>
                </div>
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Total de intereses</span>
                  <span className="font-semibold">${result.totalIntereses.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Total pagado al final</span>
                  <span className="font-semibold">${result.totalPagado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-white text-neutral-900 hover:bg-white/90 active:bg-white transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
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
            </div>

            {/* Desglose */}
            {desglose.length > 0 && desglose.length <= 60 && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 w-full">
                <h4 className="font-semibold text-neutral-900 mb-4">Desglose del financiamiento</h4>
                
                {/* Mobile View (Cards) */}
                <div className="block sm:hidden space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {desglose.map((d) => (
                    <div key={d.nro} className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-sm">
                      <div className="font-medium text-neutral-900 mb-2 border-b border-neutral-200 pb-1">Cuota {d.nro}</div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-500">Capital</span>
                        <span>${d.capital.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-500">Interés</span>
                        <span>${d.interes.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-medium mt-2 pt-2 border-t border-neutral-200">
                        <span>Total cuota</span>
                        <span>${d.cuota.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden sm:block overflow-x-auto w-full">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Nº</th>
                          <th className="px-4 py-3 text-right">Cuota</th>
                          <th className="px-4 py-3 text-right">Capital</th>
                          <th className="px-4 py-3 text-right">Interés</th>
                          <th className="px-4 py-3 text-right rounded-tr-lg">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {desglose.map((d) => (
                          <tr key={d.nro} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                            <td className="px-4 py-3 font-medium text-neutral-900">{d.nro}</td>
                            <td className="px-4 py-3 text-right font-medium">${d.cuota.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right text-neutral-600">${d.capital.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right text-neutral-600">${d.interes.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right text-neutral-500">${Math.abs(d.saldoResidual).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


