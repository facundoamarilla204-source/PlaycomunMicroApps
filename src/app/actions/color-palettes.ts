"use server"

import { createClient } from "@/utils/supabase/server"
import { FavoritePalette } from "@/lib/color-palette/types"
import { normalizeHex } from "@/lib/color-palette/color-converter"

interface PaletteRow {
  id: string
  user_id: string
  name: string
  colors: string[]
  created_at: string
  updated_at: string
}

function mapRowToPalette(row: PaletteRow): FavoritePalette {
  return {
    id: row.id,
    name: row.name,
    colors: row.colors.map((c) => normalizeHex(c) || c),
    createdAt: row.created_at,
    version: 1,
  }
}

/**
 * Obtiene las paletas favoritas del usuario autenticado desde Supabase.
 * Devuelve error si el usuario no tiene una sesión activa.
 * Aplica RLS estricto por auth.uid().
 */
export async function getUserPalettesServer(): Promise<{
  data: FavoritePalette[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: "No autorizado" }
    }

    const { data, error } = await supabase
      .from("user_color_palettes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener paletas del usuario:", error)
      return { data: null, error: error.message }
    }

    const palettes = (data as unknown as PaletteRow[] || []).map(mapRowToPalette)
    return { data: palettes, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado del servidor"
    console.error("Excepción en getUserPalettesServer:", err)
    return { data: null, error: message }
  }
}

/**
 * Guarda una nueva paleta en Supabase para el usuario autenticado.
 * Valida entrada, normaliza colores HEX y evita duplicados para la misma cuenta.
 */
export async function saveUserPaletteServer(palette: {
  name?: string
  colors: string[]
}): Promise<{
  data: FavoritePalette | null
  error: string | null
  alreadyExisted?: boolean
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: "Debes iniciar sesión para guardar en tu cuenta." }
    }

    // Normalizar y validar colores
    const cleanColors = palette.colors
      .map((c) => normalizeHex(c))
      .filter((c): c is string => c !== null)

    if (cleanColors.length < 2) {
      return { data: null, error: "La paleta debe contener al menos 2 colores válidos." }
    }

    if (cleanColors.length > 10) {
      return { data: null, error: "La paleta no puede superar 10 colores." }
    }

    // Comprobar si ya existe exactamente la misma secuencia de colores para este usuario
    const { data: existingRows } = await supabase
      .from("user_color_palettes")
      .select("*")
      .eq("user_id", user.id)

    const cleanKey = cleanColors.join(",")
    const existing = (existingRows as unknown as PaletteRow[] || []).find(
      (row) => row.colors.join(",") === cleanKey
    )

    if (existing) {
      return { data: mapRowToPalette(existing), error: null, alreadyExisted: true }
    }

    const paletteName = palette.name?.trim() || `Paleta ${((existingRows?.length || 0) + 1)}`

    const { data, error } = await supabase
      .from("user_color_palettes")
      .insert({
        user_id: user.id,
        name: paletteName,
        colors: cleanColors,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al insertar paleta en Supabase:", error)
      return { data: null, error: error.message }
    }

    return { data: mapRowToPalette(data as unknown as PaletteRow), error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado al guardar"
    console.error("Excepción en saveUserPaletteServer:", err)
    return { data: null, error: message }
  }
}

/**
 * Elimina una paleta favorita del usuario autenticado en Supabase.
 * Verifica la propiedad con user.id y las políticas RLS.
 */
export async function deleteUserPaletteServer(paletteId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "No autorizado" }
    }

    if (!paletteId || typeof paletteId !== "string") {
      return { success: false, error: "Identificador de paleta inválido" }
    }

    const { error } = await supabase
      .from("user_color_palettes")
      .delete()
      .eq("id", paletteId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error al eliminar paleta:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado al eliminar"
    console.error("Excepción en deleteUserPaletteServer:", err)
    return { success: false, error: message }
  }
}

/**
 * Actualiza el nombre de una paleta favorita en Supabase.
 */
export async function updateUserPaletteServer(
  paletteId: string,
  updates: { name: string }
): Promise<{
  data: FavoritePalette | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: "No autorizado" }
    }

    const cleanName = updates.name.trim()
    if (!cleanName) {
      return { data: null, error: "El nombre no puede estar vacío" }
    }

    const { data, error } = await supabase
      .from("user_color_palettes")
      .update({
        name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paletteId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar nombre de paleta:", error)
      return { data: null, error: error.message }
    }

    return { data: mapRowToPalette(data as unknown as PaletteRow), error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado al actualizar"
    console.error("Excepción en updateUserPaletteServer:", err)
    return { data: null, error: message }
  }
}
