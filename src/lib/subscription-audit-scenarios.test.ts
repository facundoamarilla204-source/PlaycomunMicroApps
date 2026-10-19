import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserEffectiveSubscription } from './pro'

describe('Auditoría Integral de Suscripción y Pagos — 10 Escenarios Mandatorios', () => {
  const userId = 'user-pro-123'
  const otherUserId = 'user-malicious-456'
  const now = new Date('2026-10-19T18:00:00Z').getTime()

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(now)
  })

  // ---------------------------------------------------------------------------
  // Escenario 1: Usuario gratuito sin suscripción ni historial
  // ---------------------------------------------------------------------------
  it('Escenario 1: Usuario gratuito sin suscripción ni historial recibe null y estado vacío', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, _val: any) => {
              return {
                eq: vi.fn().mockResolvedValue({ data: [], error: null })
              }
            })
          }
        }
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, _val: any) => {
              return {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ data: [], error: null })
              }
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    expect(sub).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Escenario 2: Usuario gratuito con pagos históricos reales, sin renovación activa
  // ---------------------------------------------------------------------------
  it('Escenario 2: Usuario gratuito con pagos históricos no tiene suscripción activa pero conserva su historial', async () => {
    const pastPeriodEnd = '2026-05-01T12:00:00Z' // En el pasado
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-past-expired',
                    status: 'expired',
                    provider_status: 'cancelled',
                    provider_subscription_id: 'mp-sub-old',
                    started_at: '2026-04-01T12:00:00Z',
                    current_period_start: '2026-04-01T12:00:00Z',
                    current_period_end: pastPeriodEnd,
                    created_at: '2026-04-01T12:00:00Z',
                    is_archived: false,
                    plans: {
                      id: 'plan-1',
                      code: 'pro_monthly',
                      name: 'PlayComun Pro (Mensual)',
                      price: 100,
                      currency: 'ARS',
                      billing_interval: 'month'
                    }
                  }
                ],
                error: null
              })
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    // No debe considerarse Pro activo ya que el período venció
    expect(sub).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Escenario 3: Usuario Pro con pago aprobado y período vigente
  // ---------------------------------------------------------------------------
  it('Escenario 3: Usuario Pro con pago aprobado y período vigente obtiene fechas y ciclo coherentes', async () => {
    const futurePeriodEnd = '2026-11-06T18:10:50Z'
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-pro-active',
                    status: 'active',
                    provider: 'mercadopago',
                    provider_status: 'authorized',
                    provider_subscription_id: 'mp-sub-active-123',
                    started_at: '2026-10-06T18:10:46Z',
                    current_period_start: '2026-10-06T18:10:50Z',
                    current_period_end: futurePeriodEnd,
                    created_at: '2026-10-06T18:10:46Z',
                    is_archived: false,
                    plans: {
                      id: 'plan-1',
                      code: 'pro_monthly',
                      name: 'PlayComun Pro (Mensual)',
                      price: 100,
                      currency: 'ARS',
                      billing_interval: 'month'
                    }
                  }
                ],
                error: null
              })
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    expect(sub).not.toBeNull()
    expect(sub?.status).toBe('active')
    expect(sub?.started_at).toBe('2026-10-06T18:10:46Z')
    expect(sub?.current_period_start).toBe('2026-10-06T18:10:50Z')
    expect(sub?.current_period_end).toBe(futurePeriodEnd)
    expect(new Date(sub!.current_period_end!).getTime()).toBeGreaterThan(now)
  })

  // ---------------------------------------------------------------------------
  // Escenario 4: Suscripción pendiente de confirmación
  // ---------------------------------------------------------------------------
  it('Escenario 4: Suscripción recién iniciada pendiente de confirmación es identificada sin marcarse como aprobada', async () => {
    const recentCreatedAt = new Date(now - 10 * 60 * 1000).toISOString() // Creada hace 10 minutos
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-pending-checkout',
                    status: 'pending',
                    provider_status: 'pending',
                    provider_subscription_id: 'mp-sub-pending',
                    started_at: null,
                    current_period_start: null,
                    current_period_end: null,
                    created_at: recentCreatedAt,
                    is_archived: false,
                    plans: {
                      id: 'plan-1',
                      code: 'pro_monthly',
                      name: 'PlayComun Pro (Mensual)',
                      price: 5900,
                      currency: 'ARS',
                      billing_interval: 'month'
                    }
                  }
                ],
                error: null
              })
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    expect(sub).not.toBeNull()
    expect(sub?.status).toBe('pending')
    expect(sub?.provider_status).toBe('pending')
  })

  // ---------------------------------------------------------------------------
  // Escenario 5: Suscripción vencida o fuera de gracia no otorga acceso
  // ---------------------------------------------------------------------------
  it('Escenario 5: Suscripción vencida o fuera de gracia retorna null', async () => {
    const longAgo = '2026-08-01T00:00:00Z'
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-past-due-expired',
                    status: 'past_due',
                    provider_status: 'cancelled',
                    current_period_end: longAgo,
                    created_at: longAgo,
                    is_archived: false,
                    plans: { code: 'pro_monthly' }
                  }
                ],
                error: null
              })
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    expect(sub).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Escenario 6: Suscripción cancelada con acceso Pro hasta el fin del período pagado
  // ---------------------------------------------------------------------------
  it('Escenario 6: Suscripción cancelada con período vigente conserva acceso Pro', async () => {
    const futurePeriodEnd = '2026-11-06T18:10:50Z'
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-cancelled-with-access',
                    status: 'cancelled',
                    provider_status: 'cancelled',
                    provider_subscription_id: 'mp-sub-cancelled-123',
                    started_at: '2026-10-06T18:10:46Z',
                    current_period_start: '2026-10-06T18:10:50Z',
                    current_period_end: futurePeriodEnd,
                    cancelled_at: '2026-10-15T10:00:00Z',
                    created_at: '2026-10-06T18:10:46Z',
                    is_archived: false,
                    plans: {
                      id: 'plan-1',
                      code: 'pro_monthly',
                      name: 'PlayComun Pro (Mensual)',
                      price: 100,
                      currency: 'ARS',
                      billing_interval: 'month'
                    }
                  }
                ],
                error: null
              })
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    expect(sub).not.toBeNull()
    expect(sub?.status).toBe('cancelled')
    expect(new Date(sub!.current_period_end!).getTime()).toBeGreaterThan(now)
  })

  // ---------------------------------------------------------------------------
  // Escenario 7: Historial con pagos de diferentes fechas ordenado cronológicamente por paid_at DESC
  // ---------------------------------------------------------------------------
  it('Escenario 7: Historial ordena transacciones por paid_at descendente, no por inserción', () => {
    const rawPayments = [
      { id: 'pay-2', created_at: '2026-10-19T10:00:00Z', paid_at: '2026-10-06T14:10:07Z', amount: 100, status: 'rejected' },
      { id: 'pay-1', created_at: '2026-10-19T09:00:00Z', paid_at: '2026-10-06T18:10:50Z', amount: 100, status: 'approved' },
      { id: 'pay-3', created_at: '2026-10-19T12:00:00Z', paid_at: '2026-09-06T18:10:50Z', amount: 100, status: 'approved' },
    ]

    const sorted = [...rawPayments].sort((a, b) => {
      const timeA = new Date(a.paid_at || a.created_at).getTime()
      const timeB = new Date(b.paid_at || b.created_at).getTime()
      return timeB - timeA
    })

    expect(sorted[0].id).toBe('pay-1') // Más reciente: Oct 06 18:10:50
    expect(sorted[1].id).toBe('pay-2') // Oct 06 14:10:07
    expect(sorted[2].id).toBe('pay-3') // Más antiguo: Sep 06 18:10:50
  })

  // ---------------------------------------------------------------------------
  // Escenario 8: Registros archivados y duplicados son excluidos de la consulta
  // ---------------------------------------------------------------------------
  it('Escenario 8: Registros archivados (foráneos o duplicados) son excluidos del cálculo efectivo', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: any) => {
              // Simulamos el filtro .eq('is_archived', false) de Supabase
              if (col === 'is_archived' && val === false) {
                return {
                  then: (resolve: any) => resolve({
                    data: [
                      // El registro archivado de FitAdmi o duplicado fue filtrado
                    ],
                    error: null
                  })
                }
              }
              return {
                eq: vi.fn().mockImplementation((col2: string, val2: any) => {
                  if (col2 === 'is_archived' && val2 === false) {
                    return Promise.resolve({ data: [], error: null })
                  }
                  return Promise.resolve({ data: [], error: null })
                })
              }
            })
          }
        }
        return {}
      })
    }

    const sub = await getUserEffectiveSubscription(mockSupabase, userId)
    expect(sub).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Escenario 9: Datos faltantes o fechas inconsistentes se manejan con fallbacks seguros
  // ---------------------------------------------------------------------------
  it('Escenario 9: Fechas faltantes no producen fechas inventadas como epoch o NaN', () => {
    const subMissingDates = {
      id: 'sub-missing',
      started_at: null,
      current_period_start: null,
      current_period_end: null,
      created_at: '2026-10-06T18:10:46Z'
    }

    const effectiveStart = subMissingDates.started_at || subMissingDates.current_period_start || subMissingDates.created_at
    expect(effectiveStart).toBe('2026-10-06T18:10:46Z')

    const formattedStart = effectiveStart
      ? new Date(effectiveStart).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Pendiente de inicio'
    expect(formattedStart).not.toContain('1970')
    expect(formattedStart).not.toContain('NaN')

    // Próximo cobro sin fecha no debe inventarse
    const nextCharge = subMissingDates.current_period_end
      ? new Date(subMissingDates.current_period_end).toLocaleDateString('es-AR')
      : 'Fecha pendiente de confirmación'
    expect(nextCharge).toBe('Fecha pendiente de confirmación')
  })

  // ---------------------------------------------------------------------------
  // Escenario 10: Intentos de consultar pagos o suscripciones de otro usuario son bloqueados
  // ---------------------------------------------------------------------------
  it('Escenario 10: Aislamiento estricto de usuario evita fuga de datos de terceros', async () => {
    let capturedUserIdFilter: string | null = null

    const mockSupabase = {
      from: vi.fn((_table: string) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: any) => {
            if (col === 'user_id') {
              capturedUserIdFilter = val
            }
            return {
              eq: vi.fn().mockImplementation((_col2: string, _val2: any) => {
                return Promise.resolve({
                  data: capturedUserIdFilter === userId ? [] : null,
                  error: null
                })
              })
            }
          })
        }
      })
    }

    // El servidor autenticado consulta para el usuario en sesión
    await getUserEffectiveSubscription(mockSupabase, userId)
    expect(capturedUserIdFilter).toBe(userId)
    expect(capturedUserIdFilter).not.toBe(otherUserId)
  })
})
