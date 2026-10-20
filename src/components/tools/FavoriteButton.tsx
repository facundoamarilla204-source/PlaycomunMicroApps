"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import Link from "next/link"
import { Heart, LogIn, X, AlertCircle } from "lucide-react"
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
  const [authRequired, setAuthRequired] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sync state if initialIsFavorite changes externally
  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  // Close popover on click outside or Escape
  useEffect(() => {
    if (!authRequired && !errorMessage) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAuthRequired(false)
        setErrorMessage(null)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAuthRequired(false)
        setErrorMessage(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [authRequired, errorMessage])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear previous notices
    setAuthRequired(false)
    setErrorMessage(null)

    const nextState = !isFavorite
    // Optimistic update
    setIsFavorite(nextState)
    
    startTransition(async () => {
      try {
        const result = await toggleFavoriteAction(toolSlug)
        if (result?.error) {
          // Revert optimistic state
          setIsFavorite(!nextState)

          if (result.error === "No autorizado") {
            setAuthRequired(true)
          } else {
            setErrorMessage(result.error || "No se pudo actualizar favorita.")
          }
        }
      } catch (err: any) {
        setIsFavorite(!nextState)
        setErrorMessage("Error de conexión. Por favor reintentá.")
      }
    })
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={isPending}
        aria-label={isFavorite ? "Quitar de favoritas" : "Agregar a favoritas"}
        aria-pressed={isFavorite}
        title={isFavorite ? "Quitar de favoritas" : "Guardar en favoritas"}
        className={`relative z-10 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all hover:bg-slate-100 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          isFavorite ? "text-rose-500 hover:text-rose-600" : "text-slate-400 hover:text-slate-600"
        } disabled:opacity-50 ${className}`}
      >
        <Heart 
          className={`h-4.5 w-4.5 transition-transform ${isFavorite ? "fill-current scale-110" : ""}`} 
        />
      </button>

      {/* Popover: Requiere iniciar sesión */}
      {authRequired && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Iniciar sesión requerido"
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg z-30 text-left animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <LogIn className="h-3.5 w-3.5 text-brand" />
              <span>Iniciá sesión para guardar</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setAuthRequired(false)
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
              aria-label="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
            Guardá tus calculadoras preferidas para acceder a ellas rápidamente desde cualquier dispositivo.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/ingresar?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover transition-colors shadow-2xs"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      )}

      {/* Popover: Error de red o permisos */}
      {errorMessage && (
        <div
          ref={popoverRef}
          role="alert"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-red-200 bg-red-50 p-2.5 shadow-md z-30 text-left text-xs text-red-700 flex items-start justify-between gap-2 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setErrorMessage(null)
            }}
            className="text-red-400 hover:text-red-700"
            aria-label="Cerrar error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
