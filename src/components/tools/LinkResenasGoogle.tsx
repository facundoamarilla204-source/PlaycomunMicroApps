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
    <div className="grid gap-8 items-start w-full lg:grid-cols-2 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 space-y-8">
        
        {/* Mode Selection */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => { setMethod('search'); reset(); }}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg transition-colors ${method === 'search' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Buscar negocio
          </button>
          <button
            onClick={() => { setMethod('maps'); reset(); }}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg transition-colors ${method === 'maps' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Desde Google Maps
          </button>
        </div>

        {method === 'search' ? (
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre del negocio *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-neutral-400 w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
                    placeholder="Ej. Pizzería Los Hermanos"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Ciudad / localidad (Opcional)
                </label>
                <p className="text-xs text-neutral-500 mb-2">Recomendado si hay negocios con nombres similares.</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-neutral-400 w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
                    placeholder="Ej. Córdoba"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-xl font-medium flex justify-center items-center gap-2 transition-colors"
            >
              {isLoading && method === 'search' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFromMaps} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  URL de Google Maps
                </label>
                <p className="text-xs text-neutral-500 mb-3">
                  Abrí el negocio en Google Maps, seleccioná Compartir → Copiar enlace y pegalo acá.
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Map className="text-neutral-400 w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm transition-colors"
                    placeholder="https://maps.app.goo.gl/..."
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !mapsUrl.trim()}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-xl font-medium flex justify-center items-center gap-2 transition-colors"
            >
              {isLoading && method === 'maps' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generar Link'}
            </button>
          </form>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {searchResults.length > 0 && !finalResult && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg text-neutral-900">Resultados</h3>
            <p className="text-sm text-neutral-500">Seleccioná el negocio correcto para generar el enlace.</p>
            <div className="space-y-3">
              {searchResults.map((result, idx) => (
                <div key={idx} className="border border-neutral-200 rounded-xl p-4 hover:border-neutral-900 transition-colors bg-neutral-50">
                  <h4 className="font-semibold text-neutral-900 mb-1">{result.name}</h4>
                  <p className="text-sm text-neutral-600 mb-4">{result.address}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectResult(result)}
                      className="flex-1 bg-white border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Seleccionar
                    </button>
                    {result.mapsUrl && (
                      <a
                        href={result.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                        title="Ver en Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Card */}
      <div className={`
        ${finalResult ? 'block' : 'hidden'} 
        lg:block lg:sticky lg:top-8
        mt-8 lg:mt-0 w-full
      `}>
        {finalResult && (
          <div aria-live="polite" className="bg-neutral-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl w-full">
            <h3 className="text-white text-sm font-semibold mb-4 opacity-90 uppercase tracking-wide">
              Link de Reseñas Generado
            </h3>
            
            {finalResult.name && (
              <div className="mb-6">
                <h4 className="text-2xl font-bold mb-1">{finalResult.name}</h4>
                <p className="text-sm opacity-80">{finalResult.address}</p>
              </div>
            )}

            <div className="bg-white/10 rounded-xl p-4 mb-6 break-all">
              <p className="font-mono text-sm leading-relaxed select-all">
                {finalResult.reviewUrl}
              </p>
            </div>

            {finalResult.source === 'productmate' && finalResult.verification === 'not_verified' && (
              <div className="mb-6 p-3 bg-white/10 border border-white/20 rounded-lg flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-300" />
                <p className="opacity-90">Verificá el negocio en Google Maps antes de utilizar este enlace en impresiones.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleCopy}
                className="w-full sm:flex-1 bg-white text-neutral-900 hover:bg-white/90 active:bg-white transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado' : 'Copiar link'}
              </button>
              <a
                href={finalResult.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 border border-white/30 hover:bg-white/10 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Abrir link
              </a>
            </div>
            
            <button
              onClick={reset}
              className="mt-6 w-full text-center text-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              Generar otro enlace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


