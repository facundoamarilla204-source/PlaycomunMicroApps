"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ArrowRight } from "lucide-react"
import Image from "next/image"
import { tools } from "@/data/tools"

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
    <section className="relative overflow-hidden bg-slate-50/50 pt-12 pb-10 sm:pt-16 sm:pb-14 md:pt-20 md:pb-16 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8 items-center">

          <div className="lg:col-span-7 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
              Calculadoras y herramientas prácticas para tu <span className="text-brand">negocio</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
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
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Buscar en el catálogo"
                  title="Buscar en el catálogo"
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-5 py-3 text-white font-semibold text-sm shadow-xs transition-colors hover:bg-brand-hover active:bg-brand-active cursor-pointer min-h-[44px]"
                >
                  <Search className="h-4.5 w-4.5" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </form>

              {/* Suggestions popover */}
              {showSuggestions && matchingTools.length > 0 && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-200 bg-white shadow-lg p-2 z-30 animate-in fade-in zoom-in-95 duration-150"
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
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-800 hover:text-brand transition-colors text-xs"
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
            <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Frecuentes:</span>
              {QUICK_CHIPS.map((chip) => (
                <Link
                  key={chip.slug}
                  href={`/herramientas/${chip.slug}`}
                  className="rounded-lg border border-slate-200 bg-white/90 hover:bg-white hover:border-brand/40 hover:text-brand px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
                >
                  {chip.label}
                </Link>
              ))}
            </div>

          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
              {/* Soft ambient aura matching the brand violet tone */}
              <div className="absolute w-3/4 h-3/4 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
              <Image
                src="/otter-hero.png"
                alt="Mascota de PlayComun"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain object-center select-none relative z-10"
                priority
                unoptimized
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
