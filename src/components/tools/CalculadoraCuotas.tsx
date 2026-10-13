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
    <div className="grid gap-8 items-start w-full lg:grid-cols-12 max-w-5xl mx-auto">
      {/* Input Form */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-6">
        {/* Mode Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Tipo de financiación
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setMode('sin_interes')}
              className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center ${
                mode === 'sin_interes'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuotas sin interés
            </button>
            <button
              type="button"
              onClick={() => setMode('con_interes')}
              className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center ${
                mode === 'con_interes'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con interés (Sistema Francés)
            </button>
          </div>
        </div>

        {/* Inputs */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-sm text-slate-900">Monto y plazos</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Monto total a financiar
            </label>
            <p className="text-xs text-slate-500 mb-2">
              El valor de compra de contado o el capital inicial del crédito.
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-base">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={montoStr}
                onChange={handleCurrencyChange(setMontoStr)}
                className="block w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-base transition-colors placeholder:text-slate-400"
                placeholder="120.000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Cantidad de cuotas
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
              {['3', '6', '12', '18', '24', '36'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuotasStr(c)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    cuotasStr === c
                      ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  {c} pagos
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={cuotasStr}
              onChange={handleQuantityChange}
              className="block w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors"
              placeholder="O ingresá otra cantidad (ej: 9)"
            />
            {cuotasStr !== '' && cuotas === 0 && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">La cantidad debe ser mayor a 0</p>
            )}
          </div>

          {mode === 'con_interes' && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Tasa de interés
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tasaStr}
                    onChange={handlePercentageChange(setTasaStr)}
                    className="block w-full pl-4 pr-9 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors placeholder:text-slate-400"
                    placeholder="Ej: 5.5"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                    %
                  </span>
                </div>
                <div className="sm:col-span-6">
                  <select
                    value={tipoTasa}
                    onChange={(e) => setTipoTasa(e.target.value as 'mensual' | 'anual')}
                    className="block w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-medium bg-white text-slate-700"
                  >
                    <option value="mensual">Mensual (TEM)</option>
                    <option value="anual">Anual (TNA)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl leading-relaxed">
                Utiliza el <strong>sistema de amortización francés</strong>: cuota fija periódica con intereses decrecientes calculados sobre el saldo adeudado.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Result Card */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 w-full space-y-6">
        {result ? (
          <>
            <div
              aria-live="polite"
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Cuota Mensual Estimada
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-semibold">
                  {result.cantidadCuotas} cuotas {mode === 'sin_interes' ? 'fijas' : ''}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
                ${result.valorCuota.toLocaleString('es-AR', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Monto financiado</span>
                  <span className="font-semibold text-white">
                    ${result.montoFinanciado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total de intereses</span>
                  <span className="font-semibold text-purple-300">
                    {result.totalIntereses > 0
                      ? `+ $${result.totalIntereses.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                      : '$0 (Sin interés)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200 pt-2 border-t border-slate-800">
                  <span className="font-medium">Total a pagar</span>
                  <span className="font-bold text-white text-base">
                    ${result.totalPagado.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 bg-white text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado al portapapeles' : 'Copiar desglose'}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Amortization Table */}
            {desglose.length > 0 && desglose.length <= 60 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 w-full">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Cronograma de pagos</h4>

                {/* Mobile Cards */}
                <div className="block sm:hidden space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                  {desglose.map((d) => (
                    <div key={d.nro} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-900 mb-2 border-b border-slate-200/60 pb-1">
                        <span>Cuota {d.nro}</span>
                        <span className="text-purple-700">${d.cuota.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Capital:</span>
                        <span>${d.capital.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Interés:</span>
                        <span>${d.interes.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Saldo residual:</span>
                        <span>${Math.abs(d.saldoResidual).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto w-full">
                  <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 rounded-l-lg">Nº</th>
                          <th className="px-3 py-2 text-right">Cuota</th>
                          <th className="px-3 py-2 text-right">Capital</th>
                          <th className="px-3 py-2 text-right">Interés</th>
                          <th className="px-3 py-2 text-right rounded-r-lg">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {desglose.map((d) => (
                          <tr key={d.nro} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2 font-bold text-slate-900">{d.nro}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-900">
                              ${d.cuota.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600">
                              ${d.capital.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600">
                              ${d.interes.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-500 font-mono">
                              ${Math.abs(d.saldoResidual).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-2xl p-7 text-center bg-white/70">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center mx-auto mb-3">
              %
            </div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Simulador de cuotas</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Ingresá el importe y número de cuotas para calcular el valor mensual y la tabla detallada de amortización.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


