"use client"

import React from "react"
import { ConversionCategory } from "@/lib/converter/types"
import { CONVERSION_CATEGORIES } from "@/lib/converter/operations"
import { FileUp, FileDown, Image as ImageIcon } from "lucide-react"

interface CategoryTabsProps {
  activeCategory: ConversionCategory
  onSelectCategory: (cat: ConversionCategory) => void
}

export function CategoryTabs({
  activeCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const getIcon = (cat: ConversionCategory) => {
    switch (cat) {
      case "to-pdf":
        return <FileUp className="h-4 w-4 shrink-0" />
      case "from-pdf":
        return <FileDown className="h-4 w-4 shrink-0" />
      case "to-images":
        return <ImageIcon className="h-4 w-4 shrink-0" />
    }
  }

  return (
    <div className="w-full">
      {/* Scrollable horizontal container on mobile (320px+) and flex-wrap on desktop */}
      <div
        role="tablist"
        aria-label="Categorías de conversión"
        className="flex items-center overflow-x-auto no-scrollbar py-1 px-1 -mx-1 sm:mx-0 sm:px-1.5 sm:py-1.5 gap-2 bg-gray-100/90 rounded-xl border border-gray-200/80 snap-x scroll-smooth"
      >
        {CONVERSION_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              role="tab"
              type="button"
              id={`tab-${cat.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 sm:flex-1 snap-start flex items-center justify-center gap-2 py-2.5 px-3.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap min-h-[42px] touch-manipulation ${
                isActive
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200/80 font-bold ring-1 ring-black/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
              }`}
            >
              <span className={isActive ? "text-violet-600" : "text-gray-500"}>
                {getIcon(cat.id)}
              </span>
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
