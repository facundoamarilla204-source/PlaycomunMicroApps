"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import { getCategories } from "@/data/categories"

interface ViewAllToolsBannerProps {
  totalTools: number
  displayedCount?: number
}

export default function ViewAllToolsBanner({ totalTools }: ViewAllToolsBannerProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const categories = getCategories().filter((c) => c.id !== "todas")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchTerm.trim()
    if (query) {
      router.push(`/herramientas?q=${encodeURIComponent(query)}`)
    } else {
      router.push("/herramientas")
    }
  }

  return (
    <div className="mt-12 sm:mt-16 mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-8 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Columna izquierda: Información clara y filtros por especialidad */}
          <div className="lg:col-span-7">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              ¿Buscás una calculadora o utilidad en particular?
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Explorá las {totalTools} herramientas gratuitas disponibles con búsqueda rápida por palabra clave o navegando por área de negocio.
            </p>

            {/* Categorías directas */}
            <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2 items-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Especialidad:
              </span>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/herramientas?categoria=${cat.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:text-brand transition-colors shadow-2xs"
                >
                  <span>{cat.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">({cat.count})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Columna derecha: Buscador directo y acceso al catálogo */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej: aguinaldo, iva, cuotas, pdf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-colors shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 min-h-[44px] transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                <span>Buscar</span>
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                href="/herramientas"
                className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Abrir catálogo completo ({totalTools})</span>
              </Link>
              <span className="text-slate-400 text-[11px]">Acceso libre sin registro</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
