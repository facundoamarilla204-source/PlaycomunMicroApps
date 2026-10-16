import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PRO_REQUIRED_EXPENSE_ERROR } from './control-gastos'
import {
  getExpenseUserStatusServer,
  getUserExpensesServer,
  createExpenseServer,
  updateExpenseServer,
  deleteExpenseServer,
  syncExpensesBatchServer,
  exportExpensesExcelServer,
} from '@/app/actions/expenses'
import * as proModule from '@/lib/pro'
import * as supabaseServerModule from '@/utils/supabase/server'
import { Expense } from '@/components/tools/control-gastos/types'

// Mock de Supabase server
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pro', () => ({
  isProUser: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Control de Gastos: Modalidad Gratis + Pro y Conservación de Datos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // ESCENARIO 1: Usuario no autenticado (Modalidad Gratis)
  // =========================================================================
  describe('Escenario 1: Modalidad Gratis (Sin login)', () => {
    it('retorna estado no autenticado y sin Pro sin lanzar errores', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const status = await getExpenseUserStatusServer()
      expect(status.isAuthenticated).toBe(false)
      expect(status.isPro).toBe(false)
      expect(status.userId).toBeNull()
      expect(status.preservedCount).toBe(0)
    })

    it('bloquea la lectura remota para usuarios no autenticados', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const res = await getUserExpensesServer()
      expect(res.data).toBeNull()
      expect(res.error).toContain('Debes iniciar sesión')
    })
  })

  // =========================================================================
  // ESCENARIO 2: Usuario autenticado sin Pro (Datos Preservados intactos)
  // =========================================================================
  describe('Escenario 2: Usuario sin Pro con datos preservados en la nube', () => {
    it('informa recuento de movimientos preservados sin exponer registros', async () => {
      const mockUser = { id: 'user-sin-pro-123' }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        rpc: vi.fn().mockResolvedValue({ data: 12, error: null }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const status = await getExpenseUserStatusServer()
      expect(status.isAuthenticated).toBe(true)
      expect(status.isPro).toBe(false)
      expect(status.preservedCount).toBe(12) // 12 movimientos intactos en Supabase
    })

    it('bloquea getUserExpensesServer retornando isProRequired y preservedCount', async () => {
      const mockUser = { id: 'user-sin-pro-123' }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        rpc: vi.fn().mockResolvedValue({ data: 12, error: null }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const res = await getUserExpensesServer()
      expect(res.data).toBeNull()
      expect(res.error).toBe(PRO_REQUIRED_EXPENSE_ERROR)
      expect(res.isProRequired).toBe(true)
      expect(res.preservedCount).toBe(12)
    })

    it('rechaza inserción remota si no tiene suscripción Pro activa', async () => {
      const mockUser = { id: 'user-sin-pro-123' }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const res = await createExpenseServer({
        type: 'expense',
        amount: 2500,
        description: 'Intento sin pro',
        category: 'Alimentación',
        expense_date: '2026-10-15',
      })

      expect(res.data).toBeNull()
      expect(res.isProRequired).toBe(true)
      expect(res.error).toBe(PRO_REQUIRED_EXPENSE_ERROR)
    })

    it('rechaza exportación a Excel en el servidor si no es Pro', async () => {
      const mockUser = { id: 'user-sin-pro-123' }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const res = await exportExpensesExcelServer({ period: 'este-mes' })
      expect(res.base64).toBeUndefined()
      expect(res.isProRequired).toBe(true)
      expect(res.error).toBe(PRO_REQUIRED_EXPENSE_ERROR)
    })
  })

  // =========================================================================
  // ESCENARIO 3: Usuario Pro Activo (Sincronización y Exportación)
  // =========================================================================
  describe('Escenario 3: Usuario Pro con acceso completo', () => {
    it('permite leer movimientos de la nube', async () => {
      const mockUser = { id: 'user-pro-999' }
      const mockData: Expense[] = [
        {
          id: 'exp-1',
          user_id: mockUser.id,
          type: 'income',
          amount: 50000,
          description: 'Cobro Freelance',
          category: 'Honorarios',
          expense_date: '2026-10-15',
          payment_method: 'Transferencia',
          notes: null,
          created_at: '2026-10-15T10:00:00Z',
          updated_at: '2026-10-15T10:00:00Z',
        },
      ]

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await getUserExpensesServer()
      expect(res.error).toBeNull()
      expect(res.data).toHaveLength(1)
      expect(res.data?.[0].description).toBe('Cobro Freelance')
    })

    it('permite guardar nuevos movimientos en la nube', async () => {
      const mockUser = { id: 'user-pro-999' }
      const mockInserted: Expense = {
        id: 'new-exp-id',
        user_id: mockUser.id,
        type: 'expense',
        amount: 8000,
        description: 'Supermercado Día',
        category: 'Alimentación',
        expense_date: '2026-10-15',
        payment_method: 'Débito',
        notes: null,
        created_at: '2026-10-15T12:00:00Z',
        updated_at: '2026-10-15T12:00:00Z',
      }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await createExpenseServer({
        type: 'expense',
        amount: 8000,
        description: 'Supermercado Día',
        category: 'Alimentación',
        expense_date: '2026-10-15',
        payment_method: 'Débito',
      })

      expect(res.error).toBeNull()
      expect(res.data?.id).toBe('new-exp-id')
      expect(res.data?.amount).toBe(8000)
    })

    it('ejecuta sincronización por lotes de forma idempotente', async () => {
      const mockUser = { id: 'user-pro-999' }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const localBatch = [
        {
          id: 'local-1',
          type: 'income' as const,
          amount: 20000,
          description: 'Ingreso local 1',
          category: 'Ventas',
          expense_date: '2026-10-12',
        },
        {
          id: 'local-2',
          type: 'expense' as const,
          amount: 5000,
          description: 'Gasto local 2',
          category: 'Transporte',
          expense_date: '2026-10-13',
        },
      ]

      const res = await syncExpensesBatchServer(localBatch)
      expect(res.success).toBe(true)
      expect(res.importedCount).toBe(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
    })

    it('genera archivo Excel codificado en base64 para usuario Pro', async () => {
      const mockUser = { id: 'user-pro-999' }
      const sampleMovements: Expense[] = [
        {
          id: 'exp-1',
          user_id: mockUser.id,
          type: 'income',
          amount: 80000,
          description: 'Factura A',
          category: 'Ventas',
          expense_date: '2026-10-10',
          payment_method: 'Transferencia',
          notes: null,
          created_at: '2026-10-10T10:00:00Z',
          updated_at: '2026-10-10T10:00:00Z',
        },
      ]

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: sampleMovements, error: null }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const res = await exportExpensesExcelServer({ period: 'todos' })
      expect(res.error).toBeUndefined()
      expect(res.base64).toBeDefined()
      expect(res.fileName).toContain('control-gastos-todos-')
    })
  })

  // =========================================================================
  // ESCENARIO 4: Ciclo Pro Vencido -> Pro Reactivado
  // =========================================================================
  describe('Escenario 4: Ciclo Pro Vencido -> Reactivación', () => {
    it('demuestra que la pérdida de Pro conserva los datos y la reactivación los restaura sin pérdida', async () => {
      const mockUser = { id: 'user-ciclo-123' }

      // 1. Pro Vencido
      const mockSupabaseVencido = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        rpc: vi.fn().mockResolvedValue({ data: 45, error: null }), // 45 registros preservados
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabaseVencido as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      const statusVencido = await getExpenseUserStatusServer()
      expect(statusVencido.isPro).toBe(false)
      expect(statusVencido.preservedCount).toBe(45)

      const blockedRead = await getUserExpensesServer()
      expect(blockedRead.isProRequired).toBe(true)
      expect(blockedRead.preservedCount).toBe(45)

      // 2. Reactivación de Pro
      vi.mocked(proModule.isProUser).mockResolvedValue(true)
      const mockSupabaseReactivado = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: Array(45).fill({ id: 'exp', amount: 100 }),
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabaseReactivado as any)

      const readReactivado = await getUserExpensesServer()
      expect(readReactivado.error).toBeNull()
      expect(readReactivado.data).toHaveLength(45) // Exactamente los mismos 45 registros
    })
  })
})
