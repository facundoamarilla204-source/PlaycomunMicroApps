"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import Image from "next/image"

export default function Hero() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/herramientas?q=${encodeURIComponent(query)}`)
    }
  }

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

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="hero-search-query"
                  type="text"
                  placeholder="Buscar calculadora, PDF, precios..."
                  aria-label="Buscar calculadora, PDF o herramienta"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover active:bg-brand-active cursor-pointer min-h-[44px]"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
              {/* Soft ambient aura matching the hero's purple tone */}
              <div className="absolute w-3/4 h-3/4 rounded-full bg-[#8e60fb]/10 blur-3xl pointer-events-none" />
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
