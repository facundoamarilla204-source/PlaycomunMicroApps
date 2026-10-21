import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createKitchenIngredientServer,
  updateKitchenIngredientServer,
  deleteKitchenIngredientServer,
  getKitchenIngredientsServer,
  getIngredientPriceHistoryServer,
  getKitchenIngredientsCountServer,
} from '../kitchen-ingredients'
import { microapps, getMicroappBySlug } from '@/data/microapps'
import { PRO_REQUIRED_RECIPE_ERROR } from '@/lib/costo-receta'

// Mocks de Supabase y autenticación
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockIlike = vi.fn()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((_table: string) => {
      const selectChain: any = {}
      selectChain.eq = vi.fn().mockImplementation(() => selectChain)
      selectChain.order = mockOrder
      selectChain.ilike = vi.fn().mockImplementation(() => selectChain)
      selectChain.single = mockSingle
      selectChain.maybeSingle = mockMaybeSingle

      return {
        select: mockSelect.mockReturnValue(selectChain),
        insert: mockInsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        update: mockUpdate.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        }),
        delete: mockDelete.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      }
    }),
    rpc: mockRpc,
  })),
}))

const mockIsProUser = vi.fn()
vi.mock('@/lib/pro', () => ({
  isProUser: (id: string) => mockIsProUser(id),
}))

describe('Cocina Pro - Fase 4: Microapps y Biblioteca de Ingredientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'usr-123', email: 'chef@playcomun.com' } } })
    mockIsProUser.mockResolvedValue(true)
  })

  describe('1. Microapps Catalog Registry', () => {
    it('debe contener la microapp Cocina Pro con estado activo y ruta funcional', () => {
      const cocinaPro = getMicroappBySlug('cocina-pro')
      expect(cocinaPro).toBeDefined()
      expect(cocinaPro?.name).toBe('Cocina Pro')
      expect(cocinaPro?.url).toBe('/cocina-pro')
      expect(cocinaPro?.status).toBe('active')
      expect(cocinaPro?.badge).toBe('Pro')
    })

    it('no debe listar aplicaciones inexistentes como disponibles', () => {
      microapps.forEach((app) => {
        expect(['cocina-pro']).toContain(app.slug)
        expect(app.url).toMatch(/^\/[a-z0-9-]+/)
      })
    })

    it('desglosa módulos reales diferenciando los disponibles de los futuros', () => {
      const cocinaPro = getMicroappBySlug('cocina-pro')!
      const available = cocinaPro.modules.filter((m) => m.status === 'disponible')
      const upcoming = cocinaPro.modules.filter((m) => m.status === 'proximamente')

      expect(available.length).toBeGreaterThanOrEqual(3)
      expect(upcoming.length).toBeGreaterThanOrEqual(2)
      expect(available.some((m) => m.title.includes('Biblioteca de ingredientes'))).toBe(true)
    })
  })

  describe('2. Control de Acceso y Aislamiento Pro en Server Actions', () => {
    it('bloquea la creación de ingredientes si el usuario no ha iniciado sesión', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const res = await createKitchenIngredientServer({
        name: 'Harina 000',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 1200,
      })

      expect(res.data).toBeNull()
      expect(res.error).toContain('Debes iniciar sesión')
    })

    it('bloquea la creación de ingredientes si el usuario no tiene plan Pro', async () => {
      mockIsProUser.mockResolvedValueOnce(false)

      const res = await createKitchenIngredientServer({
        name: 'Harina 000',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 1200,
      })

      expect(res.data).toBeNull()
      expect(res.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })

    it('bloquea la consulta del historial de precios si no es Pro', async () => {
      mockIsProUser.mockResolvedValueOnce(false)

      const res = await getIngredientPriceHistoryServer('ing-1')
      expect(res.data).toEqual([])
      expect(res.error).toBe(PRO_REQUIRED_RECIPE_ERROR)
    })
  })

  describe('3. Validaciones de Negocio en Ingredientes', () => {
    it('rechaza nombres vacíos o solo espacios', async () => {
      const res = await createKitchenIngredientServer({
        name: '   ',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: 1200,
      })

      expect(res.data).toBeNull()
      expect(res.error).toContain('nombre del ingrediente es obligatorio')
    })

    it('rechaza cantidades de presentación menores o iguales a cero', async () => {
      const resZero = await createKitchenIngredientServer({
        name: 'Azúcar',
        package_unit: 'kg',
        package_quantity: 0,
        current_price: 1000,
      })
      expect(resZero.error).toContain('positivo mayor a 0')

      const resNeg = await createKitchenIngredientServer({
        name: 'Azúcar',
        package_unit: 'kg',
        package_quantity: -5,
        current_price: 1000,
      })
      expect(resNeg.error).toContain('positivo mayor a 0')
    })

    it('rechaza precios vigentes negativos', async () => {
      const res = await createKitchenIngredientServer({
        name: 'Manteca',
        package_unit: 'kg',
        package_quantity: 1,
        current_price: -450,
      })

      expect(res.data).toBeNull()
      expect(res.error).toContain('no puede ser negativo')
    })

    it('rechaza densidades no positivas cuando se especifican', async () => {
      const resZero = await createKitchenIngredientServer({
        name: 'Aceite de girasol',
        package_unit: 'l',
        package_quantity: 1,
        current_price: 2000,
        density_g_ml: 0,
      })
      expect(resZero.error).toContain('densidad')

      const resNeg = await createKitchenIngredientServer({
        name: 'Aceite de girasol',
        package_unit: 'l',
        package_quantity: 1,
        current_price: 2000,
        density_g_ml: -0.92,
      })
      expect(resNeg.error).toContain('densidad')
    })

    it('rechaza porcentajes de agua fuera del rango [0, 100]', async () => {
      const resOver = await createKitchenIngredientServer({
        name: 'Leche entera',
        package_unit: 'l',
        package_quantity: 1,
        current_price: 1100,
        estimated_water_percentage: 120,
      })
      expect(resOver.error).toContain('entre 0% y 100%')

      const resNeg = await createKitchenIngredientServer({
        name: 'Leche entera',
        package_unit: 'l',
        package_quantity: 1,
        current_price: 1100,
        estimated_water_percentage: -10,
      })
      expect(resNeg.error).toContain('entre 0% y 100%')
    })
  })

  describe('4. Inmutabilidad y Persistencia del Historial', () => {
    it('obtiene el historial ordenado cronológicamente de forma descendente', async () => {
      const mockHistoryRecords = [
        {
          id: 'hist-2',
          ingredient_id: 'ing-1',
          user_id: 'usr-123',
          previous_price: 1000,
          new_price: 1200,
          change_reason: 'Aumento proveedor',
          recorded_at: '2026-10-21T10:00:00Z',
        },
        {
          id: 'hist-1',
          ingredient_id: 'ing-1',
          user_id: 'usr-123',
          previous_price: 1000,
          new_price: 1000,
          change_reason: 'Alta inicial de ingrediente',
          recorded_at: '2026-10-01T08:00:00Z',
        },
      ]

      mockOrder.mockResolvedValueOnce({ data: mockHistoryRecords, error: null })

      const res = await getIngredientPriceHistoryServer('ing-1')
      expect(res.data).toEqual(mockHistoryRecords)
      expect(res.error).toBeNull()
      expect(res.data[0].new_price).toBe(1200)
      expect(res.data[1].change_reason).toBe('Alta inicial de ingrediente')
    })
  })

  describe('5. Eliminación Segura y Preservación de Recetas', () => {
    it('elimina el ingrediente de la biblioteca sin fallos cuando pertenece al usuario', async () => {
      mockDelete.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({ error: null }),
        }),
      })

      const res = await deleteKitchenIngredientServer('ing-delete-1')
      expect(res.success).toBe(true)
      expect(res.error).toBeNull()
    })

    it('maneja errores de base de datos devolviendo mensaje sin confirmación falsa', async () => {
      mockDelete.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({ error: { message: 'Foreign key constraint' } }),
        }),
      })

      const res = await deleteKitchenIngredientServer('ing-delete-2')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Foreign key constraint')
    })
  })
})
