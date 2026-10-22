"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Heart,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  Cloud,
  Laptop,
  Edit2,
  RotateCw,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { FavoritePalette } from "@/lib/color-palette/types"
import { copyToClipboard } from "@/lib/color-palette/palette-exporter"

interface FavoritesDrawerProps {
  isOpen: boolean
  onClose: () => void
  favorites: FavoritePalette[]
  onLoadPalette: (colors: string[]) => void
  onRemoveFavorite: (id: string) => Promise<void> | void
  onRenameFavorite?: (id: string, newName: string) => Promise<void> | void
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function FavoritesDrawer({
  isOpen,
  onClose,
  favorites,
  onLoadPalette,
  onRemoveFavorite,
  onRenameFavorite,
  isAuthenticated,
  isLoading,
  error,
  onRetry,
}: FavoritesDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopyCodes = async (palette: FavoritePalette) => {
    const text = palette.colors.join(", ")
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedId(palette.id)
      setTimeout(() => setCopiedId(null), 1800)
    }
  }

  const handleStartRename = (palette: FavoritePalette) => {
    setEditingId(palette.id)
    setEditName(palette.name)
  }

  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) return
    if (onRenameFavorite) {
      await onRenameFavorite(id, editName.trim())
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onRemoveFavorite(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-drawer-title"
      >
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.25 }}
          className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-md h-full flex flex-col"
        >
          {/* Encabezado del cajón */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Heart className="w-5 h-5 fill-current" aria-hidden="true" />
              </div>
              <div>
                <h2 id="favorites-drawer-title" className="text-base font-bold text-slate-900">
                  Paletas guardadas ({favorites.length})
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isAuthenticated ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      <Cloud className="w-3 h-3" aria-hidden="true" />
                      <span>Sincronizadas con tu cuenta</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      <Laptop className="w-3 h-3" aria-hidden="true" />
                      <span>Almacenamiento local (este equipo)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Cerrar favoritos"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Aviso contextual para visitantes */}
          {!isAuthenticated && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold text-purple-950">Favoritos locales</p>
                <p className="text-purple-800 text-[11px] leading-relaxed">
                  Tus paletas se guardan de forma privada en este navegador. Para acceder a ellas desde cualquier dispositivo, podés{" "}
                  <Link
                    href={`/ingresar?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/herramientas/generador-paletas")}`}
                    className="font-bold underline hover:text-purple-950 text-purple-900"
                  >
                    iniciar sesión gratis
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Banner de error si falla la sincronización */}
          {error && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              )}
            </div>
          )}

          {/* Contenido principal: listado o estado vacío */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="text-center py-16 space-y-3">
                <RotateCw className="w-7 h-7 text-purple-600 animate-spin mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-700">Cargando tus paletas...</p>
                <p className="text-xs text-slate-500">Consultando datos seguros</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {isAuthenticated
                    ? "No tenés paletas guardadas en tu cuenta todavía"
                    : "No tenés paletas guardadas todavía"}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Podés guardar cualquier combinación haciendo clic en el icono del corazón en la barra principal del editor.
                </p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    {editingId === fav.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(fav.id)
                            if (e.key === "Escape") setEditingId(null)
                          }}
                          className="px-2 py-1 text-xs border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 bg-white font-semibold"
                          autoFocus
                          maxLength={40}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(fav.id)}
                          className="px-2 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-md cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 rounded-md cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {fav.name}
                          </span>
                          {onRenameFavorite && (
                            <button
                              type="button"
                              onClick={() => handleStartRename(fav)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                              title="Renombrar paleta"
                              aria-label="Renombrar paleta"
                            >
                              <Edit2 className="w-3 h-3" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {new Date(fav.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Previsualización de colores */}
                  <div className="flex h-12 w-full rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    {fav.colors.map((c, i) => (
                      <div
                        key={`${fav.id}-${c}-${i}`}
                        style={{ backgroundColor: c }}
                        className="flex-1 h-full"
                        title={c}
                      />
                    ))}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadPalette(fav.colors)
                          onClose()
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors flex items-center gap-1 min-h-[34px] cursor-pointer shadow-xs"
                      >
                        <span>Cargar</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCodes(fav)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 min-h-[34px] cursor-pointer"
                        title="Copiar códigos HEX separados por comas"
                      >
                        {copiedId === fav.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{copiedId === fav.id ? "Copiados" : "Copiar"}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={deletingId === fav.id}
                      onClick={() => handleDelete(fav.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center disabled:opacity-50"
                      title="Eliminar de favoritos"
                      aria-label="Eliminar paleta de favoritos"
                    >
                      {deletingId === fav.id ? (
                        <RotateCw className="w-4 h-4 animate-spin text-rose-600" aria-hidden="true" />
                      ) : (
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
