"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { toggleFavorite as toggleFavoriteAction } from "@/app/actions/favorites"

interface FavoriteButtonProps {
  toolSlug: string
  initialIsFavorite?: boolean
}

export default function FavoriteButton({ toolSlug, initialIsFavorite = false }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if button is inside a Link
    
    // Optimistic update
    setIsFavorite(!isFavorite)
    
    startTransition(async () => {
      const result = await toggleFavoriteAction(toolSlug)
      if (result?.error) {
        // Revert on error or not authenticated
        setIsFavorite(isFavorite)
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isPending}
      className={`absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm transition-colors hover:bg-white ${
        isFavorite ? "text-brand" : "text-foreground-subtle hover:text-brand"
      } disabled:opacity-50`}
      aria-label={isFavorite ? "Quitar de favoritas" : "Agregar a favoritas"}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
    </button>
  )
}


