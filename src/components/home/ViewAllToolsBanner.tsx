"use client"

import Link from "next/link"
import { ArrowRight, LayoutGrid, Tag } from "lucide-react"
import { motion } from "motion/react"
import { getCategories } from "@/data/categories"

interface ViewAllToolsBannerProps {
  totalTools: number
  displayedCount?: number
}

export default function ViewAllToolsBanner({ totalTools, displayedCount = 20 }: ViewAllToolsBannerProps) {
  const categories = getCategories().filter((c) => c.id !== "todas")

  return (
    <div className="mt-12 sm:mt-16 mx-auto max-w-4xl">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-6 sm:p-10 shadow-xs text-center">
        {/* Simple clean badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 mb-4 shadow-2xs">
          <LayoutGrid className="h-3.5 w-3.5 text-brand" />
          <span>Catálogo completo de PlayComun</span>
        </div>

        {/* Heading & description */}
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
          ¿Buscás más herramientas o utilidades?
        </h3>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-7 leading-relaxed">
          En portada mostramos hasta {displayedCount} herramientas destacadas. En el catálogo completo tenés acceso libre a todas las calculadoras comerciales, utilidades financieras y generadores.
        </p>

        {/* High-priority CTA Button */}
        <div className="flex justify-center mb-7">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/herramientas"
              className="group flex sm:inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-xs hover:bg-brand-hover transition-colors w-full cursor-pointer"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
              <span>Ver todas las herramientas ({totalTools})</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Category shortcuts */}
        <div className="pt-6 border-t border-slate-200/90">
          <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center justify-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <span>Explorá por categoría:</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/herramientas?categoria=${cat.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand/40 hover:text-brand transition-colors shadow-2xs"
              >
                <span>{cat.name}</span>
                <span className="font-mono text-[10px] text-slate-400">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
