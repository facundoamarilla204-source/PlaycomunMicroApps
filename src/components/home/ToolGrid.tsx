"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ArrowRight, Calculator, FileText, Receipt, TrendingUp, QrCode, Wallet, Dumbbell, ArrowRightLeft, Banknote, CreditCard, Boxes, Flame, Sparkles, Wrench, LucideIcon, Search, Filter } from "lucide-react"
import { tools } from "@/data/tools"
import { getCategories } from "@/data/categories"
import ToolCard from "@/components/tools/ToolCard"

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
  Wrench
}

interface ToolGridProps {
  initialCategory?: string
  initialQuery?: string
  userFavorites?: string[]
  showSearch?: boolean
  showTypeFilter?: boolean
}

export default function ToolGrid({ 
  initialCategory = "todas", 
  initialQuery = "", 
  userFavorites = [],
  showSearch = false,
  showTypeFilter = false
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

  const favoriteTools = userFavorites.length > 0 
    ? tools.filter(t => userFavorites.includes(t.slug))
    : []

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || "Herramientas"

  return (
    <section className={`py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isPending ? 'opacity-80 transition-opacity' : 'opacity-100 transition-opacity'}`}>
      
      {/* Filters & Search section */}
      {(showSearch || showTypeFilter) && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="Buscar herramientas..."
                value={query}
                onChange={handleQueryChange}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          )}
          {showTypeFilter && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <select
                value={activeType}
                onChange={handleTypeChange}
                className="appearance-none rounded-xl border border-border bg-white py-2.5 pl-9 pr-10 text-sm font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="todos">Todos los tipos</option>
                <option value="calculadora">Calculadoras</option>
                <option value="generador">Generadores</option>
                <option value="utilidad">Utilidades</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-12 flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`whitespace-nowrap flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
              activeCategory === cat.id
                ? "bg-brand text-white shadow-md shadow-brand/20"
                : "border border-border/80 bg-white text-foreground hover:border-brand/40 hover:bg-brand-light/50 hover:text-brand hover:shadow-sm"
            }`}
          >
            {cat.name}
            <span
              className={`flex items-center justify-center rounded-full text-xs ${
                activeCategory === cat.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-foreground-subtle"
              } px-2 py-0.5`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Favorites Row */}
      {!query && activeCategory === "todas" && favoriteTools.length > 0 && !showSearch && (
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground">Tus atajos</h2>
          <div className="flex flex-wrap gap-3">
            {favoriteTools.map((tool) => {
              const Icon = iconMap[tool.icon] || Calculator;
              return (
                <Link 
                  key={tool.slug}
                  href={`${tool.customUrl || `/herramientas/${tool.slug}`}`}
                  className="group flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold transition-all hover:border-brand/40 hover:bg-[#F9F9FB] hover:shadow-sm"
                >
                  <Icon className="h-4 w-4 text-brand" />
                  <span className="text-foreground group-hover:text-brand transition-colors">{tool.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {query 
            ? `Resultados para "${query}"` 
            : activeCategory === "todas" && !showSearch 
              ? "Herramientas destacadas" 
              : activeCategoryName}
        </h2>
        
        {(!query && activeCategory === "todas" && !showSearch) && (
          <Link href="/herramientas" className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-auto">
          {filteredTools.map((tool) => {
            return <ToolCard key={tool.slug} tool={tool} isFavorite={userFavorites.includes(tool.slug)} />
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <img src="/otter-hero.png" alt="No encontrado" className="mb-6 h-40 w-auto object-contain opacity-90 drop-shadow-sm" />
          <h3 className="mb-2 text-xl font-bold text-foreground">No encontramos esa herramienta</h3>
          <p className="text-foreground-muted">Probá con otra palabra o navegá por las categorías.</p>
        </div>
      )}
    </section>
  )
}
