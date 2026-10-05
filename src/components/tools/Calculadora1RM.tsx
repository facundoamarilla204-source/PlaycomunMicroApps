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
    <div className={`grid gap-8 items-start w-full ${result && !('error' in result) ? 'lg:grid-cols-2 max-w-6xl mx-auto' : 'max-w-xl mx-auto'}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        <section className="space-y-5">
          <h3 className="font-semibold text-lg text-neutral-900">1. Datos del levantamiento</h3>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-neutral-700">
                Peso utilizado
              </label>
              <button 
                onClick={toggleUnidad}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors bg-neutral-100 px-2 py-1 rounded-md"
              >
                Cambiar a {unidad === 'kg' ? 'Libras (lb)' : 'Kilos (kg)'}
              </button>
            </div>
            <div className="relative mt-1">
              <input
                type="text"
                inputMode="decimal"
                value={pesoStr}
                onChange={handleDecimalChange(setPesoStr)}
                className="block w-full pl-3 pr-12 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
                placeholder="Ej: 100"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 font-medium sm:text-sm">{unidad}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Repeticiones realizadas
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={repsStr}
              onChange={handleIntegerChange(setRepsStr)}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
              placeholder="Ej: 5"
            />
            {repsStr !== '' && reps > 12 && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                Nota: Las estimaciones de 1RM pierden precisión cuando se calculan con más de 10-12 repeticiones.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Fórmula de estimación
            </label>
            <select
              value={formula}
              onChange={(e) => setFormula(e.target.value as 'epley' | 'brzycki' | 'lander')}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors bg-white"
            >
              <option value="epley">Epley (Recomendada)</option>
              <option value="brzycki">Brzycki</option>
              <option value="lander">Lander</option>
            </select>
          </div>
          
          {result && 'error' in result && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {result.error}
            </div>
          )}
        </section>
      </div>

      {/* Result Card */}
      <div className={`
        ${result && !('error' in result) ? 'block' : 'hidden'} 
        lg:block lg:sticky lg:top-28
        mt-8 lg:mt-0 w-full flex flex-col gap-6
      `}>
        {result && !('error' in result) && (
          <>
            <div aria-live="polite" className="bg-neutral-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl w-full">
              <h3 className="text-white text-sm font-semibold mb-1 opacity-90">
                1RM ESTIMADO
              </h3>
              <div className="text-4xl lg:text-5xl font-bold mb-6 flex items-baseline gap-2">
                {result.rm1.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                <span className="text-2xl lg:text-3xl font-medium opacity-80">{result.unidad}</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Levantamiento ingresado</span>
                  <span className="font-semibold">{result.peso} {result.unidad} × {result.reps} reps</span>
                </div>
                <div className="flex justify-between items-center text-sm lg:text-base border-b border-white/20 pb-3">
                  <span className="opacity-90">Fórmula utilizada</span>
                  <span className="font-semibold">{formulaNames[result.formula]}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
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
              
              <p className="mt-5 text-xs text-white/70 leading-relaxed">
                El 1RM calculado es una estimación matemática basada en el rendimiento submáximo y no reemplaza una evaluación real. Puede variar según el ejercicio y técnica.
              </p>
            </div>

            {/* Desglose de Porcentajes */}
            {porcentajes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 w-full">
                <h4 className="font-semibold text-neutral-900 mb-4">Cargas orientativas</h4>
                
                <div className="w-full">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-500 uppercase bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">% RM</th>
                        <th className="px-4 py-3">Peso</th>
                        <th className="px-4 py-3 rounded-tr-lg hidden sm:table-cell">Objetivo típico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porcentajes.map((p, i) => (
                        <tr key={p.porcentaje} className={`border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 ${i === 0 ? 'bg-neutral-50/80 font-medium' : ''}`}>
                          <td className="px-4 py-3 font-semibold text-neutral-900">{p.porcentaje}%</td>
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            {p.peso.toLocaleString('es-AR', { maximumFractionDigits: 1 })} {result.unidad}
                          </td>
                          <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{p.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-neutral-500 mt-4 sm:hidden">
                    Nota: Los porcentajes más altos (85-100%) se enfocan en fuerza máxima, rangos medios (70-85%) en hipertrofia, y bajos (60-70%) en resistencia.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


