'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRightLeft, Copy, CheckCircle2, RotateCcw, Ruler, Weight, Beaker, Box, Thermometer, Gauge, Clock, HardDrive, Wind, Zap, Activity, Orbit } from 'lucide-react';

type Unit = {
  id: string;
  name: string;
  symbol: string;
  factor?: number; 
  toBase?: (val: number) => number;
  fromBase?: (val: number) => number;
};

type Category = {
  id: string;
  name: string;
  icon: React.ReactNode;
  allowNegative: boolean;
  baseUnit: string;
  units: Unit[];
  note?: string;
};

const CATEGORIES: Category[] = [
  {
    id: 'longitud',
    name: 'Longitud',
    icon: <Ruler className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'm',
    units: [
      { id: 'mm', name: 'Milímetros', symbol: 'mm', factor: 0.001 },
      { id: 'cm', name: 'Centímetros', symbol: 'cm', factor: 0.01 },
      { id: 'm', name: 'Metros', symbol: 'm', factor: 1 },
      { id: 'km', name: 'Kilómetros', symbol: 'km', factor: 1000 },
      { id: 'in', name: 'Pulgadas', symbol: 'in', factor: 0.0254 },
      { id: 'ft', name: 'Pies', symbol: 'ft', factor: 0.3048 },
      { id: 'yd', name: 'Yardas', symbol: 'yd', factor: 0.9144 },
      { id: 'mi', name: 'Millas', symbol: 'mi', factor: 1609.344 },
    ]
  },
  {
    id: 'peso',
    name: 'Masa / Peso',
    icon: <Weight className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'kg',
    units: [
      { id: 'mg', name: 'Miligramos', symbol: 'mg', factor: 0.000001 },
      { id: 'g', name: 'Gramos', symbol: 'g', factor: 0.001 },
      { id: 'kg', name: 'Kilogramos', symbol: 'kg', factor: 1 },
      { id: 't', name: 'Toneladas', symbol: 't', factor: 1000 },
      { id: 'oz', name: 'Onzas', symbol: 'oz', factor: 0.028349523125 },
      { id: 'lb', name: 'Libras', symbol: 'lb', factor: 0.45359237 },
    ]
  },
  {
    id: 'volumen',
    name: 'Volumen',
    icon: <Beaker className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'l',
    units: [
      { id: 'ml', name: 'Mililitros', symbol: 'ml', factor: 0.001 },
      { id: 'l', name: 'Litros', symbol: 'L', factor: 1 },
      { id: 'cm3', name: 'Centímetros cúbicos', symbol: 'cm³', factor: 0.001 },
      { id: 'm3', name: 'Metros cúbicos', symbol: 'm³', factor: 1000 },
      { id: 'gal_us', name: 'Galones (US)', symbol: 'gal', factor: 3.785411784 },
    ]
  },
  {
    id: 'area',
    name: 'Área',
    icon: <Box className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'm2',
    units: [
      { id: 'mm2', name: 'Milímetros cuadrados', symbol: 'mm²', factor: 0.000001 },
      { id: 'cm2', name: 'Centímetros cuadrados', symbol: 'cm²', factor: 0.0001 },
      { id: 'm2', name: 'Metros cuadrados', symbol: 'm²', factor: 1 },
      { id: 'ha', name: 'Hectáreas', symbol: 'ha', factor: 10000 },
      { id: 'km2', name: 'Kilómetros cuadrados', symbol: 'km²', factor: 1000000 },
      { id: 'in2', name: 'Pulgadas cuadradas', symbol: 'sq in', factor: 0.00064516 },
      { id: 'ft2', name: 'Pies cuadrados', symbol: 'sq ft', factor: 0.09290304 },
      { id: 'ac', name: 'Acres', symbol: 'ac', factor: 4046.8564224 },
    ]
  },
  {
    id: 'temperatura',
    name: 'Temperatura',
    icon: <Thermometer className="w-5 h-5" />,
    allowNegative: true,
    baseUnit: 'c',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: v => v, fromBase: v => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: v => (v - 32) * 5/9, fromBase: v => (v * 9/5) + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    ]
  },
  {
    id: 'velocidad',
    name: 'Velocidad',
    icon: <Gauge className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'ms',
    units: [
      { id: 'ms', name: 'Metros por segundo', symbol: 'm/s', factor: 1 },
      { id: 'kmh', name: 'Kilómetros por hora', symbol: 'km/h', factor: 0.27777777777778 },
      { id: 'mph', name: 'Millas por hora', symbol: 'mph', factor: 0.44704 },
      { id: 'kn', name: 'Nudos', symbol: 'kn', factor: 0.51444444444444 },
    ]
  },
  {
    id: 'tiempo',
    name: 'Tiempo',
    icon: <Clock className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 's',
    note: 'Nota: Los meses se calculan como 30 días y los años como 365 días.',
    units: [
      { id: 'ms', name: 'Milisegundos', symbol: 'ms', factor: 0.001 },
      { id: 's', name: 'Segundos', symbol: 's', factor: 1 },
      { id: 'min', name: 'Minutos', symbol: 'min', factor: 60 },
      { id: 'h', name: 'Horas', symbol: 'h', factor: 3600 },
      { id: 'd', name: 'Días', symbol: 'd', factor: 86400 },
      { id: 'w', name: 'Semanas', symbol: 'sem', factor: 604800 },
      { id: 'mo', name: 'Meses (aprox)', symbol: 'mes', factor: 2592000 },
      { id: 'y', name: 'Años (aprox)', symbol: 'año', factor: 31536000 },
    ]
  },
  {
    id: 'datos',
    name: 'Almacenamiento',
    icon: <HardDrive className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'b',
    units: [
      { id: 'b', name: 'Bytes', symbol: 'B', factor: 1 },
      { id: 'kb', name: 'Kilobytes (Decimal)', symbol: 'KB', factor: 1000 },
      { id: 'mb', name: 'Megabytes (Decimal)', symbol: 'MB', factor: 1000000 },
      { id: 'gb', name: 'Gigabytes (Decimal)', symbol: 'GB', factor: 1000000000 },
      { id: 'tb', name: 'Terabytes (Decimal)', symbol: 'TB', factor: 1000000000000 },
      { id: 'kib', name: 'Kibibytes (Binario)', symbol: 'KiB', factor: 1024 },
      { id: 'mib', name: 'Mebibytes (Binario)', symbol: 'MiB', factor: 1048576 },
      { id: 'gib', name: 'Gibibytes (Binario)', symbol: 'GiB', factor: 1073741824 },
      { id: 'tib', name: 'Tebibytes (Binario)', symbol: 'TiB', factor: 1099511627776 },
    ]
  },
  {
    id: 'presion',
    name: 'Presión',
    icon: <Wind className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'pa',
    units: [
      { id: 'pa', name: 'Pascales', symbol: 'Pa', factor: 1 },
      { id: 'kpa', name: 'Kilopascales', symbol: 'kPa', factor: 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', factor: 100000 },
      { id: 'psi', name: 'Libras por pulgada² (PSI)', symbol: 'psi', factor: 6894.757293168 },
      { id: 'atm', name: 'Atmósferas', symbol: 'atm', factor: 101325 },
      { id: 'mmhg', name: 'Milímetros de mercurio', symbol: 'mmHg', factor: 133.32236842105 },
    ]
  },
  {
    id: 'energia',
    name: 'Energía',
    icon: <Zap className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'j',
    units: [
      { id: 'j', name: 'Joules', symbol: 'J', factor: 1 },
      { id: 'kj', name: 'Kilojoules', symbol: 'kJ', factor: 1000 },
      { id: 'cal', name: 'Calorías', symbol: 'cal', factor: 4.184 },
      { id: 'kcal', name: 'Kilocalorías', symbol: 'kcal', factor: 4184 },
      { id: 'wh', name: 'Watt-horas', symbol: 'Wh', factor: 3600 },
      { id: 'kwh', name: 'Kilowatt-horas', symbol: 'kWh', factor: 3600000 },
    ]
  },
  {
    id: 'potencia',
    name: 'Potencia',
    icon: <Activity className="w-5 h-5" />,
    allowNegative: false,
    baseUnit: 'w',
    units: [
      { id: 'w', name: 'Watts', symbol: 'W', factor: 1 },
      { id: 'kw', name: 'Kilowatts', symbol: 'kW', factor: 1000 },
      { id: 'hp', name: 'Caballos de fuerza (HP)', symbol: 'hp', factor: 745.69987158227 },
      { id: 'cv', name: 'Caballos de vapor (CV)', symbol: 'CV', factor: 735.49875 },
    ]
  },
  {
    id: 'angulo',
    name: 'Ángulo',
    icon: <Orbit className="w-5 h-5" />,
    allowNegative: true,
    baseUnit: 'deg',
    units: [
      { id: 'deg', name: 'Grados', symbol: '°', factor: 1 },
      { id: 'rad', name: 'Radianes', symbol: 'rad', factor: 57.295779513082 },
    ]
  }
];

const QUICK_CONVERSIONS = [
  { label: 'Metros a Pies', cat: 'longitud', from: 'm', to: 'ft' },
  { label: 'Kilogramos a Libras', cat: 'peso', from: 'kg', to: 'lb' },
  { label: 'Celsius a Fahrenheit', cat: 'temperatura', from: 'c', to: 'f' },
  { label: 'Litros a Galones', cat: 'volumen', from: 'l', to: 'gal_us' },
  { label: 'Km/h a Millas/h', cat: 'velocidad', from: 'kmh', to: 'mph' },
];

export function ConversorUnidades() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('longitud');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [fromUnitId, setFromUnitId] = useState<string>('m');
  const [toUnitId, setToUnitId] = useState<string>('cm');
  const [inputValue, setInputValue] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const activeCategory = CATEGORIES.find(c => c.id === activeCategoryId) || CATEGORIES[0];

  useEffect(() => {
    // When category changes, set default units
    const cat = CATEGORIES.find(c => c.id === activeCategoryId);
    if (cat && cat.units.length >= 2) {
      setFromUnitId(cat.units[0].id);
      setToUnitId(cat.units[1].id);
      setInputValue('');
    }
  }, [activeCategoryId]);

  const handleSwap = () => {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
    if (inputValue) {
      // Si hay un valor, calculamos la conversión y la ponemos como el nuevo origen
      setInputValue(formatOutput(conversionResult).replace('.', ','));
    }
  };

  const parseInput = (val: string) => {
    if (!val) return null;
    const sanitized = val.replace(',', '.');
    const parsed = parseFloat(sanitized);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  };

  const numValue = parseInput(inputValue);

  const conversionResult = useMemo(() => {
    if (numValue === null) return 0;
    
    const fromUnit = activeCategory.units.find(u => u.id === fromUnitId);
    const toUnit = activeCategory.units.find(u => u.id === toUnitId);
    
    if (!fromUnit || !toUnit) return 0;

    let baseVal = 0;
    // To Base
    if (fromUnit.toBase) {
      baseVal = fromUnit.toBase(numValue);
    } else if (fromUnit.factor) {
      baseVal = numValue * fromUnit.factor;
    }

    // From Base to Target
    if (toUnit.fromBase) {
      return toUnit.fromBase(baseVal);
    } else if (toUnit.factor) {
      return baseVal / toUnit.factor;
    }
    
    return 0;
  }, [numValue, activeCategory, fromUnitId, toUnitId]);

  const formatOutput = (val: number): string => {
    if (val === 0) return '0';
    const absVal = Math.abs(val);
    if (absVal < 0.000001 || absVal > 1000000000) {
      return val.toExponential(4);
    }
    
    // Convert to string and handle formatting intelligently
    const strVal = val.toString();
    if (strVal.includes('e')) return val.toExponential(4);
    
    // Remove unnecessary trailing zeros if it has decimals
    if (strVal.includes('.')) {
      let rounded = parseFloat(val.toFixed(8)).toString(); // Max 8 decimals
      return rounded;
    }
    return strVal;
  };

  const handleCopy = () => {
    if (numValue === null) return;
    navigator.clipboard.writeText(formatOutput(conversionResult));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow negatives only if category allows
    if (!activeCategory.allowNegative && val.includes('-')) {
      val = val.replace('-', '');
    }
    setInputValue(val);
  };

  const applyQuickConversion = (from: string, to: string, catId: string) => {
    setActiveCategoryId(catId);
    setTimeout(() => {
      setFromUnitId(from);
      setToUnitId(to);
      setInputValue('1');
    }, 0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Categorías */}
        <div className="w-full lg:w-64 flex-shrink-0 relative z-20">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Desktop header */}
            <div className="hidden lg:block p-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900 text-sm">Categorías</h3>
            </div>
            
            {/* Mobile Dropdown Button */}
            <div className="lg:hidden p-2">
              <button 
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl shadow-sm text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-brand">{activeCategory.icon}</span>
                  <span className="font-semibold text-neutral-900">{activeCategory.name}</span>
                </div>
                <svg className={`w-5 h-5 text-neutral-500 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className={`${isCategoryMenuOpen ? 'block' : 'hidden'} lg:block p-2 grid grid-cols-1 gap-1 max-h-[300px] lg:max-h-[500px] overflow-y-auto no-scrollbar border-t border-neutral-100 lg:border-t-0`}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setIsCategoryMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    activeCategoryId === cat.id 
                      ? 'bg-brand/10 text-brand-dark' 
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <span className={activeCategoryId === cat.id ? 'text-brand' : 'text-neutral-400'}>
                    {cat.icon}
                  </span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 hidden lg:block">
            <h4 className="text-sm font-bold text-neutral-900 mb-3 px-1">Conversiones rápidas</h4>
            <div className="space-y-1.5">
              {QUICK_CONVERSIONS.map((qc, i) => (
                <button 
                  key={i}
                  onClick={() => applyQuickConversion(qc.from, qc.to, qc.cat)}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-600 hover:text-brand-dark hover:bg-brand/5 rounded-lg border border-transparent hover:border-brand/10 transition-colors"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Principal Converter */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
                {activeCategory.icon}
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">{activeCategory.name}</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 relative">
              
              {/* Origen */}
              <div className="w-full flex-1 space-y-2">
                <label className="block text-sm font-medium text-neutral-700 ml-1">De</label>
                <div className="relative group">
                  <input
                    type="text"
                    inputMode={activeCategory.allowNegative ? "text" : "decimal"}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Ingresá un valor..."
                    className="block w-full px-4 py-3.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand sm:text-lg font-medium transition-all"
                  />
                </div>
                <select
                  value={fromUnitId}
                  onChange={e => setFromUnitId(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm font-medium text-neutral-800 transition-all cursor-pointer"
                >
                  {activeCategory.units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex items-center justify-center pt-6 sm:pt-0 sm:mt-6 shrink-0 z-10">
                <button 
                  onClick={handleSwap}
                  className="p-3 bg-white border border-neutral-200 rounded-full text-brand hover:bg-brand/5 hover:border-brand/30 shadow-sm transition-all transform hover:scale-105 active:scale-95"
                  title="Intercambiar unidades"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Destino */}
              <div className="w-full flex-1 space-y-2">
                <label className="block text-sm font-medium text-neutral-700 ml-1">A</label>
                <div className="relative">
                  <div className="block w-full px-4 py-3.5 bg-brand/5 rounded-xl border border-brand/20 sm:text-lg font-bold text-brand-dark min-h-[54px] flex items-center overflow-x-auto no-scrollbar">
                    {numValue !== null ? formatOutput(conversionResult) : '-'}
                  </div>
                </div>
                <select
                  value={toUnitId}
                  onChange={e => setToUnitId(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm font-medium text-neutral-800 transition-all cursor-pointer"
                >
                  {activeCategory.units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Acciones & Notas */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100">
              <div className="text-sm text-neutral-500">
                {activeCategory.note ? (
                  <span className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                    {activeCategory.note}
                  </span>
                ) : (
                  numValue !== null && fromUnitId && toUnitId && (
                    <span className="font-medium">
                      1 {activeCategory.units.find(u => u.id === fromUnitId)?.symbol} = {
                        formatOutput(
                          activeCategory.units.find(u => u.id === toUnitId)?.fromBase 
                            ? activeCategory.units.find(u => u.id === toUnitId)!.fromBase!(
                                activeCategory.units.find(u => u.id === fromUnitId)?.toBase 
                                  ? activeCategory.units.find(u => u.id === fromUnitId)!.toBase!(1) 
                                  : 1 * (activeCategory.units.find(u => u.id === fromUnitId)?.factor || 1)
                              )
                            : (
                                (activeCategory.units.find(u => u.id === fromUnitId)?.toBase 
                                  ? activeCategory.units.find(u => u.id === fromUnitId)!.toBase!(1) 
                                  : 1 * (activeCategory.units.find(u => u.id === fromUnitId)?.factor || 1)) 
                                / (activeCategory.units.find(u => u.id === toUnitId)?.factor || 1)
                              )
                        )
                      } {activeCategory.units.find(u => u.id === toUnitId)?.symbol}
                    </span>
                  )
                )}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setInputValue('')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpiar
                </button>
                <button
                  onClick={handleCopy}
                  disabled={numValue === null}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand font-medium text-sm transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

          </div>
          
          <div className="lg:hidden">
            <h4 className="text-sm font-bold text-neutral-900 mb-3 px-1">Conversiones rápidas</h4>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_CONVERSIONS.map((qc, i) => (
                <button 
                  key={i}
                  onClick={() => applyQuickConversion(qc.from, qc.to, qc.cat)}
                  className="w-full text-center px-3 py-2.5 text-xs font-medium text-neutral-700 bg-white shadow-sm border border-neutral-200 hover:border-brand/30 hover:text-brand-dark rounded-xl transition-colors"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          </div>
          
        </div>

      </div>

    </div>
  );
}
