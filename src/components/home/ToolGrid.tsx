"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Calculator, FileText, Receipt, TrendingUp, QrCode, Wallet, Dumbbell, ArrowRightLeft, Banknote, CreditCard, Boxes, Flame, Sparkles, Wrench, LucideIcon } from "lucide-react"
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
}

export default function ToolGrid({ initialCategory = "todas", initialQuery = "", userFavorites = [] }: ToolGridProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [query, setQuery] = useState(initialQuery)
  const categories = getCategories()

  // Sync props if they change (e.g. from URL in /herramientas)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCategory(initialCategory)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(initialQuery)
  }, [initialCategory, initialQuery])

  let filteredTools = tools

  // Si hay query, priorizamos la busqueda sobre todo
  if (query) {
    filteredTools = tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
    )
  } else {
    // Si no hay busqueda, filtramos por categoria
    if (activeCategory === "todas") {
      filteredTools = tools.filter((tool) => tool.featured)
    } else {
      filteredTools = tools.filter((tool) => tool.category === activeCategory)
    }
  }

  const favoriteTools = userFavorites.length > 0 
    ? tools.filter(t => userFavorites.includes(t.slug))
    : []

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || "Herramientas"

  return (
    <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      
      {/* Category Tabs */}
      {!query && (
        <div className="mb-12 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
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
      )}

      {/* Favorites Row (only if no query) */}
      {!query && favoriteTools.length > 0 && (
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

      {/* Main Grid */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {query ? `Resultados para "${query}"` : activeCategory === "todas" ? "Herramientas destacadas" : activeCategoryName}
        </h2>
        
        {(!query && activeCategory === "todas") && (
          <Link href="/herramientas" className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} isFavorite={userFavorites.includes(tool.slug)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-foreground">No encontramos esa herramienta</h3>
          <p className="text-foreground-muted">Probá con otra palabra o navegá por las categorías.</p>
        </div>
      )}
    </section>
  )
}
