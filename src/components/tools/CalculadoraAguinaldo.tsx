'use client';

import { useState, useMemo, useEffect } from 'react';
import { calculateAguinaldo, estimateNet } from '@/lib/aguinaldo';
import { AGUINALDO_CONFIG } from '@/lib/aguinaldo.config';

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

  const result = useMemo(() => {
    if (Number.isNaN(bestSalary) || bestSalary <= 0) return null;
    if (!workedAllSemester && (Number.isNaN(daysWorked) || daysWorked <= 0 || daysWorked > AGUINALDO_CONFIG.SEMESTER_DAYS)) return null;

    const res = calculateAguinaldo({
      bestSalary,
      workedAllSemester,
      daysWorked: !workedAllSemester ? daysWorked : undefined,
    });

    if (!res.success) return null;

    let netEstimate = null;
    if (showNet) {
      netEstimate = estimateNet(res.data.gross);
    }

    return { ...res.data, netEstimate };
  }, [bestSalary, workedAllSemester, daysWorked, showNet]);

  const errorMsg = useMemo(() => {
    if (bestSalaryStr && (Number.isNaN(bestSalary) || bestSalary <= 0)) {
      return 'Ingresá un sueldo mayor a cero.';
    }
    if (!workedAllSemester && daysWorkedStr && (Number.isNaN(daysWorked) || daysWorked <= 0 || daysWorked > AGUINALDO_CONFIG.SEMESTER_DAYS)) {
      return 'Ingresá una cantidad de días entre 1 y 180.';
    }
    return null;
  }, [bestSalaryStr, bestSalary, workedAllSemester, daysWorkedStr, daysWorked]);

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
    <div className={`grid gap-8 items-start ${result ? 'lg:grid-cols-2' : 'max-w-xl mx-auto'}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-6">
        {/* Semester Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Semestre</label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-colors ${semester === '1' ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]' : 'border-neutral-200 hover:bg-neutral-50'}`}>
              <input 
                type="radio" 
                name="semester" 
                value="1" 
                checked={semester === '1'} 
                onChange={() => setSemester('1')}
                className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span className="font-medium text-sm">1.er semestre (enero a junio)</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-colors ${semester === '2' ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]' : 'border-neutral-200 hover:bg-neutral-50'}`}>
              <input 
                type="radio" 
                name="semester" 
                value="2" 
                checked={semester === '2'} 
                onChange={() => setSemester('2')}
                className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span className="font-medium text-sm">2.º semestre (julio a diciembre)</span>
            </label>
          </div>
        </div>

        {/* Salary Input */}
        <div>
          <label htmlFor="bestSalary" className="block text-sm font-medium text-neutral-700 mb-1">
            Mejor remuneración mensual bruta
          </label>
          <p className="text-xs text-neutral-500 mb-2">Tu sueldo bruto más alto del semestre, con horas extras y adicionales. No sumes conceptos no remunerativos.</p>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-500 sm:text-sm">$</span>
            </div>
            <input
              type="text"
              id="bestSalary"
              inputMode="decimal"
              className={`block w-full pl-7 pr-3 py-3 rounded-xl border ${errorMsg && bestSalaryStr ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'} sm:text-sm transition-colors`}
              placeholder="1000000"
              value={bestSalaryStr}
              onChange={handleSalaryChange}
            />
          </div>
        </div>

        {/* Worked All Semester */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">¿Trabajaste todo el semestre?</label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-colors ${workedAllSemester ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]' : 'border-neutral-200 hover:bg-neutral-50'}`}>
              <input 
                type="radio" 
                name="workedAllSemester" 
                checked={workedAllSemester} 
                onChange={() => setWorkedAllSemester(true)}
                className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span className="font-medium text-sm">Sí</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-colors ${!workedAllSemester ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]' : 'border-neutral-200 hover:bg-neutral-50'}`}>
              <input 
                type="radio" 
                name="workedAllSemester" 
                checked={!workedAllSemester} 
                onChange={() => setWorkedAllSemester(false)}
                className="w-4 h-4 accent-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span className="font-medium text-sm">No, ingresé o dejé de trabajar durante el semestre</span>
            </label>
          </div>
        </div>

        {/* Days Worked */}
        {!workedAllSemester && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="daysWorked" className="block text-sm font-medium text-neutral-700 mb-1">
              Días trabajados
            </label>
            <p className="text-xs text-neutral-500 mb-2">Contá 30 días por mes. Si ingresaste el 1 de octubre, son 90 días.</p>
            <input
              type="number"
              id="daysWorked"
              min="1"
              max={AGUINALDO_CONFIG.SEMESTER_DAYS}
              className={`block w-full px-3 py-3 rounded-xl border ${errorMsg && daysWorkedStr && (!daysWorked || daysWorked <= 0 || daysWorked > AGUINALDO_CONFIG.SEMESTER_DAYS) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'} sm:text-sm transition-colors`}
              placeholder="90"
              value={daysWorkedStr}
              onChange={(e) => setDaysWorkedStr(e.target.value)}
            />
          </div>
        )}

        {/* Show Net Option */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="showNet"
              type="checkbox"
              checked={showNet}
              onChange={(e) => setShowNet(e.target.checked)}
              className="focus:ring-[#7C3AED] h-4 w-4 accent-[#7C3AED] border-neutral-300 rounded text-[#7C3AED]"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="showNet" className="font-medium text-neutral-700 cursor-pointer">
              Ver neto estimado (con descuentos de ley)
            </label>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg" role="alert">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 lg:mt-0 lg:sticky lg:top-8 bg-[#7C3AED] text-white rounded-2xl p-6 sm:p-8 shadow-xl" aria-live="polite">
            <div className="text-center mb-6">
              <p className="text-sm text-white/80 font-medium mb-1">Aguinaldo Bruto</p>
              <p className="text-4xl lg:text-5xl font-bold text-white">
                ${result.gross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </p>
            </div>

            {showNet && result.netEstimate && (
              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-sm text-white/80">
                  <span>Jubilación (11%)</span>
                  <span>-${result.netEstimate.deductions.retirement.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-white/80">
                  <span>Obra Social (3%)</span>
                  <span>-${result.netEstimate.deductions.healthInsurance.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-white/80">
                  <span>PAMI (3%)</span>
                  <span>-${result.netEstimate.deductions.pami.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between font-semibold text-white">
                  <span>Aguinaldo Neto Estimado</span>
                  <span>${result.netEstimate.net.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-white mb-2">La cuenta paso a paso:</p>
                <ul className="text-sm text-white/80 space-y-1 list-disc pl-5">
                  {result.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-white mb-1">Fecha límite de pago:</p>
                <p className="text-sm text-white/80">
                  Hasta el <strong>{deadline.LEGAL_DEADLINE}</strong> {deadline.MARGIN_TEXT}.
                </p>
              </div>
            </div>

            <div className="text-xs text-white/70 bg-white/10 p-3 rounded-lg border border-white/10 mb-6">
              <strong className="text-white">Importante:</strong> Resultado orientativo. Tu liquidación real puede variar según tu convenio colectivo, los conceptos de tu recibo y tus descuentos. Consultalo con tu empleador o un contador.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-white text-[#7C3AED] hover:bg-white/90 active:bg-white transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
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
                className="px-4 py-3 border border-white/30 hover:bg-white/10 rounded-xl font-medium transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
