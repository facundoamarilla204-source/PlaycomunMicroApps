'use client';

import { useState, useMemo, useEffect } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        reset();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        // Solo copiar si hay resultados y no estamos seleccionando texto
        if (result && !('error' in result) && window.getSelection()?.toString() === '') {
          e.preventDefault();
          handleCopy();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result]);

  return (
    <div className="grid gap-8 items-start w-full lg:grid-cols-12 max-w-5xl mx-auto">
      {/* Form Column */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-sm text-slate-900">Datos personales</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Sexo biológico
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSexo('femenino')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  sexo === 'femenino'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                Femenino
              </button>
              <button
                type="button"
                onClick={() => setSexo('masculino')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  sexo === 'masculino'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                Masculino
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Edad (años cumplidos)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={edadStr}
              onChange={handleIntegerChange(setEdadStr)}
              className="block w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors"
              placeholder="Ej: 30"
            />
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-sm text-slate-900">Medidas corporales</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Peso actual
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesoStr}
                  onChange={handleDecimalChange(setPesoStr)}
                  className="block w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors"
                  placeholder="Ej: 70"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  kg
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Altura
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={alturaStr}
                  onChange={handleIntegerChange(setAlturaStr)}
                  className="block w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-slate-900 font-medium text-sm transition-colors"
                  placeholder="Ej: 175"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  cm
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-sm text-slate-900">Nivel de actividad física</h3>
          </div>

          <div className="space-y-2">
            {[
              { val: 1.2, label: 'Sedentario', desc: 'Poco o ningún ejercicio semanal, trabajo de oficina' },
              { val: 1.375, label: 'Ligero', desc: 'Actividad ligera o deporte 1 a 3 días por semana' },
              { val: 1.55, label: 'Moderado', desc: 'Entrenamiento moderado 3 a 5 días por semana' },
              { val: 1.725, label: 'Alto', desc: 'Entrenamiento intenso o exigente 6 a 7 días por semana' },
              { val: 1.9, label: 'Muy alto', desc: 'Atleta de competición o trabajo físico pesado diario' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setActividad(opt.val)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  actividad === opt.val
                    ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    actividad === opt.val ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}
                >
                  {actividad === opt.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className={`font-semibold text-xs sm:text-sm ${actividad === opt.val ? 'text-purple-900' : 'text-slate-900'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Result Card Column */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 w-full space-y-6">
        {result && 'error' in result && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
            {result.error}
          </div>
        )}

        {result && !('error' in result) ? (
          <>
            <div
              aria-live="polite"
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Gasto Calórico Diario (TDEE)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-semibold">
                  Mantenimiento
                </span>
              </div>

              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 flex items-baseline gap-2">
                {result.tdee.toLocaleString('es-AR')}
                <span className="text-xl sm:text-2xl font-bold text-purple-300">kcal/día</span>
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Calorías necesarias para mantener tu peso corporal con tu nivel de actividad actual.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Metabolismo Basal (BMR)</span>
                  <span className="font-semibold text-white">
                    {result.bmr.toLocaleString('es-AR')} kcal
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
                  {copied ? 'Copiado al portapapeles' : 'Copiar calorías'}
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

            {/* Target Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Metas según objetivo</h4>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Déficit calórico (Pérdida de grasa)</span>
                  <span className="text-[11px] text-slate-500">Déficit sostenible de ~500 kcal</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-purple-700">
                    {(result.tdee - 500).toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">kcal/día</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Superávit calórico (Aumento muscular)</span>
                  <span className="text-[11px] text-slate-500">Superávit controlado de ~500 kcal</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-700">
                    {(result.tdee + 500).toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">kcal/día</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Fórmula Mifflin-St Jeor. Estimación orientativa no médica; consultá siempre a un profesional de la nutrición para planes personalizados.
              </p>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-2xl p-7 text-center bg-white/70">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center mx-auto mb-3">
              kcal
            </div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Calculá tu gasto metabólico</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Completá tus datos para conocer tus requerimientos de mantenimiento, déficit y superávit diario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


