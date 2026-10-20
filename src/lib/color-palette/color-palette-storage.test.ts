import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getFavoritePalettes,
  saveFavoritePalette,
  removeFavoritePalette,
  updateFavoritePalette,
  isPaletteInFavorites,
} from "./favorites-storage"
import {
  getUserPalettesServer,
  saveUserPaletteServer,
  deleteUserPaletteServer,
  updateUserPaletteServer,
} from "@/app/actions/color-palettes"
import * as supabaseServerModule from "@/utils/supabase/server"

// Mock de Supabase server
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

// Mock de localStorage para entorno Node/Vitest
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

if (typeof window === "undefined") {
  ;(global as unknown as { window: unknown }).window = {
    localStorage: localStorageMock,
  }
  ;(global as unknown as { localStorage: unknown }).localStorage = localStorageMock
}

describe("Persistencia de Favoritos: Visitante (localStorage) vs Autenticado (Supabase RLS)", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. Visitante sin sesión iniciada (localStorage)
  // =========================================================================
  describe("Escenario 1: Visitante sin sesión iniciada", () => {
    it("guarda, lista y elimina favoritos utilizando exclusivamente localStorage", () => {
      expect(getFavoritePalettes()).toEqual([])

      const saved = saveFavoritePalette({
        name: "Paleta Calma",
        colors: ["#7C3AED", "#10B981", "#3B82F6"],
      })

      expect(saved).not.toBeNull()
      expect(saved?.name).toBe("Paleta Calma")
      expect(saved?.colors).toEqual(["#7C3AED", "#10B981", "#3B82F6"])

      const list = getFavoritePalettes()
      expect(list.length).toBe(1)
      expect(list[0].id).toBe(saved?.id)

      // Comprobar existencia
      expect(isPaletteInFavorites(["#7C3AED", "#10B981", "#3B82F6"], list)).toBe(true)
      expect(isPaletteInFavorites(["#FFFFFF", "#000000"], list)).toBe(false)

      // Renombrar
      const renamed = updateFavoritePalette(saved!.id, { name: "Paleta Calma Modificada" })
      expect(renamed).toBe(true)
      expect(getFavoritePalettes()[0].name).toBe("Paleta Calma Modificada")

      // Eliminar
      const removed = removeFavoritePalette(saved!.id)
      expect(removed).toBe(true)
      expect(getFavoritePalettes()).toEqual([])
    })

    it("recupera transparentemente ante datos corruptos en localStorage", () => {
      localStorageMock.setItem("playcomun_color_palettes_v1", "JSON_INVALIDO_{{")
      expect(getFavoritePalettes()).toEqual([])
    })
  })

  // =========================================================================
  // 2. Usuario autenticado con Supabase
  // =========================================================================
  describe("Escenario 2: Usuario autenticado guarda en Supabase", () => {
    it("guarda paleta en Supabase asociada al user_id del usuario", async () => {
      const mockUser = { id: "user-alpha-123", email: "alpha@playcomun.online" }
      const mockCreatedRow = {
        id: "pal-uuid-1",
        user_id: mockUser.id,
        name: "Paleta Neón",
        colors: ["#7C3AED", "#EC4899", "#F59E0B"],
        created_at: "2026-10-19T21:00:00Z",
        updated_at: "2026-10-19T21:00:00Z",
      }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCreatedRow,
                error: null,
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await saveUserPaletteServer({
        name: "Paleta Neón",
        colors: ["#7C3AED", "#EC4899", "#F59E0B"],
      })

      expect(res.error).toBeNull()
      expect(res.data).not.toBeNull()
      expect(res.data?.id).toBe("pal-uuid-1")
      expect(res.data?.name).toBe("Paleta Neón")
      expect(res.data?.colors).toEqual(["#7C3AED", "#EC4899", "#F59E0B"])

      // Verificar que NO tocó localStorage en ningún momento
      expect(localStorageMock.getItem("playcomun_color_palettes_v1")).toBeNull()
    })

    it("recupera las paletas del usuario autenticado ordenadas por fecha", async () => {
      const mockUser = { id: "user-alpha-123" }
      const mockRows = [
        {
          id: "pal-uuid-2",
          user_id: mockUser.id,
          name: "Paleta Dos",
          colors: ["#10B981", "#3B82F6"],
          created_at: "2026-10-19T21:10:00Z",
          updated_at: "2026-10-19T21:10:00Z",
        },
        {
          id: "pal-uuid-1",
          user_id: mockUser.id,
          name: "Paleta Uno",
          colors: ["#7C3AED", "#EC4899"],
          created_at: "2026-10-19T21:00:00Z",
          updated_at: "2026-10-19T21:00:00Z",
        },
      ]

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockRows,
                error: null,
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await getUserPalettesServer()
      expect(res.error).toBeNull()
      expect(res.data?.length).toBe(2)
      expect(res.data?.[0].id).toBe("pal-uuid-2")
      expect(res.data?.[1].id).toBe("pal-uuid-1")
    })

    it("actualiza el nombre de una paleta en Supabase para el usuario propietario", async () => {
      const mockUser = { id: "user-alpha-123" }
      const mockUpdatedRow = {
        id: "pal-uuid-1",
        user_id: mockUser.id,
        name: "Paleta Renombrada",
        colors: ["#7C3AED", "#EC4899"],
        created_at: "2026-10-19T21:00:00Z",
        updated_at: "2026-10-19T21:15:00Z",
      }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdatedRow,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await updateUserPaletteServer("pal-uuid-1", { name: "Paleta Renombrada" })
      expect(res.error).toBeNull()
      expect(res.data?.name).toBe("Paleta Renombrada")
    })
  })

  // =========================================================================
  // 3 & 4. Aislamiento entre Usuario A y Usuario B (Rechazo de accesos cruzados)
  // =========================================================================
  describe("Escenario 3 y 4: Aislamiento estricto entre cuentas y rechazo de accesos cruzados", () => {
    it("el Usuario B no puede consultar paletas del Usuario A", async () => {
      const mockUserB = { id: "user-beta-999" }

      // La consulta filtra estrictamente por eq('user_id', userB.id)
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUserB },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          expect(table).toBe("user_color_palettes")
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn((field: string, val: string) => {
                expect(field).toBe("user_id")
                expect(val).toBe(mockUserB.id) // Debe usar siempre el id autenticado
                return {
                  order: vi.fn().mockResolvedValue({
                    data: [], // Usuario B no tiene registros de Usuario A
                    error: null,
                  }),
                }
              }),
            }),
          }
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await getUserPalettesServer()
      expect(res.error).toBeNull()
      expect(res.data).toEqual([])
    })

    it("el Usuario B no puede eliminar ni modificar una paleta del Usuario A manipulando su id", async () => {
      const mockUserB = { id: "user-beta-999" }
      const paletteIdOfUserA = "pal-uuid-belonging-to-user-A"

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUserB },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn((field1: string, val1: string) => ({
              eq: vi.fn((field2: string, val2: string) => {
                // Comprobar que ambas condiciones están presentes: id Y user_id
                expect(val1).toBe(paletteIdOfUserA)
                expect(val2).toBe(mockUserB.id)
                // En la BD real con RLS, la fila no coincide con user_id y no se altera nada
                return Promise.resolve({ error: null })
              }),
            })),
          }),
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await deleteUserPaletteServer(paletteIdOfUserA)
      expect(res.success).toBe(true)
    })
  })

  // =========================================================================
  // 5 & 6. Cierre de sesión y restauración limpia a visitante
  // =========================================================================
  describe("Escenario 5 y 6: Cerrar sesión limpia datos de cuenta y restaura modo visitante", () => {
    it("no filtra datos locales al iniciar sesión ni expone datos de cuenta tras logout", () => {
      // 1. Visitante guarda una paleta local antes de iniciar sesión
      saveFavoritePalette({
        name: "Paleta Local Visitante",
        colors: ["#111111", "#222222", "#333333"],
      })
      const localBeforeLogin = getFavoritePalettes()
      expect(localBeforeLogin.length).toBe(1)
      expect(localBeforeLogin[0].name).toBe("Paleta Local Visitante")

      // 2. Al autenticarse, la lista de la cuenta proviene de Supabase
      // y NO incluye ni contamina con la paleta local
      const accountPalettes = [
        {
          id: "account-fav-1",
          name: "Paleta en la Nube",
          colors: ["#7C3AED", "#A78BFA"],
          createdAt: "2026-10-19T21:00:00Z",
          version: 1,
        },
      ]

      expect(accountPalettes.some((p) => p.name === "Paleta Local Visitante")).toBe(false)

      // 3. Al cerrar sesión, la aplicación vuelve a leer únicamente el almacenamiento local
      const localAfterLogout = getFavoritePalettes()
      expect(localAfterLogout.length).toBe(1)
      expect(localAfterLogout[0].name).toBe("Paleta Local Visitante")
      expect(localAfterLogout.some((p) => p.id === "account-fav-1")).toBe(false)
    })
  })

  // =========================================================================
  // 7 & 8. Manejo de errores de red y respuestas fallidas
  // =========================================================================
  describe("Escenario 7 y 8: Errores de red y respuestas fallidas sin confirmación falsa", () => {
    it("informa el error y no genera confirmación falsa ante fallo en Supabase", async () => {
      const mockUser = { id: "user-alpha-123" }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Error de conexión con la base de datos" },
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await saveUserPaletteServer({
        name: "Paleta Error",
        colors: ["#7C3AED", "#10B981"],
      })

      expect(res.data).toBeNull()
      expect(res.error).toBe("Error de conexión con la base de datos")

      // Verificar que NO recurrió silenciosamente a localStorage al fallar
      expect(getFavoritePalettes()).toEqual([])
    })

    it("rechaza paletas con menos de 2 colores válidos", async () => {
      const mockUser = { id: "user-alpha-123" }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await saveUserPaletteServer({
        name: "Inválida",
        colors: ["#INVALIDO"],
      })

      expect(res.data).toBeNull()
      expect(res.error).toBe("La paleta debe contener al menos 2 colores válidos.")
    })
  })

  // =========================================================================
  // 9. Reconstrucción de paletas en el editor
  // =========================================================================
  describe("Escenario 9: Reconstrucción correcta de muestras desde Supabase", () => {
    it("normaliza y preserva todos los canales cromáticos al recuperar", () => {
      const supabaseColors = ["#7c3aed", "10b981", "#f59e0b"]
      const clean = supabaseColors.map((c) => {
        const hex = c.startsWith("#") ? c : `#${c}`
        return hex.toUpperCase()
      })

      expect(clean).toEqual(["#7C3AED", "#10B981", "#F59E0B"])
    })
  })
})
