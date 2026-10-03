'use client'

import { useState, useTransition } from 'react'
import { Bookmark } from 'lucide-react'
import { toggleFavorite } from '@/app/actions/favorites'

export default function FavoriteButton({ 
  toolSlug, 
  initialIsFavorite 
}: { 
  toolSlug: string
  initialIsFavorite: boolean 
}) {
  const [isPending, startTransition] = useTransition()
  // Optimistic UI update
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)

  const handleToggle = () => {
    // Optimistic update
    setIsFavorite(!isFavorite)
    
    startTransition(async () => {
      const result = await toggleFavorite(toolSlug)
      if (result?.error) {
        // Revert on error
        setIsFavorite(initialIsFavorite)
      }
    })
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        handleToggle()
      }}
      disabled={isPending}
      className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
        isFavorite 
          ? 'bg-brand/10 text-brand' 
          : 'bg-white/50 text-slate-400 hover:text-brand hover:bg-brand/5 border border-slate-200'
      }`}
      title={isFavorite ? "Quitar de favoritas" : "Agregar a favoritas"}
    >
      <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-brand' : ''}`} />
    </button>
  )
}
