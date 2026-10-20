"use client"

import { useState } from "react"
import { ListFilter, ChevronDown } from "lucide-react"

export interface TocItem {
  id: string
  title: string
  number: number
}

interface LegalTableOfContentsProps {
  items: TocItem[]
}

export function LegalTableOfContents({ items }: LegalTableOfContentsProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  const handleScroll = (id: string) => {
    setIsOpenMobile(false)
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -90 // header height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
      element.focus({ preventScroll: true })
    }
  }

  return (
    <nav
      aria-label="Índice de secciones"
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-purple-700" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-900">
            Índice rápido ({items.length} apartados)
          </span>
        </div>
        
        {/* Botón para expandir/colapsar en pantallas pequeñas */}
        <button
          type="button"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          aria-expanded={isOpenMobile}
          className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
        >
          <span>{isOpenMobile ? "Ocultar" : "Ver lista"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpenMobile ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className={`mt-4 pt-3 border-t border-slate-200 sm:block ${
          isOpenMobile ? "block" : "hidden sm:block"
        }`}
      >
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleScroll(item.id)
                }}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-slate-700 hover:text-purple-900 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 font-medium"
              >
                <span className="w-5 h-5 rounded bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {item.number}
                </span>
                <span className="truncate">{item.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
