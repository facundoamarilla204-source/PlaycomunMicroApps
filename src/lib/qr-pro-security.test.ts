import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getUserQrGroups,
  getGroupQrs,
  getUserQrCodes,
  generateQrCodes,
  updateQrDestination,
  updateQrStatus,
  getUserQrPreservedCount,
  getQrByTokenPublic,
} from '@/app/actions/qr'
import * as proModule from '@/lib/pro'
import * as supabaseServerModule from '@/utils/supabase/server'
import * as supabaseJsModule from '@supabase/supabase-js'

// Mock de Supabase server
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pro', () => ({
  isProUser: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Generador QR: Blindaje de Seguridad Pro y Preservación de Datos', () => {
  const mockUser = { id: 'user-qr-123', email: 'test@playcomun.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('1. Control de Autenticación y Autorización en Server Actions', () => {
    it('rechaza llamada anónima en getUserQrGroups', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      await expect(getUserQrGroups()).rejects.toThrow('No autenticado')
    })

    it('bloquea a usuario autenticado GRATUITO en getUserQrGroups', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      await expect(getUserQrGroups()).rejects.toThrow(/suscripción PlayComun Pro activa/i)
    })

    it('permite a usuario PRO listar sus grupos de QR', async () => {
      const sampleGroups = [{ id: 'group-1', user_id: mockUser.id, group_code: '1234567', name: null, created_at: '2026-10-16' }]
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: sampleGroups, error: null }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await getUserQrGroups()
      expect(result).toEqual(sampleGroups)
    })

    it('bloquea a usuario GRATUITO al intentar generar códigos QR dinámicos', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      await expect(generateQrCodes(50)).rejects.toThrow(/suscripción PlayComun Pro activa/i)
    })

    it('bloquea a usuario GRATUITO al intentar configurar o actualizar destinos de QR', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      await expect(updateQrDestination('qr-1', 'https://miempresa.com/menu')).rejects.toThrow(/suscripción PlayComun Pro activa/i)
    })

    it('bloquea a usuario GRATUITO al intentar pausar o cambiar estado de un QR', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(false)

      await expect(updateQrStatus('qr-1', 'paused')).rejects.toThrow(/suscripción PlayComun Pro activa/i)
    })
  })

  describe('2. Validación Estricta de URLs de Destino y Prevención de Abuso', () => {
    it('rechaza URLs con esquema javascript: (previene XSS)', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      await expect(updateQrDestination('qr-1', 'javascript:alert(document.cookie)')).rejects.toThrow(/no está permitido/i)
    })

    it('rechaza URLs con esquema data: (previene inyección de payloads)', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      await expect(updateQrDestination('qr-1', 'data:text/html,<script>alert(1)</script>')).rejects.toThrow(/no está permitido/i)
    })

    it('rechaza URLs con esquema ftp: u otros no web', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      await expect(updateQrDestination('qr-1', 'ftp://servidor.com/archivo')).rejects.toThrow(/protocolo web seguro/i)
    })

    it('rechaza direcciones IP directas (evita escaneo de red interna y SSRF)', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      await expect(updateQrDestination('qr-1', 'http://192.168.1.1/admin')).rejects.toThrow(/No se permiten direcciones IP/i)
      await expect(updateQrDestination('qr-1', 'http://127.0.0.1:8080')).rejects.toThrow(/No se permiten direcciones IP/i)
    })

    it('rechaza localhost y nombres internos', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      await expect(updateQrDestination('qr-1', 'http://localhost:3000')).rejects.toThrow(/locales o internos/i)
    })

    it('rechaza bucles de redirección que apunten a rutas /q/ del propio sitio', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      await expect(updateQrDestination('qr-1', 'https://playcomun.com/q/otro-token-publico')).rejects.toThrow(/bucles infinitos/i)
    })

    it('rechaza URLs que superen los 2048 caracteres', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const superLong = `https://ejemplo.com/${'x'.repeat(2050)}`
      await expect(updateQrDestination('qr-1', superLong)).rejects.toThrow(/longitud máxima/i)
    })

    it('permite URLs válidas con https://', async () => {
      const updatedQr = { id: 'qr-1', destination_url: 'https://miempresa.com/menu', status: 'active' }
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedQr, error: null }),
                }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(proModule.isProUser).mockResolvedValue(true)

      const result = await updateQrDestination('qr-1', 'https://miempresa.com/menu')
      expect(result).toEqual(updatedQr)
    })
  })

  describe('3. Preservación de Datos y Consulta de Recuentos', () => {
    it('permite al usuario con Pro vencido consultar la cantidad de tandas y códigos preservados', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        rpc: vi.fn().mockImplementation((fnName: string) => {
          if (fnName === 'get_user_qr_group_count') return Promise.resolve({ data: 3, error: null })
          if (fnName === 'get_user_qr_code_count') return Promise.resolve({ data: 150, error: null })
          return Promise.resolve({ data: 0, error: null })
        }),
      }
      vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSupabase as any)

      const counts = await getUserQrPreservedCount()
      expect(counts.groupCount).toBe(3)
      expect(counts.codeCount).toBe(150)
    })
  })

  describe('4. Resolución Pública de QRs Dinámicos (Independiente del estado Pro)', () => {
    it('resuelve el destino público usando la clave de servicio sin requerir que el creador sea Pro', async () => {
      const publicQr = {
        id: 'qr-active-1',
        public_token: 'token1234567890a',
        status: 'active',
        destination_url: 'https://cliente.com/promocion',
      }

      const mockAdminClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: publicQr, error: null }),
            }),
          }),
        }),
      }
      vi.mocked(supabaseJsModule.createClient).mockReturnValue(mockAdminClient as any)

      // Invocación pública sin sesión
      const res = await getQrByTokenPublic('token1234567890a')
      expect(res).toEqual(publicQr)
      expect(res?.status).toBe('active')
      expect(res?.destination_url).toBe('https://cliente.com/promocion')
    })
  })
})
