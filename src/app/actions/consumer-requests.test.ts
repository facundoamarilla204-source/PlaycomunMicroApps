import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitConsumerRequest, getConsumerRequestStatus } from './consumer-requests'

// Mocks de base de datos y rate limit
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn()
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: mockSelect
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    }
  })
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map([
    ['x-forwarded-for', '190.1.2.3'],
    ['user-agent', 'Vitest-Agent']
  ]))
}))

vi.mock('@/utils/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 })
}))

describe('submitConsumerRequest action - Auditoría Integral', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
        }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  })

  it('rechaza solicitudes sin nombre completo o con nombre menor a 3 caracteres', async () => {
    const res1 = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: '',
      email: 'test@example.com'
    })
    expect(res1.success).toBe(false)
    expect(res1.error).toContain('al menos 3 caracteres')

    const res2 = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'ab',
      email: 'test@example.com'
    })
    expect(res2.success).toBe(false)
    expect(res2.error).toContain('al menos 3 caracteres')
  })

  it('rechaza direcciones de email vacías o inválidas', async () => {
    const res1 = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'Juan Pérez',
      email: ''
    })
    expect(res1.success).toBe(false)
    expect(res1.error).toContain('requerido')

    const res2 = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'Juan Pérez',
      email: 'email-sin-arroba'
    })
    expect(res2.success).toBe(false)
    expect(res2.error).toContain('dirección de correo electrónico válida')
  })

  it('bloquea envíos de bots mediante honeypot sin llamar a la base de datos', async () => {
    const res = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'Spam Bot',
      email: 'bot@spam.com',
      website: 'http://malicious-bot.com'
    })

    expect(res.success).toBe(true)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('genera un código ARR- y persiste en base de datos para arrepentimiento', async () => {
    const res = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'Valeria López',
      email: 'valeria@example.com',
      details: 'Deseo revocar la suscripción Pro'
    })

    expect(res.success).toBe(true)
    expect(res.trackingCode).toBeDefined()
    expect(res.trackingCode).toMatch(/^ARR-\d{8}-[A-Z0-9]{4}$/)
    expect(mockFrom).toHaveBeenCalledWith('consumer_requests')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('genera un código BAJ- para solicitud de baja de servicio', async () => {
    const res = await submitConsumerRequest({
      requestType: 'baja_servicio',
      fullName: 'Carlos Bianchi',
      email: 'carlos@example.com',
      paymentReference: 'MP-998877'
    })

    expect(res.success).toBe(true)
    expect(res.trackingCode).toBeDefined()
    expect(res.trackingCode).toMatch(/^BAJ-\d{8}-[A-Z0-9]{4}$/)
  })

  it('falla con mensaje de error si la base de datos rechaza la inserción (sin falso éxito)', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'Database connection failed' } })

    const res = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'Laura Gómez',
      email: 'laura@example.com'
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain('error de base de datos')
    expect(res.trackingCode).toBeUndefined()
  })

  it('detecta duplicados en ventana corta y retorna el tracking code previo con bandera isDuplicate', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { tracking_code: 'ARR-20261016-PREV', created_at: new Date().toISOString() },
                  error: null
                })
              })
            })
          })
        })
      })
    })

    const res = await submitConsumerRequest({
      requestType: 'arrepentimiento',
      fullName: 'Lucas Medina',
      email: 'lucas@example.com'
    })

    expect(res.success).toBe(true)
    expect(res.isDuplicate).toBe(true)
    expect(res.trackingCode).toBe('ARR-20261016-PREV')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rechaza si se excede el rate limit por IP', async () => {
    const { checkRateLimit } = await import('@/utils/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfter: 3600 })

    const res = await submitConsumerRequest({
      requestType: 'baja_servicio',
      fullName: 'Usuario Abusivo',
      email: 'abusivo@example.com'
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain('Demasiadas solicitudes')
  })
})

describe('getConsumerRequestStatus action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza búsquedas con código o email vacíos', async () => {
    const res = await getConsumerRequestStatus('', '')
    expect(res.success).toBe(false)
    expect(res.error).toContain('requeridos')
  })

  it('devuelve el estado del trámite cuando el código y el email coinciden', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              tracking_code: 'ARR-20261016-ABCD',
              request_type: 'arrepentimiento',
              status: 'in_review',
              created_at: '2026-10-16T12:00:00Z',
              resolved_at: null,
              resolution_notes: null
            },
            error: null
          })
        })
      })
    })

    const res = await getConsumerRequestStatus('ARR-20261016-ABCD', 'valeria@example.com')
    expect(res.success).toBe(true)
    expect(res.request).toBeDefined()
    expect(res.request?.status).toBe('in_review')
    expect(res.request?.trackingCode).toBe('ARR-20261016-ABCD')
  })

  it('devuelve error claro si no coincide el código o el email', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    })

    const res = await getConsumerRequestStatus('ARR-20261016-FAKE', 'otro@example.com')
    expect(res.success).toBe(false)
    expect(res.error).toContain('No se encontró ninguna solicitud')
  })
})
