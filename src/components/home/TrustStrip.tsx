"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Check, Send, CheckCircle2, AlertCircle, X, BookOpen } from "lucide-react";
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
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
      setFetchError(null);

      const { data, error: err } = await supabase
        .from("tool_candidates")
        .select("*")
        .eq("activa", true)
        .order("votos", { ascending: false });

      if (err) throw err;

      const localVoted = JSON.parse(localStorage.getItem("voted_candidates") || "[]");
      setVotedIds(new Set(localVoted));

      setCandidates(data || []);
    } catch (err: any) {
      setFetchError(err.message || "Error al cargar las herramientas");
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
      setVoteError("No hay conexión a internet para registrar tu voto.");
      return;
    }
    
    setVoteError(null);
    const isVoted = votedIds.has(id);
    
    // Optimistic update
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (isVoted) next.delete(id);
      else next.add(id);
      localStorage.setItem("voted_candidates", JSON.stringify(Array.from(next)));
      return next;
    });

    setCandidates((prev) => 
      prev.map(c => c.id === id ? { ...c, votos: c.votos + (isVoted ? -1 : 1) } : c)
          .sort((a, b) => b.votos - a.votos)
    );

    try {
      const res = await fetch("/api/participation/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el voto");
      }
    } catch (err: any) {
      // Revert optimistic update cleanly without destroying the list
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (isVoted) next.add(id);
        else next.delete(id);
        localStorage.setItem("voted_candidates", JSON.stringify(Array.from(next)));
        return next;
      });
      setCandidates((prev) => 
        prev.map(c => c.id === id ? { ...c, votos: c.votos + (isVoted ? 1 : -1) } : c)
            .sort((a, b) => b.votos - a.votos)
      );
      setVoteError(err.message || "No se pudo registrar tu voto. Por favor reintentá.");
    }
  };

  const submitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestion.trim().length < 5 || suggestion.length > 140) {
      setSuggestionError("La sugerencia debe tener entre 5 y 140 caracteres.");
      return;
    }
    
    setSuggestionStatus("submitting");
    setSuggestionError("");

    try {
      const res = await fetch("/api/participation/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: suggestion.trim(), website: honeypot })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      
      setSuggestionStatus("success");
      setSuggestion("");
      setTimeout(() => setSuggestionStatus("idle"), 3500);
    } catch (err: any) {
      setSuggestionStatus("error");
      setSuggestionError(err.message || "No se pudo enviar la sugerencia.");
    }
  };

  const maxVotes = candidates.length > 0 ? candidates[0].votos : 1;

  // Real guides from content/guias/*.mdx with concise descriptions
  const guides = [
    { 
      title: "Cómo calcular el aguinaldo (SAC)", 
      desc: "Fórmula oficial, cálculo proporcional y fechas límite de cobro.",
      time: "5 min de lectura", 
      slug: "como-calcular-aguinaldo" 
    },
    { 
      title: "Cuánto cobra Mercado Pago de verdad", 
      desc: "Comisiones y retenciones reales por cobros con QR, Link y Point.",
      time: "4 min de lectura", 
      slug: "cuanto-cobra-mercado-pago" 
    },
    { 
      title: "Cómo calcular el precio de venta de un producto", 
      desc: "Costos fijos, márgenes de ganancia e impuestos paso a paso.",
      time: "6 min de lectura", 
      slug: "calcular-precio-venta" 
    },
    { 
      title: "Cómo hacer un presupuesto profesional", 
      desc: "Estructura, validez comercial y consejos para cotizar sin pérdidas.",
      time: "7 min de lectura", 
      slug: "como-hacer-un-presupuesto-profesional" 
    },
  ];

  return (
    <section className="bg-slate-50/70 border-y border-slate-200/80 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Lo que viene y lo que podés aprender
          </h2>
          <p className="text-sm text-foreground-muted mt-1.5">
            Herramientas en desarrollo votadas por la comunidad y artículos prácticos de gestión.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row mb-16 items-stretch">
          
          {/* Bloque A: Pedí una herramienta (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-foreground">Pedí una herramienta</h3>
                  <span className="text-xs text-foreground-subtle font-medium">Votación abierta</span>
                </div>
                
                {/* Error de voto contextual (no rompe la lista) */}
                {voteError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{voteError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoteError(null)}
                      className="text-red-400 hover:text-red-700 p-0.5"
                      aria-label="Cerrar aviso"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {offline ? (
                  <div className="py-8 text-center text-foreground-muted">
                    <p>Estás sin conexión. Conectate a internet para ver las herramientas y votar.</p>
                  </div>
                ) : fetchError ? (
                  <div className="py-8 text-center text-foreground-muted">
                    <p>{fetchError}</p>
                    <button onClick={fetchCandidates} className="mt-4 text-brand font-medium hover:underline">Reintentar</button>
                  </div>
                ) : loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-100 rounded-xl w-full"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((c) => {
                      const progress = Math.max((c.votos / maxVotes) * 100, 2);
                      const isVoted = votedIds.has(c.id);

                      return (
                        <div key={c.id} className="relative overflow-hidden rounded-xl bg-neutral-50/80 border border-neutral-200/80 p-4 transition-all hover:border-slate-300">
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-brand/10 transition-all duration-500 ease-out" 
                            style={{ width: `${progress}%` }}
                          />
                          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{c.nombre}</h4>
                              <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">{c.descripcion}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0">
                              <span className="text-xs sm:text-sm font-bold text-brand">{c.votos} {c.votos === 1 ? "voto" : "votos"}</span>
                              <button
                                type="button"
                                onClick={() => handleVote(c.id)}
                                aria-label={isVoted ? `Retirar voto por ${c.nombre}` : `Votar por ${c.nombre}`}
                                className={`min-h-[40px] px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer
                                  ${isVoted 
                                    ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 active:scale-95' 
                                    : 'bg-brand text-white hover:bg-brand-hover active:scale-95 shadow-2xs'}`}
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
              </div>

              {/* Formulario de sugerencia */}
              <div className="mt-8 pt-6 border-t border-border">
                <form onSubmit={submitSuggestion} className="flex flex-col gap-2">
                  {/* Honeypot */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                  
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input 
                      type="text" 
                      placeholder="¿Qué herramienta te falta para tu negocio?" 
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      maxLength={140}
                      disabled={suggestionStatus === "submitting" || suggestionStatus === "success"}
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-4 text-xs sm:text-sm shadow-2xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={suggestionStatus === "submitting" || suggestionStatus === "success" || suggestion.trim().length < 5}
                      className="min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white shadow-2xs transition-colors hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shrink-0"
                    >
                      {suggestionStatus === "submitting" ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : suggestionStatus === "success" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Enviado
                        </>
                      ) : (
                        <>
                          Enviar propuesta <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Helper informativo previo al envío */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                    <span>
                      {suggestion.length > 0 && suggestion.trim().length < 5 
                        ? "Mínimo 5 caracteres para enviar tu idea."
                        : "Ingresá entre 5 y 140 caracteres con tu idea."}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {suggestion.length}/140
                    </span>
                  </div>
                </form>

                {suggestionError && (
                  <p className="text-red-600 text-xs mt-2">{suggestionError}</p>
                )}
              </div>

            </div>
          </div>

          {/* Bloque B: Guías para tu negocio (40%) - Distribución vertical corregida sin mt-auto */}
          <div className="w-full lg:w-[40%] flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen className="h-4.5 w-4.5 text-brand" />
                  <h3 className="text-xl font-bold text-foreground">Guías para tu negocio</h3>
                </div>
                <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Artículos prácticos redactados para entender mejor tus números, cobros y presupuestos.
                </p>
              </div>
              
              {/* Lista que fluye naturalmente bajo el título sin hueco vertical */}
              <div className="flex flex-col divide-y divide-border/60 mt-2">
                {guides.map((guide) => (
                  <Link 
                    key={guide.slug} 
                    href={`/guias/${guide.slug}`}
                    className="group flex items-start justify-between py-3.5 sm:py-4 transition-colors hover:bg-slate-50/60 rounded-xl px-2 -mx-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <div className="pr-3 flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">
                        {guide.desc}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                        {guide.time}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-all mt-1">
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Bloque C: Gratis vs Pro */}
        <div className="w-full">
          <div className="mb-6 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Gratis vs Pro</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Todas las calculadoras son libres. Pasate a Pro solo si necesitás funciones avanzadas de gestión y marca propia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Pro Column (Aparece primero en mobile) */}
            <div className="order-1 md:order-2 bg-purple-50/40 border-2 border-brand rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 bg-brand text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-2xs">
                RECOMENDADO
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">PlayComun Pro</h4>
              
              {/* Indicador de precio real verificado */}
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-2.5 py-1.5 border border-brand-border/60 self-start">
                <span className="text-xs font-bold text-brand">Desde $5.900/mes</span>
                <span className="text-[11px] text-slate-600 font-medium">· Facturación en pesos argentinos</span>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1 text-sm">
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
              <Link 
                href="/planes" 
                className="block text-center w-full min-h-[44px] rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-active shadow-xs cursor-pointer text-sm"
              >
                Ver planes Pro
              </Link>
            </div>

            {/* Gratis Column - Unificado a "Plan Gratuito" */}
            <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col shadow-xs">
              <h4 className="text-2xl font-bold text-slate-900 mb-2">Plan Gratuito</h4>
              <p className="text-xs text-slate-500 mb-5">
                Ideal para uso cotidiano sin registro obligatorio.
              </p>

              <ul className="space-y-3.5 mb-8 flex-1 text-sm">
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
              <Link 
                href="/herramientas" 
                className="block text-center w-full min-h-[44px] rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-200 cursor-pointer text-sm"
              >
                Usar herramientas gratis
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
