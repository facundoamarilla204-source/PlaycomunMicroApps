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
        return <FileUp className="h-4 w-4" />
      case "from-pdf":
        return <FileDown className="h-4 w-4" />
      case "to-images":
        return <ImageIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/80 rounded-xl border border-gray-200">
        {CONVERSION_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200/80 font-bold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
              aria-pressed={isActive}
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
