"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Palette,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Heart,
  Share2,
  Check,
  Info,
  RotateCw,
  Cloud,
  Laptop,
} from "lucide-react"
import { ColorHarmony, ColorSample, FavoritePalette } from "@/lib/color-palette/types"
import {
  generateHarmony,
  getRandomHexColor,
} from "@/lib/color-palette/harmony-algorithms"
import {
  normalizeHex,
  hexToRgb,
  hexToHsl,
} from "@/lib/color-palette/color-converter"
import { copyToClipboard } from "@/lib/color-palette/palette-exporter"
import {
  getFavoritePalettes,
  saveFavoritePalette,
  removeFavoritePalette,
  updateFavoritePalette,
  isPaletteInFavorites,
} from "@/lib/color-palette/favorites-storage"
import { createClient } from "@/utils/supabase/client"
import {
  getUserPalettesServer,
  saveUserPaletteServer,
  deleteUserPaletteServer,
  updateUserPaletteServer,
} from "@/app/actions/color-palettes"
import { PaletteEditor } from "./PaletteEditor"
import { ImageExtractor } from "./ImageExtractor"
import { ContrastCheckerSection } from "./ContrastCheckerSection"
import { PaletteExportModal } from "./PaletteExportModal"
import { FavoritesDrawer } from "./FavoritesDrawer"

type ActiveMode = "creator" | "image"
type AuthStatus = "loading" | "authenticated" | "visitor"

const HARMONY_LABELS: { value: ColorHarmony; label: string; desc: string }[] = [
  { value: "complementario", label: "Complementarios", desc: "Contraste vibrante con colores opuestos a 180°" },
  { value: "analogo", label: "Análogos", desc: "Matices vecinos serenos y armónicos" },
  { value: "triadico", label: "Triádicos", desc: "Equilibrio vivo entre 3 puntos a 120°" },
  { value: "monocromatico", label: "Monocromáticos", desc: "Variaciones de luminosidad de un mismo tono" },
  { value: "complementario-dividido", label: "Comp. dividido", desc: "Contraste suave con dos tonos adyacentes al opuesto" },
  { value: "tetradico", label: "Tetrádicos", desc: "Riqueza cromática en 4 cuadrantes" },
  { value: "aleatorio", label: "Modo aleatorio", desc: "Combinación generada por dispersión armónica áurea" },
]

export function GeneradorPaletasTool() {
  const [mode, setMode] = useState<ActiveMode>("creator")
  const [baseColor, setBaseColor] = useState<string>("#7C3AED") // Violeta PlayComun de referencia
  const [harmony, setHarmony] = useState<ColorHarmony>("complementario")
  const [colorCount, setColorCount] = useState<number>(5)
  const [colors, setColors] = useState<ColorSample[]>([])
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false)

  // Estados de favoritos y autenticación
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [favorites, setFavorites] = useState<FavoritePalette[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(true)
  const [isSavingFavorite, setIsSavingFavorite] = useState<boolean>(false)
  const [favoritesError, setFavoritesError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [copiedAll, setCopiedAll] = useState<boolean>(false)

  const currentUserIdRef = useRef<string | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToastMessage({ text, type })
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null)
    }, 3200)
  }, [])

  // Carga y sincronización de sesión y favoritos (Supabase vs LocalStorage)
  const syncUserFavorites = useCallback(async (_userId: string) => {
    setIsLoadingFavorites(true)
    setFavoritesError(null)
    try {
      const res = await getUserPalettesServer()
      if (res.data) {
        setFavorites(res.data)
      } else {
        setFavorites([])
        setFavoritesError(res.error || "No se pudieron cargar tus paletas de la cuenta.")
      }
    } catch {
      setFavorites([])
      setFavoritesError("Error de conexión al cargar tus paletas.")
    } finally {
      setIsLoadingFavorites(false)
    }
  }, [])

  const syncVisitorFavorites = useCallback(() => {
    currentUserIdRef.current = null
    setAuthStatus("visitor")
    setFavoritesError(null)
    setIsLoadingFavorites(false)
    // Carga exclusiva desde localStorage para visitantes
    setFavorites(getFavoritePalettes())
  }, [])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    // 1. Detección inicial de sesión
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!isMounted) return
        if (user) {
          currentUserIdRef.current = user.id
          setAuthStatus("authenticated")
          syncUserFavorites(user.id)
        } else {
          syncVisitorFavorites()
        }
      })
      .catch(() => {
        if (!isMounted) return
        syncVisitorFavorites()
      })

    // 2. Suscripción a cambios de sesión (login, logout, cambio de cuenta, refresh de token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      const user = session?.user || null

      if (user) {
        // Si cambió el usuario (ej. User A -> User B o Visitor -> User)
        if (currentUserIdRef.current !== user.id) {
          currentUserIdRef.current = user.id
          setAuthStatus("authenticated")
          syncUserFavorites(user.id)
        }
      } else {
        // Cierre de sesión: limpiar memoria de cuenta y volver a modo visitante
        if (currentUserIdRef.current !== null) {
          syncVisitorFavorites()
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [syncUserFavorites, syncVisitorFavorites])

  // Inicializar paleta armónica por defecto
  const initPalette = useCallback(
    (base: string, harm: ColorHarmony, count: number, currentSamples?: ColorSample[]) => {
      const lockedMask = currentSamples ? currentSamples.map((s) => (s.locked ? s.hex : null)) : undefined
      const hexList = generateHarmony(base, harm, count, lockedMask)

      const samples: ColorSample[] = hexList.map((hex, i) => {
        const isLocked = currentSamples && currentSamples[i] ? currentSamples[i].locked : false
        const rgb = hexToRgb(hex) || { r: 124, g: 58, b: 237 }
        const hsl = hexToHsl(hex) || { h: 262, s: 83, l: 58 }
        return {
          id: `sample_${i}_${hex}_${Date.now()}`,
          hex,
          rgb,
          hsl,
          locked: isLocked,
        }
      })

      setColors(samples)
    },
    []
  )

  useEffect(() => {
    initPalette(baseColor, harmony, colorCount)
  }, [baseColor, harmony, colorCount, initPalette])

  // Generar nueva combinación (respeta los colores bloqueados)
  const handleGenerate = () => {
    if (harmony === "aleatorio") {
      const newRandomBase = getRandomHexColor()
      setBaseColor(newRandomBase)
    } else {
      initPalette(baseColor, harmony, colorCount, colors)
    }
  }

  // Atajo de teclado: Barra espaciadora para regenerar paleta
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return
      }

      if (e.code === "Space" && mode === "creator") {
        e.preventDefault()
        handleGenerate()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  // Modificar color individual
  const handleUpdateColor = (index: number, newHex: string) => {
    const norm = normalizeHex(newHex)
    if (!norm) return

    setColors((prev) => {
      const next = [...prev]
      if (next[index]) {
        const rgb = hexToRgb(norm) || next[index].rgb
        const hsl = hexToHsl(norm) || next[index].hsl
        next[index] = {
          ...next[index],
          hex: norm,
          rgb,
          hsl,
        }
      }
      return next
    })

    if (index === 0) {
      setBaseColor(norm)
    }
  }

  // Alternar bloqueo de muestra
  const handleToggleLock = (index: number) => {
    setColors((prev) => {
      const next = [...prev]
      if (next[index]) {
        next[index] = {
          ...next[index],
          locked: !next[index].locked,
        }
      }
      return next
    })
  }

  // Copiar todos los colores de la paleta
  const handleCopyAll = async () => {
    const text = colors.map((c) => c.hex).join(", ")
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }

  // Guardar o quitar de favoritos
  const currentHexArray = useMemo(() => colors.map((c) => c.hex), [colors])
  const isFavorite = useMemo(
    () => isPaletteInFavorites(currentHexArray, favorites),
    [currentHexArray, favorites]
  )

  const handleToggleFavorite = async () => {
    if (isSavingFavorite || authStatus === "loading") return

    if (isFavorite) {
      const found = favorites.find((f) => f.colors.join(",") === currentHexArray.join(","))
      if (found) {
        if (authStatus === "authenticated") {
          setIsSavingFavorite(true)
          try {
            const res = await deleteUserPaletteServer(found.id)
            if (res.success) {
              setFavorites((prev) => prev.filter((p) => p.id !== found.id))
              showToast("Paleta eliminada de tu cuenta", "success")
            } else {
              showToast(res.error || "No se pudo eliminar de la cuenta", "error")
            }
          } finally {
            setIsSavingFavorite(false)
          }
        } else {
          removeFavoritePalette(found.id)
          setFavorites(getFavoritePalettes())
          showToast("Paleta eliminada de favoritos locales", "success")
        }
      }
    } else {
      const paletteName = `Paleta ${HARMONY_LABELS.find((h) => h.value === harmony)?.label || "Personalizada"}`

      if (authStatus === "authenticated") {
        setIsSavingFavorite(true)
        try {
          const res = await saveUserPaletteServer({
            name: paletteName,
            colors: currentHexArray,
          })

          if (res.data) {
            if (!res.alreadyExisted) {
              setFavorites((prev) => [res.data!, ...prev])
            }
            showToast("Paleta guardada en tu cuenta de PlayComun", "success")
          } else {
            showToast(res.error || "No se pudo guardar la paleta en tu cuenta", "error")
          }
        } finally {
          setIsSavingFavorite(false)
        }
      } else {
        const saved = saveFavoritePalette({
          name: paletteName,
          colors: currentHexArray,
        })
        if (saved) {
          setFavorites(getFavoritePalettes())
          showToast("Paleta guardada en este navegador", "success")
        } else {
          showToast("No se pudo guardar la paleta en el almacenamiento local", "error")
        }
      }
    }
  }

  // Eliminar favorito desde el cajón lateral
  const handleRemoveFavorite = async (id: string) => {
    if (authStatus === "authenticated") {
      const res = await deleteUserPaletteServer(id)
      if (res.success) {
        setFavorites((prev) => prev.filter((p) => p.id !== id))
        showToast("Paleta eliminada", "success")
      } else {
        setFavoritesError(res.error || "Error al eliminar paleta")
        showToast(res.error || "Error al eliminar paleta", "error")
      }
    } else {
      removeFavoritePalette(id)
      setFavorites(getFavoritePalettes())
      showToast("Paleta eliminada", "success")
    }
  }

  // Renombrar favorito
  const handleRenameFavorite = async (id: string, newName: string) => {
    if (authStatus === "authenticated") {
      const res = await updateUserPaletteServer(id, { name: newName })
      if (res.data) {
        setFavorites((prev) => prev.map((p) => (p.id === id ? res.data! : p)))
        showToast("Nombre actualizado", "success")
      } else {
        setFavoritesError(res.error || "Error al renombrar paleta")
        showToast(res.error || "Error al renombrar paleta", "error")
      }
    } else {
      updateFavoritePalette(id, { name: newName })
      setFavorites(getFavoritePalettes())
      showToast("Nombre actualizado", "success")
    }
  }

  // Transferir paleta extraída de imagen al editor
  const handleTransferFromImage = (hexList: string[]) => {
    const sliceCount = Math.min(6, Math.max(3, hexList.length))
    setColorCount(sliceCount)
    setBaseColor(hexList[0] || "#7C3AED")

    const samples: ColorSample[] = hexList.slice(0, sliceCount).map((hex, i) => {
      const norm = normalizeHex(hex) || "#7C3AED"
      return {
        id: `img_${i}_${norm}_${Date.now()}`,
        hex: norm,
        rgb: hexToRgb(norm) || { r: 124, g: 58, b: 237 },
        hsl: hexToHsl(norm) || { h: 262, s: 83, l: 58 },
        locked: false,
      }
    })

    setColors(samples)
    setMode("creator")
  }

  // Cargar paleta desde favoritos
  const handleLoadFavorite = (hexList: string[]) => {
    const count = Math.min(6, Math.max(3, hexList.length))
    setColorCount(count)
    setBaseColor(hexList[0] || "#7C3AED")

    const samples: ColorSample[] = hexList.slice(0, count).map((hex, i) => {
      const norm = normalizeHex(hex) || "#7C3AED"
      return {
        id: `fav_load_${i}_${norm}_${Date.now()}`,
        hex: norm,
        rgb: hexToRgb(norm) || { r: 124, g: 58, b: 237 },
        hsl: hexToHsl(norm) || { h: 262, s: 83, l: 58 },
        locked: false,
      }
    })

    setColors(samples)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Toast flotante de confirmación / error */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <Info className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Selector de modo principal */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/80 shadow-xs">
          <button
            type="button"
            onClick={() => setMode("creator")}
            className={`px-5 sm:px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              mode === "creator"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette className="w-4 h-4 text-purple-700" aria-hidden="true" />
            <span>Crear una paleta</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("image")}
            className={`px-5 sm:px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              mode === "image"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-700" aria-hidden="true" />
            <span>Extraer de una imagen</span>
          </button>
        </div>
      </div>

      {/* MODO 1: EDITOR / CREADOR DE PALETAS */}
      {mode === "creator" && (
        <div className="space-y-8">
          {/* Barra de herramientas superior */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            {/* Lado izquierdo: Regla de armonía y cantidad */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Selector de armonía cromática */}
              <div className="flex items-center gap-2">
                <label htmlFor="harmony-select" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Armonía:
                </label>
                <select
                  id="harmony-select"
                  value={harmony}
                  onChange={(e) => setHarmony(e.target.value as ColorHarmony)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer min-h-[42px]"
                >
                  {HARMONY_LABELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de cantidad de colores (3 a 6) */}
              <div className="flex items-center gap-1.5 pl-0 sm:pl-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">
                  Muestras:
                </span>
                {[3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setColorCount(num)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                      colorCount === num
                        ? "bg-purple-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    title={`Generar paleta de ${num} colores`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Lado derecho: Acciones de generación, favoritos y exportación */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              {/* Botón generar nueva combinación */}
              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer min-h-[42px]"
                title="Generar nueva combinación (o presioná la barra espaciadora)"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Generar</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-900/40 text-purple-200 font-mono">
                  Espacio
                </span>
              </button>

              {/* Botón copiar paleta completa */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 min-h-[42px] cursor-pointer"
                title="Copiar todos los códigos HEX al portapapeles"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    <span>Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" aria-hidden="true" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>

              {/* Botón guardar en favoritos con indicador de carga y estado */}
              <button
                type="button"
                disabled={isSavingFavorite || authStatus === "loading"}
                onClick={handleToggleFavorite}
                className={`p-2.5 rounded-xl transition-colors min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer disabled:opacity-60 ${
                  isFavorite
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
                title={
                  authStatus === "authenticated"
                    ? isFavorite
                      ? "Quitar de tus paletas de cuenta"
                      : "Guardar en tu cuenta de PlayComun"
                    : isFavorite
                    ? "Quitar de favoritos locales"
                    : "Guardar en este navegador"
                }
                aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
              >
                {isSavingFavorite ? (
                  <RotateCw className="w-4 h-4 animate-spin text-rose-600" aria-hidden="true" />
                ) : (
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
                )}
              </button>

              {/* Botón ver cajón de favoritos con badge de sincronización */}
              <button
                type="button"
                onClick={() => setIsFavoritesOpen(true)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 min-h-[42px] cursor-pointer"
                title="Ver paletas guardadas"
              >
                {authStatus === "authenticated" ? (
                  <Cloud className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                ) : (
                  <Laptop className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                )}
                <span>Favoritos</span>
                {favorites.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* Botón Exportar */}
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 min-h-[42px] cursor-pointer shadow-xs"
                title="Exportar a CSS, JSON, Tailwind o PNG"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Muestras cromáticas interactivas */}
          <PaletteEditor
            colors={colors}
            onUpdateColor={handleUpdateColor}
            onToggleLock={handleToggleLock}
          />

          {/* Breve descripción de la regla activa */}
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950">
            <Info className="w-4 h-4 text-purple-700 shrink-0" aria-hidden="true" />
            <p>
              <strong>{HARMONY_LABELS.find((h) => h.value === harmony)?.label}:</strong>{" "}
              {HARMONY_LABELS.find((h) => h.value === harmony)?.desc}. Podés fijar colores con el candado para mantenerlos mientras generás variantes.
            </p>
          </div>

          {/* Evaluador de Contraste WCAG 2.2 integrado con los colores de la paleta */}
          <ContrastCheckerSection paletteColors={currentHexArray} />
        </div>
      )}

      {/* MODO 2: EXTRACTOR DE COLORES DESDE IMAGEN */}
      {mode === "image" && (
        <div className="space-y-8">
          <ImageExtractor onTransferToEditor={handleTransferFromImage} />
        </div>
      )}

      {/* Modal de exportación de paleta */}
      <PaletteExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        colors={currentHexArray}
        paletteName={`Paleta PlayComun ${HARMONY_LABELS.find((h) => h.value === harmony)?.label || ""}`}
      />

      {/* Cajón lateral de favoritos */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onLoadPalette={handleLoadFavorite}
        onRemoveFavorite={handleRemoveFavorite}
        onRenameFavorite={handleRenameFavorite}
        isAuthenticated={authStatus === "authenticated"}
        isLoading={isLoadingFavorites}
        error={favoritesError}
        onRetry={() => {
          if (currentUserIdRef.current) {
            syncUserFavorites(currentUserIdRef.current)
          }
        }}
      />
    </div>
  )
}
