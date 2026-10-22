"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ArrowRight } from "lucide-react"
import { tools } from "@/data/tools"
import { HeroGeometricBackground } from "./HeroGeometricBackground"

const QUICK_CHIPS = [
  { label: "Calculadora de precios", slug: "calculadora-precios" },
  { label: "Calculadora IVA", slug: "calculadora-iva" },
  { label: "Aguinaldo (SAC)", slug: "calculadora-aguinaldo" },
  { label: "Presupuestos", slug: "generador-presupuestos" },
  { label: "Comprimir imágenes", slug: "compresor-imagenes" }
]

export default function Hero() {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (query.trim()) {
      router.push(`/herramientas?q=${encodeURIComponent(query.trim())}`)
    }
  }

  // Live matching tools from real catalog
  const matchingTools = query.trim().length >= 2 
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()) ||
          t.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  // Close suggestions on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-[#401289] text-white -mt-[72px] md:-mt-[80px] min-h-screen min-h-[100dvh] flex flex-col justify-center pt-28 pb-16 sm:pt-36 sm:pb-20 md:pt-40 md:pb-24 border-b border-violet-950/40">
      {/* Geometric background reproducing the Bauhaus reference design in brand colors */}
      <HeroGeometricBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          <div className="lg:col-span-6 xl:col-span-6 max-w-xl xl:max-w-2xl">
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5 drop-shadow-xs">
              Calculadoras y herramientas prácticas para tu{" "}
              <span className="text-violet-200">negocio</span>
            </h1>

            <p className="text-base sm:text-lg text-violet-100/90 mb-8 max-w-xl leading-relaxed">
              Calculá costos y márgenes de venta, convertí archivos y administrá tus gastos. Todo funciona directo en el navegador, sin necesidad de registros obligatorios.
            </p>

            {/* Search form with live suggestions container */}
            <div ref={searchContainerRef} className="relative max-w-lg">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                  <input
                    id="hero-search-query"
                    type="text"
                    placeholder="Buscar calculadora, PDF, precios..."
                    aria-label="Buscar calculadora, PDF o herramienta"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full rounded-xl border border-white/20 bg-white text-slate-900 py-3 pl-10 pr-4 text-sm shadow-lg outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-violet-400/40 min-h-[46px]"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Buscar en el catálogo"
                  title="Buscar en el catálogo"
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 px-5 py-3 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.97] cursor-pointer min-h-[46px] border border-violet-400/30"
                >
                  <Search className="h-4.5 w-4.5" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </form>

              {/* Suggestions popover */}
              {showSuggestions && matchingTools.length > 0 && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-200 bg-white shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150"
                  role="listbox"
                  aria-label="Herramientas sugeridas"
                >
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                    Herramientas encontradas ({matchingTools.length})
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto scrollbar-thin">
                    {matchingTools.slice(0, 5).map((tool) => (
                      <Link
                        key={tool.slug}
                        href={tool.customUrl || `/herramientas/${tool.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-violet-50 text-slate-800 hover:text-violet-700 transition-colors text-xs"
                      >
                        <div className="flex flex-col pr-2">
                          <span className="font-semibold text-slate-900">{tool.name}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{tool.description}</span>
                        </div>
                        <span className="text-[11px] font-medium text-brand shrink-0 inline-flex items-center gap-0.5">
                          Abrir <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                  {matchingTools.length > 5 && (
                    <div className="mt-1 pt-1.5 border-t border-slate-100 px-2 py-1">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="text-xs text-brand font-semibold hover:underline text-left cursor-pointer"
                      >
                        Ver los {matchingTools.length} resultados en el catálogo completo →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick search chips */}
            <div className="mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-semibold text-violet-200/90 mr-1">Frecuentes:</span>
              {QUICK_CHIPS.map((chip) => (
                <Link
                  key={chip.slug}
                  href={`/herramientas/${chip.slug}`}
                  className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/40 px-2.5 py-1 text-xs font-medium text-white transition-all shadow-xs backdrop-blur-xs active:scale-[0.97]"
                >
                  {chip.label}
                </Link>
              ))}
            </div>

          </div>

          {/* Right side is open and unobstructed to showcase the geometric architecture */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-6 pointer-events-none" aria-hidden="true" />

        </div>
      </div>
    </section>
  )
}
