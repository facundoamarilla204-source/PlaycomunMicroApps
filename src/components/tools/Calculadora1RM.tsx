'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

export function Calculadora1RM() {
  const [pesoStr, setPesoStr] = useState('');
  const [repsStr, setRepsStr] = useState('');
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');
  const [formula, setFormula] = useState<'epley' | 'brzycki' | 'lander'>('epley');
  const [copied, setCopied] = useState(false);

  const parseNum = (str: string) => {
    if (!str) return 0;
    const val = parseFloat(str.replace(/,/g, '.'));
    return Number.isNaN(val) || val <= 0 ? 0 : val;
  };

  const parseQty = (str: string) => {
    if (!str) return 0;
    const val = parseInt(str.replace(/\D/g, ''), 10);
    return Number.isNaN(val) || val <= 0 ? 0 : val;
  };

  const handleDecimalChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '');
    val = val.replace(/\./g, ','); // Usar coma para decimales
    // Permitir solo una coma
    const parts = val.split(',');
    if (parts.length > 2) {
      val = parts[0] + ',' + parts.slice(1).join('');
    }
    setter(val);
  };

  const handleIntegerChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val);
  };

  const toggleUnidad = () => {
    if (pesoStr) {
      const peso = parseFloat(pesoStr.replace(/,/g, '.'));
      if (!Number.isNaN(peso)) {
        if (unidad === 'kg') {
          // kg a lb
          setPesoStr((peso * 2.20462).toFixed(1).replace(/\./g, ','));
        } else {
          // lb a kg
          setPesoStr((peso / 2.20462).toFixed(1).replace(/\./g, ','));
        }
      }
    }
    setUnidad(u => u === 'kg' ? 'lb' : 'kg');
  };

  const peso = parseNum(pesoStr);
  const reps = parseQty(repsStr);

  const result = useMemo(() => {
    if (peso <= 0 || reps <= 0) return null;

    let rm1 = 0;
    
    // Si hace 1 repetición, su 1RM es el peso levantado (independiente de la fórmula)
    if (reps === 1) {
      rm1 = peso;
    } else {
      switch (formula) {
        case 'epley':
          rm1 = peso * (1 + reps / 30);
          break;
        case 'brzycki':
          // Brzycki falla matemáticamente en 37 repeticiones, y no es fiable más allá de 10-12
          if (reps >= 37) return { error: 'Demasiadas repeticiones para esta fórmula.' };
          rm1 = peso * (36 / (37 - reps));
          break;
        case 'lander':
          const divisor = 101.3 - 2.67123 * reps;
          if (divisor <= 0) return { error: 'Demasiadas repeticiones para esta fórmula.' };
          rm1 = (100 * peso) / divisor;
          break;
      }
    }

    if (rm1 <= 0 || !isFinite(rm1)) return null;

    return {
      rm1,
      peso,
      reps,
      unidad,
      formula
    };
  }, [peso, reps, formula, unidad]);

  const porcentajes = useMemo(() => {
    if (!result || 'error' in result) return [];
    
    const rm = result.rm1;
    const desc = [
      { p: 100, label: '1RM (Fuerza máxima)' },
      { p: 95, label: 'Fuerza máxima' },
      { p: 90, label: 'Fuerza máxima' },
      { p: 85, label: 'Fuerza / Hipertrofia' },
      { p: 80, label: 'Hipertrofia' },
      { p: 75, label: 'Hipertrofia' },
      { p: 70, label: 'Hipertrofia / Resistencia' },
      { p: 65, label: 'Resistencia' },
      { p: 60, label: 'Resistencia' },
      { p: 55, label: 'Calentamiento' },
      { p: 50, label: 'Calentamiento' },
    ];

    return desc.map(d => ({
      porcentaje: d.p,
      peso: rm * (d.p / 100),
      label: d.label
    }));
  }, [result]);

  const handleCopy = () => {
    if (!result || 'error' in result) return;
    const text = `Mi 1RM estimado: ${result.rm1.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ${result.unidad} (${result.reps} reps con ${result.peso} ${result.unidad})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPesoStr('');
    setRepsStr('');
  };

  const formulaNames = {
    epley: 'Epley (Recomendada)',
    brzycki: 'Brzycki',
    lander: 'Lander'
  };

  return (
    <div className="grid gap-8 items-start w-full lg:grid-cols-12 max-w-5xl mx-auto">
      {/* Form Column */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-slate-900">Datos del levantamiento</h3>
            </div>
            <button
              type="button"
              onClick={toggleUnidad}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-lg transition-colors border border-purple-200"
            >
              Cambiar a {unidad === 'kg' ? 'Libras (lb)' : 'Kilos (kg)'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Peso levantado ({unidad})
            </label>
            <p className="text-xs text-slate-500 mb-2">
              El peso total utilizado en una serie realizada con técnica estricta.
            </p>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={pesoStr}
                onChange={handleDecimalChange(setPesoStr)}
                className="block w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-base transition-colors placeholder:text-slate-400"
                placeholder="Ej: 100"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                {unidad}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Repeticiones completadas
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Número de repeticiones realizadas antes del fallo muscular.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
              {['1', '3', '5', '8', '10', '12'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRepsStr(r)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    repsStr === r
                      ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  {r} {r === '1' ? 'rep' : 'reps'}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={repsStr}
              onChange={handleIntegerChange(setRepsStr)}
              className="block w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors"
              placeholder="O ingresá otra cantidad (ej: 4)"
            />
            {repsStr !== '' && reps > 12 && (
              <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                <strong>Aviso:</strong> Las fórmulas de 1RM tienen mayor precisión en el rango de 1 a 10 repeticiones. Por encima de 12 repeticiones la estimación puede variar.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Fórmula de cálculo
            </label>
            <select
              value={formula}
              onChange={(e) => setFormula(e.target.value as 'epley' | 'brzycki' | 'lander')}
              className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-medium bg-white text-slate-700"
            >
              <option value="epley">Epley — Fórmula estándar y recomendada para fuerza general</option>
              <option value="brzycki">Brzycki — Muy utilizada en culturismo e hipertrofia</option>
              <option value="lander">Lander — Precisa para rangos medios de repetición</option>
            </select>
          </div>

          {result && 'error' in result && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {result.error}
            </div>
          )}
        </section>
      </div>

      {/* Result Card Column */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 w-full space-y-6">
        {result && !('error' in result) ? (
          <>
            <div
              aria-live="polite"
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  1RM Estimado (Fuerza Máxima)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-semibold">
                  1 repetición máxima
                </span>
              </div>

              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 flex items-baseline gap-2">
                {result.rm1.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                <span className="text-xl sm:text-2xl font-bold text-purple-300">{result.unidad}</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Serie registrada</span>
                  <span className="font-semibold text-white">
                    {result.peso} {result.unidad} × {result.reps} {result.reps === 1 ? 'repetición' : 'repeticiones'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Fórmula matemática</span>
                  <span className="font-semibold text-purple-300">{formulaNames[result.formula]}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 bg-white text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado al portapapeles' : 'Copiar 1RM'}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <p className="mt-4 text-[11px] text-slate-400 leading-relaxed text-center">
                Cálculo predictivo sub-máximo. Priorizá siempre la técnica y la seguridad al entrenar con cargas pesadas.
              </p>
            </div>

            {/* Percentage Table */}
            {porcentajes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 w-full">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Tabla orientativa de cargas</h4>

                <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 rounded-l-lg">% 1RM</th>
                        <th className="px-3 py-2">Carga</th>
                        <th className="px-3 py-2 rounded-r-lg text-right">Zona de trabajo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {porcentajes.map((p, i) => (
                        <tr
                          key={p.porcentaje}
                          className={`hover:bg-slate-50/70 transition-colors ${i === 0 ? 'bg-purple-50/50 font-bold' : ''}`}
                        >
                          <td className="px-3 py-2 font-bold text-slate-900">{p.porcentaje}%</td>
                          <td className="px-3 py-2 font-semibold text-purple-700">
                            {p.peso.toLocaleString('es-AR', { maximumFractionDigits: 1 })} {result.unidad}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">{p.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-2xl p-7 text-center bg-white/70">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center mx-auto mb-3">
              Kg
            </div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Calculá tu fuerza máxima</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Ingresá el peso y las repeticiones que lograste para proyectar tu 1RM teórico y la tabla completa de porcentajes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


