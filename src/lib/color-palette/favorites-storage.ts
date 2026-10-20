import { FavoritePalette } from "./types"
import { normalizeHex } from "./color-converter"

const STORAGE_KEY = "playcomun_color_palettes_v1"
const MAX_FAVORITES = 40

/**
 * Obtiene las paletas favoritas guardadas en localStorage.
 * Maneja excepciones de almacenamiento o JSON corrupto con recuperación transparente.
 */
export function getFavoritePalettes(): FavoritePalette[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    // Filtrar y validar esquema
    return parsed
      .filter((item): item is FavoritePalette => {
        return (
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          Array.isArray(item.colors) &&
          item.colors.length >= 2
        )
      })
      .map((item) => ({
        ...item,
        colors: item.colors.map((c) => normalizeHex(c) || c),
      }))
  } catch {
    return []
  }
}

/**
 * Guarda una nueva paleta en favoritos.
 * Devuelve el objeto guardado o null si ocurrió un error.
 */
export function saveFavoritePalette(palette: {
  name?: string
  colors: string[]
}): FavoritePalette | null {
  if (typeof window === "undefined") return null

  try {
    const current = getFavoritePalettes()
    const cleanColors = palette.colors
      .map((c) => normalizeHex(c))
      .filter((c): c is string => c !== null)

    if (cleanColors.length < 2) return null

    // Comprobar si ya existe una paleta idéntica para no duplicar
    const colorsKey = cleanColors.join(",")
    const existingIndex = current.findIndex((p) => p.colors.join(",") === colorsKey)

    if (existingIndex !== -1) {
      // Ya existe en favoritos
      return current[existingIndex]
    }

    const newFav: FavoritePalette = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: palette.name?.trim() || `Paleta ${current.length + 1}`,
      colors: cleanColors,
      createdAt: new Date().toISOString(),
      version: 1,
    }

    const updated = [newFav, ...current].slice(0, MAX_FAVORITES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newFav
  } catch {
    return null
  }
}

/**
 * Elimina una paleta de favoritos por su ID.
 */
export function removeFavoritePalette(id: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const current = getFavoritePalettes()
    const filtered = current.filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch {
    return false
  }
}

/**
 * Actualiza el nombre de una paleta favorita en localStorage.
 */
export function updateFavoritePalette(id: string, updates: { name: string }): boolean {
  if (typeof window === "undefined") return false

  try {
    const current = getFavoritePalettes()
    const index = current.findIndex((p) => p.id === id)
    if (index === -1) return false

    const cleanName = updates.name.trim()
    if (!cleanName) return false

    current[index] = {
      ...current[index],
      name: cleanName,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    return true
  } catch {
    return false
  }
}

/**
 * Comprueba si la secuencia de colores actual coincide exactamente con algún favorito.
 */
export function isPaletteInFavorites(colors: string[], favorites: FavoritePalette[]): boolean {
  const cleanColors = colors.map((c) => normalizeHex(c)).filter(Boolean).join(",")
  return favorites.some((f) => f.colors.join(",") === cleanColors)
}

