"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ArrowRight, Calculator, FileText, Receipt, TrendingUp, QrCode, Wallet, Dumbbell, ArrowRightLeft, Banknote, CreditCard, Boxes, Flame, Sparkles, Wrench, Palette, LucideIcon, Search, Filter } from "lucide-react"
import { tools } from "@/data/tools"
import { getCategories } from "@/data/categories"
import ToolCard from "@/components/tools/ToolCard"
import ViewAllToolsBanner from "@/components/home/ViewAllToolsBanner"

const iconMap: Record<string, LucideIcon> = {
  Calculator,
  FileText,
  Receipt,
  TrendingUp,
  QrCode,
  Wallet,
  Dumbbell,
  ArrowRightLeft,
  Banknote,
  CreditCard,
  Boxes,
  Flame,
  Sparkles,
  Wrench,
  Palette
}

interface ToolGridProps {
  initialCategory?: string
  initialQuery?: string
  userFavorites?: string[]
  showSearch?: boolean
  showTypeFilter?: boolean
  isHome?: boolean
  limit?: number
}

export default function ToolGrid({ 
  initialCategory = "todas", 
  initialQuery = "", 
  userFavorites = [],
  showSearch = false,
  showTypeFilter = false,
  isHome = false,
  limit = 20
}: ToolGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Use state but initialize from URL if available
  const catParam = searchParams.get("categoria") || initialCategory
  const typeParam = searchParams.get("tipo") || "todos"
  const qParam = searchParams.get("q") || initialQuery

  const [activeCategory, setActiveCategory] = useState(catParam)
  const [activeType, setActiveType] = useState(typeParam)
  const [query, setQuery] = useState(qParam)

  const categories = getCategories()

  // Sync state when URL changes externally (back button, etc)
  useEffect(() => {
    setActiveCategory(searchParams.get("categoria") || "todas")
    setActiveType(searchParams.get("tipo") || "todos")
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  const updateUrl = (newCat: string, newType: string, newQ: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newCat && newCat !== "todas") params.set("categoria", newCat)
    else params.delete("categoria")

    if (newType && newType !== "todos") params.set("tipo", newType)
    else params.delete("tipo")

    if (newQ) params.set("q", newQ)
    else params.delete("q")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    updateUrl(cat, activeType, query)
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value
    setActiveType(type)
    updateUrl(activeCategory, type, query)
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    updateUrl(activeCategory, activeType, q)
  }

  let filteredTools = tools

  if (query) {
    filteredTools = filteredTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
    )
  }

  if (activeCategory !== "todas") {
    filteredTools = filteredTools.filter((tool) => tool.category === activeCategory)
  } else if (!query && !showSearch) {
    // Solo destacadas en la home si no hay categoria ni busqueda
    filteredTools = filteredTools.filter((tool) => tool.featured)
  }

  if (activeType !== "todos") {
    filteredTools = filteredTools.filter((tool) => tool.type === activeType)
  }

  const shouldLimit = isHome && typeof limit === "number" && limit > 0
  const displayedTools = shouldLimit ? filteredTools.slice(0, limit) : filteredTools

  const favoriteTools = userFavorites.length > 0 
    ? tools.filter(t => userFavorites.includes(t.slug))
    : []

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || "Herramientas"

  return (
    <section className={`py-10 sm:py-14 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isPending ? 'opacity-80 transition-opacity' : 'opacity-100 transition-opacity'}`}>
      
      {/* Filters & Search section */}
      {(showSearch || showTypeFilter) && (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre o palabra clave..."
                value={query}
                onChange={handleQueryChange}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
              />
            </div>
          )}
          {showTypeFilter && (
            <div className="relative shrink-0">
              <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={activeType}
                onChange={handleTypeChange}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-8 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
              >
                <option value="todos">Todos los formatos</option>
                <option value="calculadora">Calculadoras</option>
                <option value="generador">Generadores</option>
                <option value="utilidad">Utilidades</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`whitespace-nowrap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              activeCategory === cat.id
                ? "bg-slate-900 text-white shadow-2xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {cat.name}
            <span
              className={`inline-flex items-center justify-center rounded-md text-[10px] px-1.5 py-0.2 font-mono ${
                activeCategory === cat.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Favorites Row */}
      {!query && activeCategory === "todas" && favoriteTools.length > 0 && !showSearch && (
        <div className="mb-10 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            Tus herramientas favoritas
          </h2>
          <div className="flex flex-wrap gap-2">
            {favoriteTools.map((tool) => {
              const Icon = iconMap[tool.icon] || Calculator;
              return (
                <Link 
                  key={tool.slug}
                  href={`${tool.customUrl || `/herramientas/${tool.slug}`}`}
                  className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:text-brand shadow-2xs"
                >
                  <Icon className="h-3.5 w-3.5 text-brand" />
                  <span>{tool.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {query 
                ? `Resultados para "${query}"` 
                : activeCategory === "todas" && !showSearch 
                  ? "Herramientas destacadas" 
                  : activeCategoryName}
            </h2>
            {isHome && !query && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                Destacadas ({displayedTools.length})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isHome && filteredTools.length > displayedTools.length ? (
              <span>Mostrando las {displayedTools.length} principales de {filteredTools.length} disponibles</span>
            ) : (
              <span>{displayedTools.length} {displayedTools.length === 1 ? "herramienta disponible" : "herramientas disponibles"}</span>
            )}
          </p>
        </div>
        
        {(isHome || (!query && activeCategory === "todas" && !showSearch)) && (
          <Link 
            href="/herramientas" 
            className="group self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-4 py-2 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-colors"
          >
            <span>Ver todas las herramientas</span>
            <span className="inline-flex items-center justify-center rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-mono font-medium">
              {tools.length}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700" />
          </Link>
        )}
      </div>

      {displayedTools.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedTools.map((tool) => {
              return <ToolCard key={tool.slug} tool={tool} isFavorite={userFavorites.includes(tool.slug)} />
            })}
          </div>

          {/* Bottom Callout Banner on Home */}
          {isHome && (
            <ViewAllToolsBanner totalTools={tools.length} displayedCount={displayedTools.length} />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 px-4 text-center">
          <img src="/otter-hero.png" alt="No encontrado" className="mb-4 h-28 w-auto object-contain opacity-80" />
          <h3 className="mb-1 text-base font-bold text-slate-900">No encontramos herramientas para esta búsqueda</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">Revisá la ortografía o elegí otra categoría del catálogo.</p>
          <button
            onClick={() => {
              setActiveCategory("todas")
              setActiveType("todos")
              setQuery("")
              updateUrl("todas", "todos", "")
            }}
            className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover transition-colors"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </section>
  )
}
