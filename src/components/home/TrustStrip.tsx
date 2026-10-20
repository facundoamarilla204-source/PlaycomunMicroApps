"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Check, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type ToolCandidate = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  votos: number;
};

export default function TrustStrip() {
  const [candidates, setCandidates] = useState<ToolCandidate[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const supabase = createClient();

  const [suggestion, setSuggestion] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [suggestionError, setSuggestionError] = useState("");

  const fetchCandidates = async () => {
    try {
      if (!navigator.onLine) {
        setOffline(true);
        setLoading(false);
        return;
      }
      setOffline(false);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("tool_candidates")
        .select("*")
        .eq("activa", true)
        .order("votos", { ascending: false });

      if (fetchError) throw fetchError;

      const localVoted = JSON.parse(localStorage.getItem("voted_candidates") || "[]");
      setVotedIds(new Set(localVoted));

      setCandidates(data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar las herramientas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    
    const handleOnline = () => fetchCandidates();
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVote = async (id: string) => {
    if (!navigator.onLine) {
      setError("No hay conexión a internet para registrar tu voto.")
      return
    }
    
    const isVoted = votedIds.has(id)
    
    // Optimistic update
    setVotedIds((prev) => {
      const next = new Set(prev)
      if (isVoted) next.delete(id)
      else next.add(id)
      localStorage.setItem("voted_candidates", JSON.stringify(Array.from(next)))
      return next
    })

    setCandidates((prev) => 
      prev.map(c => c.id === id ? { ...c, votos: c.votos + (isVoted ? -1 : 1) } : c)
          .sort((a, b) => b.votos - a.votos)
    )

    try {
      const res = await fetch("/api/participation/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: id })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el voto")
      }
    } catch (err: any) {
      // Revert optimistic
      setVotedIds((prev) => {
        const next = new Set(prev)
        if (isVoted) next.add(id)
        else next.delete(id)
        localStorage.setItem("voted_candidates", JSON.stringify(Array.from(next)))
        return next
      })
      setCandidates((prev) => 
        prev.map(c => c.id === id ? { ...c, votos: c.votos + (isVoted ? 1 : -1) } : c)
            .sort((a, b) => b.votos - a.votos)
      )
      setError(err.message || "No se pudo registrar tu voto. Por favor reintentá.")
    }
  }

  const submitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestion.length < 5 || suggestion.length > 140) {
      setSuggestionError("La sugerencia debe tener entre 5 y 140 caracteres.");
      return;
    }
    
    setSuggestionStatus("submitting");
    setSuggestionError("");

    try {
      const res = await fetch("/api/participation/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: suggestion, website: honeypot })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      
      setSuggestionStatus("success");
      setSuggestion("");
      setTimeout(() => setSuggestionStatus("idle"), 3000);
    } catch (err: any) {
      setSuggestionStatus("error");
      setSuggestionError(err.message);
    }
  };

  const maxVotes = candidates.length > 0 ? candidates[0].votos : 1;

  const guides = [
    { title: "Cómo calcular el aguinaldo", time: "5 min de lectura", slug: "como-calcular-aguinaldo" },
    { title: "Cuánto cobra Mercado Pago de verdad", time: "4 min de lectura", slug: "cuanto-cobra-mercado-pago" },
    { title: "Cómo calcular el precio de venta de un producto", time: "6 min de lectura", slug: "calcular-precio-venta" },
  ];

  return (
    <section className="bg-slate-50/70 border-y border-slate-200/80 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl font-bold text-foreground">
            Lo que viene y lo que podés aprender
          </h2>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row mb-12">
          
          {/* Bloque A: Pedí una herramienta (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Pedí una herramienta</h3>
              
              {offline ? (
                <div className="py-8 text-center text-foreground-muted">
                  <p>Estás sin conexión. Conectate a internet para ver las herramientas y votar.</p>
                </div>
              ) : error ? (
                <div className="py-8 text-center text-foreground-muted">
                  <p>{error}</p>
                  <button onClick={fetchCandidates} className="mt-4 text-brand font-medium hover:underline">Reintentar</button>
                </div>
              ) : loading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-100 rounded-xl w-full"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((c) => {
                    const progress = Math.max((c.votos / maxVotes) * 100, 2);
                    const isVoted = votedIds.has(c.id);

                    return (
                      <div key={c.id} className="relative overflow-hidden rounded-xl bg-neutral-50 border border-neutral-100 p-4 transition-all">
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-brand/10 transition-all duration-500 ease-out" 
                          style={{ width: `${progress}%` }}
                        />
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground text-sm sm:text-base">{c.nombre}</h4>
                            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">{c.descripcion}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-sm font-bold text-brand">{c.votos} votos</span>
                            <button
                              onClick={() => handleVote(c.id)}
                              aria-label={isVoted ? `Retirar voto por ${c.nombre}` : `Votar por ${c.nombre}`}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5
                                ${isVoted 
                                  ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 active:scale-95' 
                                  : 'bg-brand text-white hover:bg-brand-hover active:scale-95'}`}
                            >
                              {isVoted && <Check className="w-4 h-4" />}
                              {isVoted ? 'Votado' : 'Votar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border">
                <form onSubmit={submitSuggestion} className="flex flex-col sm:flex-row gap-3">
                  {/* Honeypot */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                  
                  <input 
                    type="text" 
                    placeholder="¿Qué herramienta te falta?" 
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    maxLength={140}
                    disabled={suggestionStatus === "submitting" || suggestionStatus === "success"}
                    className="flex-1 rounded-xl border border-border/60 bg-neutral-50 py-3 pl-4 pr-4 text-sm shadow-sm outline-none transition-all placeholder:text-foreground-subtle/70 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={suggestionStatus === "submitting" || suggestionStatus === "success" || suggestion.length < 5}
                    className="rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {suggestionStatus === "submitting" ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : suggestionStatus === "success" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Enviado
                      </>
                    ) : (
                      <>
                        Enviar <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
                {suggestionError && (
                  <p className="text-red-500 text-xs mt-2">{suggestionError}</p>
                )}
              </div>

            </div>
          </div>

          {/* Bloque B: Guías para tu negocio (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-foreground mb-2">Guías para tu negocio</h3>
              <p className="text-sm text-foreground-muted mb-6">
                Artículos prácticos para entender mejor tus números.
              </p>
              
              <div className="flex flex-col mt-auto">
                {guides.map((guide, idx) => (
                  <Link 
                    key={guide.slug} 
                    href={`/guias/${guide.slug}`}
                    className={`group flex items-center justify-between py-4 ${idx !== guides.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <div className="pr-4">
                      <h4 className="font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-2">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-foreground-muted mt-1">{guide.time}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center shrink-0 group-hover:bg-brand/10 group-focus:bg-brand/10 group-focus:ring-2 group-focus:ring-brand transition-all">
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Bloque C: Gratis vs Pro */}
        <div className="w-full">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center md:text-left">Gratis vs Pro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Pro Column (Aparece primero en mobile) */}
            <div className="order-1 md:order-2 bg-purple-50/50 border-2 border-brand rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 bg-brand text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMENDADO
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">PlayComun Pro</h4>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">Códigos QR dinámicos, documentos y listas de precios</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <span className="text-slate-700">Logo e identidad propia en comprobantes</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <span className="text-slate-700">Guardado y sincronización de datos en la nube</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <span className="text-slate-700">Exportación de comprobantes y planillas sin marcas de agua</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <span className="text-slate-700">100 conversiones diarias en servidor (archivos 50 MB)</span>
                </li>
              </ul>
              <Link href="/planes" className="block text-center w-full min-h-[44px] rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-all hover:bg-brand-hover active:bg-brand-active shadow-xs">
                Ver planes Pro
              </Link>
            </div>

            {/* Gratis Column */}
            <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col shadow-xs">
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Básico</h4>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Calculadoras y utilidades libres sin registro</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Iniciá sesión gratis para guardar favoritos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">5 conversiones diarias en servidor (archivos 10 MB)</span>
                </li>
              </ul>
              <Link href="/herramientas" className="block text-center w-full min-h-[44px] rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-800 transition-all hover:bg-slate-200">
                Usar herramientas
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
