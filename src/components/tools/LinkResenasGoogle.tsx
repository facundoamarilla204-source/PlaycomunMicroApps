'use client';

import { useState } from 'react';
import { Search, MapPin, Map, Copy, CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface ReviewResult {
  placeId?: string;
  name?: string;
  address?: string;
  reviewUrl: string;
  mapsUrl?: string;
  source: 'google' | 'productmate';
  verification?: 'verified_by_google_response' | 'not_verified';
}

export function LinkResenasGoogle() {
  const [method, setMethod] = useState<'search' | 'maps'>('search');
  
  // Search state
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  
  // Maps state
  const [mapsUrl, setMapsUrl] = useState('');
  
  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results state
  const [searchResults, setSearchResults] = useState<ReviewResult[]>([]);
  const [finalResult, setFinalResult] = useState<ReviewResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    setFinalResult(null);

    try {
      const res = await fetch('/api/google-reviews/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), location: location.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al buscar.');
      }

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setError('No se encontraron resultados. Intentá agregar la ciudad o una referencia.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error de conexión. Intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFromMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsUrl.trim()) {
      setError('Pegá el enlace de Google Maps primero.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFinalResult(null);

    try {
      const res = await fetch('/api/google-reviews/from-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapsUrl: mapsUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar el enlace.');
      }

      setFinalResult(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error de conexión. Intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResult = (result: ReviewResult) => {
    setFinalResult(result);
    setSearchResults([]);
  };

  const handleCopy = () => {
    if (!finalResult?.reviewUrl) return;
    navigator.clipboard.writeText(finalResult.reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setQuery('');
    setLocation('');
    setMapsUrl('');
    setSearchResults([]);
    setFinalResult(null);
    setError(null);
  };

  return (
    <div className="grid gap-8 items-start w-full lg:grid-cols-2 max-w-5xl mx-auto">
      {/* Input / Search Form Column */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
        {/* Method Segmented Switcher */}
        <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1 border border-slate-200/50">
          <button
            type="button"
            onClick={() => { setMethod('search'); reset(); }}
            className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              method === 'search' 
                ? 'bg-white shadow-sm text-slate-900 border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buscar negocio en Google
          </button>
          <button
            type="button"
            onClick={() => { setMethod('maps'); reset(); }}
            className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              method === 'maps' 
                ? 'bg-white shadow-sm text-slate-900 border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pegar enlace de Maps
          </button>
        </div>

        {method === 'search' ? (
          <form onSubmit={handleSearch} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nombre del comercio o empresa *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    placeholder="Ej. Café Martínez, Gimnasio Atenas..."
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ciudad o provincia <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Ayuda a filtrar resultados homónimos</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    placeholder="Ej. Córdoba, Rosario, Palermo..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex justify-center items-center gap-2 transition-all min-h-[46px]"
            >
              {isLoading && method === 'search' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando en Google Places...
                </>
              ) : (
                'Buscar establecimiento'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFromMaps} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Enlace compartido de Google Maps
              </label>
              <p className="text-xs text-slate-500">
                En la app o web de Maps: tocá <strong>Compartir → Copiar enlace</strong> y pegalo acá.
              </p>
              <div className="relative pt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 pt-1 flex items-center pointer-events-none text-slate-400">
                  <Map className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  placeholder="https://maps.app.goo.gl/..."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !mapsUrl.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-xl text-sm font-bold shadow-sm flex justify-center items-center gap-2 transition-all min-h-[46px]"
            >
              {isLoading && method === 'maps' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extrayendo Place ID...
                </>
              ) : (
                'Generar Enlace Directo'
              )}
            </button>
          </form>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-xl flex items-start gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Search Results List */}
        {searchResults.length > 0 && !finalResult && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Establecimientos encontrados</h3>
              <span className="text-xs text-slate-500">{searchResults.length} resultados</span>
            </div>
            <p className="text-xs text-slate-500">Seleccioná tu local exacto para obtener el link oficial:</p>
            
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {searchResults.map((result, idx) => (
                <div 
                  key={idx} 
                  className="border border-slate-200/80 rounded-xl p-3.5 hover:border-purple-300 hover:bg-purple-50/20 transition-all bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{result.name}</h4>
                    <p className="text-xs text-slate-600 truncate mt-0.5">{result.address}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Elegir este
                    </button>
                    {result.mapsUrl && (
                      <a
                        href={result.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                        title="Ver ficha en Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Card Column */}
      <div className="w-full lg:sticky lg:top-8">
        {finalResult ? (
          <div aria-live="polite" className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Link Oficial Listo
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-200 border border-purple-700/50">
                writeAReviewUri
              </span>
            </div>
            
            {finalResult.name && (
              <div>
                <h4 className="text-xl font-extrabold text-white leading-tight">{finalResult.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{finalResult.address}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                URL directa de calificación
              </label>
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 break-all select-all">
                <p className="font-mono text-xs text-purple-200 leading-relaxed">
                  {finalResult.reviewUrl}
                </p>
              </div>
            </div>

            {finalResult.source === 'productmate' && finalResult.verification === 'not_verified' && (
              <div className="p-3 bg-amber-950/50 border border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                <p>Verificá abriendo el link antes de imprimirlo en materiales gráficos o tarjetas NFC.</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar enlace directo'}
              </button>
              
              <a
                href={finalResult.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4" />
                Probar en Google
              </a>
            </div>
            
            <button
              type="button"
              onClick={reset}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors pt-2"
            >
              ← Generar para otro negocio
            </button>
          </div>
        ) : (
          /* Empty / Informative Placeholder state for Desktop */
          <div className="p-6 sm:p-7 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                ⭐
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">¿Por qué usar este enlace?</h4>
                <p className="text-xs text-slate-500">Máxima conversión de clientes a reseñas</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900 block">Abre directo la ventana de 5 estrellas</span>
                <p className="text-slate-500">
                  El cliente no tiene que buscar tu negocio, navegar por fotos o adivinar dónde está el botón de opinar.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900 block">Ideal para códigos QR y tarjetas NFC</span>
                <p className="text-slate-500">
                  Pegalo en tus mesas, mostrador de cobro o packaging para pedir la opinión en el momento exacto de la compra.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


