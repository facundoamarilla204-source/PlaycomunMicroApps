'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

export function CalculadoraCalorias() {
  const [sexo, setSexo] = useState<'masculino' | 'femenino' | ''>('');
  const [edadStr, setEdadStr] = useState('');
  const [pesoStr, setPesoStr] = useState('');
  const [alturaStr, setAlturaStr] = useState('');
  const [actividad, setActividad] = useState<number | ''>('');
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

  const edad = parseQty(edadStr);
  const peso = parseNum(pesoStr);
  const altura = parseQty(alturaStr);

  const result = useMemo(() => {
    if (!sexo || edad <= 0 || peso <= 0 || altura <= 0 || actividad === '') return null;
    if (edad > 120 || altura > 250 || peso > 300) return { error: 'Por favor, revisá los valores ingresados. Parecen estar fuera del rango habitual.' };

    let bmr = 0;
    if (sexo === 'masculino') {
      bmr = (10 * peso) + (6.25 * altura) - (5 * edad) + 5;
    } else {
      bmr = (10 * peso) + (6.25 * altura) - (5 * edad) - 161;
    }

    if (bmr <= 0) return { error: 'Los valores ingresados no generan un resultado válido.' };

    const tdee = bmr * actividad;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
    };
  }, [sexo, edad, peso, altura, actividad]);

  const handleCopy = () => {
    if (!result || 'error' in result) return;
    const text = `Mis calorías diarias (TDEE): ${result.tdee.toLocaleString('es-AR')} kcal/día | Metabolismo basal (BMR): ${result.bmr.toLocaleString('es-AR')} kcal/día`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setSexo('');
    setEdadStr('');
    setPesoStr('');
    setAlturaStr('');
    setActividad('');
  };

  return (
    <div className={`grid gap-8 items-start w-full ${result && !('error' in result) ? 'lg:grid-cols-2 max-w-6xl mx-auto' : 'max-w-xl mx-auto'}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        <section className="space-y-5">
          <h3 className="font-semibold text-lg text-neutral-900">1. Datos personales</h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Sexo biológico
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSexo('femenino')}
                className={`py-3 px-4 rounded-xl border font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  sexo === 'femenino' 
                    ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED]' 
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Femenino
              </button>
              <button
                onClick={() => setSexo('masculino')}
                className={`py-3 px-4 rounded-xl border font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  sexo === 'masculino' 
                    ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED]' 
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Masculino
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Edad (años)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={edadStr}
              onChange={handleIntegerChange(setEdadStr)}
              className="block w-full px-3 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
              placeholder="Ej: 30"
            />
          </div>
        </section>

        <section className="space-y-5 pt-6 border-t border-neutral-100">
          <h3 className="font-semibold text-lg text-neutral-900">2. Medidas corporales</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Peso
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesoStr}
                  onChange={handleDecimalChange(setPesoStr)}
                  className="block w-full pl-3 pr-10 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                  placeholder="Ej: 70"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 font-medium sm:text-sm">kg</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Altura
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={alturaStr}
                  onChange={handleIntegerChange(setAlturaStr)}
                  className="block w-full pl-3 pr-10 py-3 rounded-xl border border-neutral-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm transition-colors"
                  placeholder="Ej: 175"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 font-medium sm:text-sm">cm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 pt-6 border-t border-neutral-100">
          <h3 className="font-semibold text-lg text-neutral-900">3. Nivel de actividad</h3>
          <p className="text-sm text-neutral-500 mb-3">
            Seleccioná la opción que mejor describa tu rutina semanal:
          </p>
          <div className="space-y-3">
            {[
              { val: 1.2, label: 'Sedentario', desc: 'Poco o ningún ejercicio' },
              { val: 1.375, label: 'Ligero', desc: 'Ejercicio ligero 1-3 días por semana' },
              { val: 1.55, label: 'Moderado', desc: 'Ejercicio moderado 3-5 días por semana' },
              { val: 1.725, label: 'Alto', desc: 'Ejercicio intenso 6-7 días por semana' },
              { val: 1.9, label: 'Muy alto', desc: 'Trabajo físico demandante o entrenamientos dobles' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setActividad(opt.val)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  actividad === opt.val
                    ? 'border-[#7C3AED] bg-purple-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className={`font-semibold ${actividad === opt.val ? 'text-[#7C3AED]' : 'text-neutral-900'}`}>
                  {opt.label}
                </div>
                <div className={`text-sm mt-1 ${actividad === opt.val ? 'text-purple-700' : 'text-neutral-500'}`}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>

      {result && 'error' in result && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl lg:col-span-1">
          {result.error}
        </div>
      )}

      {result && !('error' in result) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#7C3AED] rounded-3xl p-6 sm:p-8 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FlameIcon className="w-48 h-48 -mr-12 -mt-12" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-purple-200 font-medium uppercase tracking-wider text-sm mb-2">Calorías de Mantenimiento</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight">{result.tdee.toLocaleString('es-AR')}</span>
                  <span className="text-purple-200 font-medium text-lg">kcal/día</span>
                </div>
                <p className="text-purple-100 text-sm mt-2 max-w-sm">
                  Esta es una estimación de tu gasto energético diario (TDEE). Consumí esta cantidad para mantener tu peso actual.
                </p>
              </div>

              <div className="pt-6 border-t border-purple-500/30 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-100">Metabolismo basal (BMR)</span>
                  <span className="font-semibold">{result.bmr.toLocaleString('es-AR')} kcal</span>
                </div>
              </div>

              <div className="pt-6 border-t border-purple-500/30 flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 text-white border border-white/20"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  onClick={reset}
                  className="flex-1 bg-transparent hover:bg-white/10 transition-colors py-3 px-4 rounded-xl font-medium text-purple-100 border border-purple-400/30"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8">
            <h3 className="font-semibold text-lg text-neutral-900 mb-6">Objetivos orientativos</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                <div>
                  <div className="font-medium text-neutral-900">Pérdida de peso</div>
                  <div className="text-sm text-neutral-500 mt-1">Déficit suave (~500 kcal)</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#7C3AED] text-lg">{(result.tdee - 500).toLocaleString('es-AR')}</div>
                  <div className="text-xs text-neutral-500 font-medium">kcal/día</div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                <div>
                  <div className="font-medium text-neutral-900">Aumento de peso</div>
                  <div className="text-sm text-neutral-500 mt-1">Superávit suave (~500 kcal)</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#7C3AED] text-lg">{(result.tdee + 500).toLocaleString('es-AR')}</div>
                  <div className="text-xs text-neutral-500 font-medium">kcal/día</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
              Los resultados son estimaciones matemáticas y pueden variar según la composición corporal, actividad, metabolismo y otros factores individuales. Esta herramienta no reemplaza la evaluación de un profesional de la salud o nutrición.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
