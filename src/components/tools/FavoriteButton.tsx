"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { toggleFavorite as toggleFavoriteAction } from "@/app/actions/favorites"

interface FavoriteButtonProps {
  toolSlug: string
  initialIsFavorite?: boolean
  className?: string
}

export default function FavoriteButton({ 
  toolSlug, 
  initialIsFavorite = false,
  className = "" 
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent triggering parent Link click
    
    const nextState = !isFavorite
    // Optimistic update
    setIsFavorite(nextState)
    
    startTransition(async () => {
      const result = await toggleFavoriteAction(toolSlug)
      if (result?.error) {
        // Revert on error or not authenticated
        setIsFavorite(!nextState)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={isPending}
      className={`inline-flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-lg transition-colors hover:bg-slate-100 cursor-pointer ${
        isFavorite ? "text-rose-500 hover:text-rose-600" : "text-slate-400 hover:text-slate-600"
      } disabled:opacity-50 ${className}`}
      aria-label={isFavorite ? "Quitar de favoritas" : "Agregar a favoritas"}
      title={isFavorite ? "Quitar de favoritas" : "Guardar en favoritas"}
    >
      <Heart className={`h-4 w-4 transition-transform active:scale-90 ${isFavorite ? "fill-current" : ""}`} />
    </button>
  )
}


