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
    <section className="bg-brand-light py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand tracking-widest uppercase mb-6 shadow-sm border border-brand/10">
              Herramientas Online
            </span>
            <h1 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl lg:text-6xl mb-6 text-balance leading-[1.1]">
              Herramientas online para tu <span className="text-brand">negocio</span>
            </h1>
            <p className="text-lg text-foreground-muted mb-8 max-w-xl text-balance leading-relaxed">
              Calculá, generá y resolvé en segundos. Las básicas son gratis y sin registro.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle transition-colors peer-focus:text-brand" />
                <input
                  type="text"
                  placeholder="Buscar una herramienta..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="peer w-full rounded-xl border border-border/60 bg-white py-3.5 pl-12 pr-4 shadow-sm outline-none transition-all placeholder:text-foreground-subtle/50 hover:border-brand/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <button 
                type="submit"
                className="rounded-xl bg-brand px-8 py-3.5 font-medium text-white shadow-sm shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                Buscar
              </button>
            </form>
          </div>
          
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] aspect-square">
              <Image
                src="/otter-hero.png"
                alt="Nutria de PlayComun Herramientas"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-contain object-center"
                priority
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
