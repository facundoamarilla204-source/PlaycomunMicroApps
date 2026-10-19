'use client';

import { useState, useMemo, useEffect } from 'react';
import { calculateAguinaldo, estimateNet } from '@/lib/aguinaldo';
import { AGUINALDO_CONFIG, getSemesterDays } from '@/lib/aguinaldo.config';

export function CalculadoraAguinaldo() {
  const [semester, setSemester] = useState<'1' | '2'>('1');
  
  useEffect(() => {
    setSemester(new Date().getMonth() < 6 ? '1' : '2');
  }, []);
  const [bestSalaryStr, setBestSalaryStr] = useState('');
  const [workedAllSemester, setWorkedAllSemester] = useState(true);
  const [daysWorkedStr, setDaysWorkedStr] = useState('');
  const [showNet, setShowNet] = useState(false);
  const [copied, setCopied] = useState(false);

  const bestSalary = parseFloat(bestSalaryStr.replace(/\./g, '').replace(',', '.'));
  const daysWorked = parseInt(daysWorkedStr, 10);
  const totalSemesterDays = getSemesterDays(semester, AGUINALDO_CONFIG.YEAR);

  const result = useMemo(() => {
    if (Number.isNaN(bestSalary) || bestSalary <= 0) return null;
    if (!workedAllSemester && (Number.isNaN(daysWorked) || daysWorked <= 0 || daysWorked > totalSemesterDays)) return null;

    const res = calculateAguinaldo({
      bestSalary,
      workedAllSemester,
      daysWorked: !workedAllSemester ? daysWorked : undefined,
      semester,
      year: AGUINALDO_CONFIG.YEAR,
    });

    if (!res.success) return null;

    let netEstimate = null;
    if (showNet) {
      netEstimate = estimateNet(res.data.gross);
    }

    return { ...res.data, netEstimate };
  }, [bestSalary, workedAllSemester, daysWorked, semester, totalSemesterDays, showNet]);

  const errorMsg = useMemo(() => {
    if (bestSalaryStr && (Number.isNaN(bestSalary) || bestSalary <= 0)) {
      return 'Ingresá un sueldo mayor a cero.';
    }
    if (!workedAllSemester && daysWorkedStr && (Number.isNaN(daysWorked) || daysWorked <= 0 || daysWorked > totalSemesterDays)) {
      return `Ingresá una cantidad de días entre 1 y ${totalSemesterDays}.`;
    }
    return null;
  }, [bestSalaryStr, bestSalary, workedAllSemester, daysWorkedStr, daysWorked, totalSemesterDays]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,]/g, '');
    const parts = val.split(',');
    let integerPart = parts[0];
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    val = parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
    setBestSalaryStr(val);
  };

  const handleCopy = () => {
    if (!result) return;
    let text = `Mi aguinaldo bruto estimado es: $${result.gross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    if (result.netEstimate) {
      text += `\nMi aguinaldo neto estimado es: $${result.netEstimate.net.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deadline = semester === '1' 
    ? AGUINALDO_CONFIG.PAYMENT_DATES.JUNE 
    : AGUINALDO_CONFIG.PAYMENT_DATES.DECEMBER;

  return (
    <div className={`grid gap-8 items-start w-full ${result ? 'lg:grid-cols-12 max-w-5xl mx-auto' : 'max-w-xl mx-auto'}`}>
      <div className={`${result ? 'lg:col-span-7' : 'w-full'} bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6`}>
        {/* Semester Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Semestre a liquidar</label>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <label className={`cursor-pointer rounded-lg border p-3 flex items-center gap-2.5 transition-colors ${semester === '1' ? 'border-brand bg-purple-50/40 text-slate-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
              <input 
                type="radio" 
                name="semester" 
                value="1" 
                checked={semester === '1'} 
                onChange={() => setSemester('1')}
                className="w-4 h-4 accent-brand"
              />
              <span className="font-semibold text-xs">1.er semestre (junio)</span>
            </label>
            <label className={`cursor-pointer rounded-lg border p-3 flex items-center gap-2.5 transition-colors ${semester === '2' ? 'border-brand bg-purple-50/40 text-slate-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
              <input 
                type="radio" 
                name="semester" 
                value="2" 
                checked={semester === '2'} 
                onChange={() => setSemester('2')}
                className="w-4 h-4 accent-brand"
              />
              <span className="font-semibold text-xs">2.º semestre (diciembre)</span>
            </label>
          </div>
        </div>

        {/* Salary Input */}
        <div>
          <label htmlFor="bestSalary" className="block text-xs font-semibold text-slate-700 mb-1">
            Mejor remuneración mensual bruta del semestre *
          </label>
          <p className="text-xs text-slate-500 mb-2">El sueldo bruto más alto percibido, incluyendo horas extras y adicionales remunerativos.</p>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 text-sm">$</span>
            </div>
            <input
              type="text"
              id="bestSalary"
              inputMode="decimal"
              className={`block w-full pl-7 pr-3 py-2.5 rounded-lg border ${errorMsg && bestSalaryStr ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20'} text-sm text-slate-900 shadow-2xs transition-colors`}
              placeholder="1000000"
              value={bestSalaryStr}
              onChange={handleSalaryChange}
            />
          </div>
        </div>

        {/* Worked All Semester */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">¿Trabajaste durante todo el semestre?</label>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <label className={`cursor-pointer rounded-lg border p-3 flex items-center gap-2.5 transition-colors ${workedAllSemester ? 'border-brand bg-purple-50/40 text-slate-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
              <input 
                type="radio" 
                name="workedAllSemester" 
                checked={workedAllSemester} 
                onChange={() => setWorkedAllSemester(true)}
                className="w-4 h-4 accent-brand"
              />
              <span className="font-semibold text-xs">Sí, semestre completo</span>
            </label>
            <label className={`cursor-pointer rounded-lg border p-3 flex items-center gap-2.5 transition-colors ${!workedAllSemester ? 'border-brand bg-purple-50/40 text-slate-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
              <input 
                type="radio" 
                name="workedAllSemester" 
                checked={!workedAllSemester} 
                onChange={() => setWorkedAllSemester(false)}
                className="w-4 h-4 accent-brand"
              />
              <span className="font-semibold text-xs">No, trabajé menos días</span>
            </label>
          </div>
        </div>

        {/* Days Worked */}
        {!workedAllSemester && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <label htmlFor="daysWorked" className="block text-xs font-semibold text-slate-700 mb-1">
              Días trabajados en el semestre
            </label>
            <p className="text-xs text-slate-500 mb-1.5">Ingresá los días corridos trabajados en el semestre (máximo {totalSemesterDays} días).</p>
            <input
              type="number"
              id="daysWorked"
              min="1"
              max={totalSemesterDays}
              className={`block w-full px-3 py-2.5 rounded-lg border ${errorMsg && daysWorkedStr && (!daysWorked || daysWorked <= 0 || daysWorked > totalSemesterDays) ? 'border-red-300' : 'border-slate-300'} text-sm text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors`}
              placeholder={semester === '1' ? '90' : '90'}
              value={daysWorkedStr}
              onChange={(e) => setDaysWorkedStr(e.target.value)}
            />
          </div>
        )}

        {/* Show Net Option */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            id="showNet"
            type="checkbox"
            checked={showNet}
            onChange={(e) => setShowNet(e.target.checked)}
            className="w-4 h-4 accent-brand rounded border-slate-300"
          />
          <label htmlFor="showNet" className="text-xs font-semibold text-slate-800 cursor-pointer">
            Calcular aguinaldo neto estimado (con descuentos de ley 17%)
          </label>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl p-5 sm:p-7 shadow-sm border border-slate-800" aria-live="polite">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Aguinaldo Bruto Estimado</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ${result.gross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {showNet && result.netEstimate && (
            <div className="mb-5 space-y-2 text-xs sm:text-sm bg-slate-800/60 p-3.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Jubilación (11%)</span>
                <span>-${result.netEstimate.deductions.retirement.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Obra Social (3%)</span>
                <span>-${result.netEstimate.deductions.healthInsurance.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PAMI Ley 19.032 (3%)</span>
                <span>-${result.netEstimate.deductions.pami.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between font-bold text-emerald-400 text-sm">
                <span>Neto de bolsillo est.</span>
                <span>${result.netEstimate.net.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-5 text-xs text-slate-300">
            <div>
              <p className="font-bold text-white mb-1.5">Fórmula aplicada:</p>
              <ul className="space-y-1 list-disc pl-4 text-slate-300">
                {result.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
            
            <div className="pt-2 border-t border-slate-800">
              <p className="font-bold text-white mb-0.5">Vencimiento legal de pago:</p>
              <p className="text-slate-300">
                Hasta el <strong>{deadline.LEGAL_DEADLINE}</strong> (Ley 27.073).
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 mb-5 leading-relaxed">
            <strong className="text-slate-200">Aviso:</strong> Cálculo orientativo según Ley 23.041. Liquidaciones sujetas a CCT específico y conceptos no remunerativos.
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {copied ? '¡Copiado!' : 'Copiar resultado'}
            </button>
            <button
              onClick={() => {
                setBestSalaryStr('');
                setDaysWorkedStr('');
                setWorkedAllSemester(true);
                setShowNet(false);
              }}
              className="px-3 py-2.5 border border-slate-700 hover:bg-slate-800/80 rounded-lg text-xs font-medium text-slate-300 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


