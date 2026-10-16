import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  syncSubscriptionFromMp,
  syncPaymentFromMp,
  syncAuthorizedPaymentFromMp,
  syncUserSubscriptions,
  verifyMercadoPagoSignature
} from './subscription-sync'
import crypto from 'crypto'

describe('Ciclo Integral de Suscripciones y Pagos Recurrentes (Mercado Pago + Supabase)', () => {
  let mockAdminSupabase: any
  const userId = 'usr-12345678-aaaa-bbbb-cccc-111122223333'
  const planId = 'pln-pro-monthly-uuid'

  beforeEach(() => {
    vi.restoreAllMocks()

    mockAdminSupabase = {
      from: vi.fn((table: string) => {
        const query: any = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId, price: 100, currency: 'ARS' }, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }

        if (table === 'plans') {
          query.single = vi.fn().mockResolvedValue({
            data: { id: planId, price: 100, currency: 'ARS', code: 'pro_monthly' },
            error: null
          })
        }
        return query
      }),
      rpc: vi.fn((fnName: string) => {
        if (fnName === 'is_pro_user') {
          return Promise.resolve({ data: true, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
    }
  })

  const mockMpResponse = (data: any, status = 200) => {
    return vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
      } as Response)
    })
  }

  // Escenario 1: Usuario sin Pro completa contratación y se crea suscripción en Supabase
  it('Escenario 1: Usuario sin Pro completa suscripción y se crea registro activo en Supabase', async () => {
    const mpSubId = 'mp-sub-001'
    mockMpResponse({
      id: mpSubId,
      status: 'authorized',
      external_reference: userId,
      auto_recurring: { frequency: 1, currency_id: 'ARS' },
      date_created: '2026-10-16T12:00:00Z',
      next_payment_date: '2026-11-16T12:00:00Z',
      summarized: { charged_quantity: 1, last_charged_amount: 100, last_charged_date: '2026-10-16T12:00:00Z' }
    })

    const insertSubMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'local-sub-001' }, error: null })
      })
    })

    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: insertSubMock
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null })
        }
      }
      return {}
    })

    const res = await syncSubscriptionFromMp(mockAdminSupabase, mpSubId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('active')
    expect(insertSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        status: 'active',
        provider_status: 'authorized',
        provider_subscription_id: mpSubId,
      })
    )
  })

  // Escenario 2: Pago aprobado por MP actualiza Supabase y confirma Pro activo
  it('Escenario 2: Notificación de pago aprobado actualiza el pago y confirma Pro activo', async () => {
    const paymentId = 'mp-pay-999'
    const mpSubId = 'mp-sub-001'

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = String(input)
      if (url.includes('/v1/payments/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: paymentId,
            status: 'approved',
            transaction_amount: 100,
            currency_id: 'ARS',
            payment_method_id: 'visa',
            point_of_interaction: { transaction_data: { subscription_id: mpSubId } },
            external_reference: userId,
            date_approved: '2026-10-16T12:00:00Z'
          }),
          text: () => Promise.resolve(''),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: mpSubId,
          status: 'authorized',
          external_reference: userId,
          auto_recurring: { frequency: 1 },
          next_payment_date: '2026-11-16T12:00:00Z',
          summarized: { charged_quantity: 1, last_charged_amount: 100 }
        }),
        text: () => Promise.resolve(''),
      } as Response)
    })

    const updatePaymentMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-sub-001', user_id: userId }, error: null }),
          update: vi.fn().mockReturnThis()
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-pay-001' }, error: null }),
          update: updatePaymentMock
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      return {}
    })

    const res = await syncPaymentFromMp(mockAdminSupabase, paymentId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('approved')
    expect(updatePaymentMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }))
  })

  // Escenario 3: Pago pendiente mantiene acceso sujeto al estado previo
  it('Escenario 3: Pago pendiente se registra como pending sin marcar la suscripción como activa de inmediato', async () => {
    const paymentId = 'mp-pay-pending'
    mockMpResponse({
      id: paymentId,
      status: 'pending',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: userId,
    })

    const updatePaymentMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-sub-001', user_id: userId }, error: null }),
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-pay-001' }, error: null }),
          update: updatePaymentMock
        }
      }
      return {}
    })

    const res = await syncPaymentFromMp(mockAdminSupabase, paymentId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('pending')
    expect(updatePaymentMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }))
  })

  // Escenario 4: Pago rechazado marca past_due y no activa Pro
  it('Escenario 4: Pago rechazado actualiza suscripción a past_due', async () => {
    const paymentId = 'mp-pay-rejected'
    mockMpResponse({
      id: paymentId,
      status: 'rejected',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: userId,
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-sub-001', user_id: userId }, error: null }),
          update: updateSubMock
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-pay-001' }, error: null }),
          update: vi.fn().mockReturnThis()
        }
      }
      return {}
    })

    const res = await syncPaymentFromMp(mockAdminSupabase, paymentId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('rejected')
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'past_due', provider_status: 'rejected' })
    )
  })

  // Escenario 5: Renovación mensual automática aprobada (subscription_authorized_payment)
  it('Escenario 5: Factura de renovación mensual recurrente exitosa extiende el período y mantiene Pro activo', async () => {
    const invoiceId = 'auth-inv-12345'
    const mpSubId = 'mp-sub-renewal'

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = String(input)
      if (url.includes('/authorized_payments/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: invoiceId,
            preapproval_id: mpSubId,
            payment: { id: 'pay-renewal-99' }
          }),
          text: () => Promise.resolve(''),
        } as Response)
      }
      if (url.includes('/preapproval/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: mpSubId,
            status: 'authorized',
            external_reference: userId,
            auto_recurring: { frequency: 1 },
            next_payment_date: '2026-12-16T12:00:00Z',
            summarized: { charged_quantity: 2, last_charged_amount: 100, last_charged_date: '2026-11-16T12:00:00Z' }
          }),
          text: () => Promise.resolve(''),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: 'pay-renewal-99',
          status: 'approved',
          transaction_amount: 100,
          currency_id: 'ARS',
          external_reference: userId,
          point_of_interaction: { transaction_data: { subscription_id: mpSubId } }
        }),
        text: () => Promise.resolve(''),
      } as Response)
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'local-sub-001', current_period_end: '2026-11-16T12:00:00Z' },
            error: null
          }),
          update: updateSubMock
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null })
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      return {}
    })

    const res = await syncAuthorizedPaymentFromMp(mockAdminSupabase, invoiceId)
    expect(res.success).toBe(true)
    expect(res.preapprovalId).toBe(mpSubId)
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        current_period_end: '2026-12-16T12:00:00Z'
      })
    )
  })

  // Escenario 6: Renovación fallida no amplía el período
  it('Escenario 6: Rechazo de pago en renovación no amplía fecha de finalización', async () => {
    const paymentId = 'pay-failed-renewal'
    mockMpResponse({
      id: paymentId,
      status: 'rejected',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: userId
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'local-sub-001', user_id: userId, current_period_end: '2026-10-16T12:00:00Z' },
            error: null
          }),
          update: updateSubMock
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null })
        }
      }
      return {}
    })

    await syncPaymentFromMp(mockAdminSupabase, paymentId)
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'past_due',
        provider_status: 'rejected'
      })
    )
    expect(updateSubMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ current_period_end: expect.any(String) })
    )
  })

  // Escenario 7: Cancelación voluntaria de la renovación preserva current_period_end
  it('Escenario 7: Cancelación de renovación en MP preserva current_period_end existente', async () => {
    const mpSubId = 'mp-sub-cancelled'
    const paidUntil = '2026-11-16T12:00:00Z'

    mockMpResponse({
      id: mpSubId,
      status: 'cancelled',
      external_reference: userId,
      auto_recurring: { frequency: 1 },
      next_payment_date: null,
      summarized: { charged_quantity: 1, last_charged_amount: 100 }
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'local-sub-001', current_period_end: paidUntil, cancelled_at: null },
            error: null
          }),
          update: updateSubMock
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
        }
      }
      return {}
    })

    const res = await syncSubscriptionFromMp(mockAdminSupabase, mpSubId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('cancelled')
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled',
        current_period_end: paidUntil,
        cancelled_at: expect.any(String)
      })
    )
  })

  // Escenario 8: Reembolso o contracargo revoca Pro inmediatamente
  it('Escenario 8: Reembolso o contracargo confirmado revoca acceso Pro de inmediato sin esperar el final del período', async () => {
    const paymentId = 'pay-refunded'
    mockMpResponse({
      id: paymentId,
      status: 'refunded',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: userId
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'local-sub-001', user_id: userId, current_period_end: '2026-11-16T12:00:00Z' },
            error: null
          }),
          update: updateSubMock
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'local-pay-001' }, error: null }),
          update: vi.fn().mockReturnThis()
        }
      }
      return {}
    })

    const res = await syncPaymentFromMp(mockAdminSupabase, paymentId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('refunded')
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled',
        provider_status: 'refunded',
        current_period_end: expect.any(String),
      })
    )
  })

  // Escenario 9: Reactivación de una suscripción restaura Pro
  it('Escenario 9: Reactivación en MP actualiza status a active y limpia cancelled_at', async () => {
    const mpSubId = 'mp-sub-reactivated'
    mockMpResponse({
      id: mpSubId,
      status: 'authorized',
      external_reference: userId,
      auto_recurring: { frequency: 1 },
      next_payment_date: '2026-12-01T12:00:00Z',
      summarized: { charged_quantity: 2, last_charged_amount: 100 }
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'local-sub-001', status: 'cancelled', cancelled_at: '2026-10-10T00:00:00Z' },
            error: null
          }),
          update: updateSubMock
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
        }
      }
      return {}
    })

    const res = await syncSubscriptionFromMp(mockAdminSupabase, mpSubId)
    expect(res.success).toBe(true)
    expect(res.status).toBe('active')
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        cancelled_at: null
      })
    )
  })

  // Escenario 10: Idempotencia en notificaciones duplicadas
  it('Escenario 10: Eventos duplicados no generan dobles cobros ni múltiples suscripciones', async () => {
    const mpSubId = 'mp-sub-idempotent'
    mockMpResponse({
      id: mpSubId,
      status: 'authorized',
      external_reference: userId,
      auto_recurring: { frequency: 1 },
      next_payment_date: '2026-11-16T12:00:00Z',
      summarized: { charged_quantity: 1, last_charged_amount: 100 }
    })

    const insertPaymentMock = vi.fn()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'sub-existing' }, error: null }),
          update: vi.fn().mockReturnThis()
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'payment-already-exists' }, error: null }),
          insert: insertPaymentMock
        }
      }
      return {}
    })

    await syncSubscriptionFromMp(mockAdminSupabase, mpSubId)
    expect(insertPaymentMock).not.toHaveBeenCalled()
  })

  // Escenario 11: Verificación de Firma Webhook HMAC con tiempo constante
  it('Escenario 11: Verificación estricta de firma HMAC rechaza manipulaciones y acepta firmas válidas', () => {
    const secret = 'mi_secreto_de_webhook_123'
    process.env.MERCADOPAGO_WEBHOOK_SECRET = secret

    const dataId = '123456789'
    const reqId = 'req-abc-987'
    const ts = '1729080000'
    const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`
    const validV1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

    const validHeaders = {
      'x-signature': `ts=${ts},v1=${validV1}`,
      'x-request-id': reqId
    }
    const searchParams = new URLSearchParams({ 'data.id': dataId })

    // Firma válida
    expect(verifyMercadoPagoSignature(validHeaders, searchParams)).toBe(true)

    // Firma con manifest alterado (otro dataId)
    const invalidSearchParams = new URLSearchParams({ 'data.id': '999999999' })
    expect(verifyMercadoPagoSignature(validHeaders, invalidSearchParams)).toBe(false)

    // Firma con secret alterado
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'otro_secreto_diferente'
    expect(verifyMercadoPagoSignature(validHeaders, searchParams)).toBe(false)

    delete process.env.MERCADOPAGO_WEBHOOK_SECRET
  })

  // Escenario 12: Usuario que regresa de Mercado Pago obtiene estado actualizado mediante syncUserSubscriptions
  it('Escenario 12: syncUserSubscriptions reconcilia con MP y devuelve estado Pro inmediato', async () => {
    mockMpResponse({
      id: 'preapproval-123',
      status: 'authorized',
      external_reference: userId,
      auto_recurring: { frequency: 1 },
      next_payment_date: '2026-11-16T12:00:00Z',
      summarized: { charged_quantity: 1, last_charged_amount: 100 }
    })

    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'sub-1' }, error: null }),
          update: vi.fn().mockReturnThis()
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
        }
      }
      return {}
    })

    mockAdminSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })

    const syncRes = await syncUserSubscriptions(mockAdminSupabase, userId, 'preapproval-123')
    expect(syncRes.synced).toBe(true)
    expect(syncRes.isPro).toBe(true)
  })

  // Escenario 13: Recuperación tras fallo de webhook mediante búsqueda por external_reference
  it('Escenario 13: Si el webhook no llegó, la sincronización bajo demanda recupera la suscripción activa por external_reference', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = String(input)
      if (url.includes('/preapproval/search')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            results: [
              {
                id: 'preapproval-missed-webhook',
                status: 'authorized',
                external_reference: userId,
                auto_recurring: { frequency: 1 },
                next_payment_date: '2026-11-16T12:00:00Z',
                summarized: { charged_quantity: 1, last_charged_amount: 100 }
              }
            ]
          }),
          text: () => Promise.resolve(''),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: 'preapproval-missed-webhook',
          status: 'authorized',
          external_reference: userId,
          auto_recurring: { frequency: 1 },
          next_payment_date: '2026-11-16T12:00:00Z',
          summarized: { charged_quantity: 1, last_charged_amount: 100 }
        }),
        text: () => Promise.resolve(''),
      } as Response)
    })

    const updateSubMock = vi.fn().mockReturnThis()
    mockAdminSupabase.from = vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'sub-existing' }, error: null }),
          update: updateSubMock
        }
      }
      if (table === 'plans') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: planId }, error: null })
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
        }
      }
      return {}
    })

    const result = await syncUserSubscriptions(mockAdminSupabase, userId)
    expect(result.synced).toBe(true)
    expect(result.isPro).toBe(true)
    expect(updateSubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        provider_status: 'authorized'
      })
    )
  })
})
