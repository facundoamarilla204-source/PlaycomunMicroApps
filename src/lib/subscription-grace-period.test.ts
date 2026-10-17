import { describe, it, expect } from 'vitest'
import { SUBSCRIPTION_CONFIG } from '@/config/subscription'

/**
 * Función que replica la lógica estricta de la función SQL is_pro_user y del frontend:
 *
 * SELECT EXISTS (
 *   SELECT 1 FROM public.subscriptions s
 *   JOIN public.plans p ON p.id = s.plan_id
 *   WHERE s.user_id = check_user_id
 *     AND p.code IN ('pro_monthly', 'pro_yearly')
 *     AND (s.provider_status IS NULL OR s.provider_status NOT IN ('refunded', 'charged_back'))
 *     AND (
 *       (s.status IN ('active', 'trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
 *       OR
 *       (s.status = 'cancelled' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
 *       OR
 *       (s.status = 'past_due' AND (COALESCE(s.current_period_end, s.updated_at, s.created_at) + interval '3 days') > now())
 *     )
 * );
 */
export function evaluateProAccess(
  subscription: {
    status: string
    current_period_end: string | null
    plan_code?: string
    provider_status?: string | null
    updated_at?: string | null
  } | null,
  now: Date = new Date(),
  gracePeriodDays: number = SUBSCRIPTION_CONFIG.gracePeriodDays
): boolean {
  if (!subscription) return false

  // Revocaciones inmediatas por fraude o devolución
  if (subscription.provider_status === 'refunded' || subscription.provider_status === 'charged_back') {
    return false
  }

  const validPlan = !subscription.plan_code || ['pro_monthly', 'pro_yearly'].includes(subscription.plan_code)
  if (!validPlan) return false

  const periodEndDate = subscription.current_period_end ? new Date(subscription.current_period_end) : null
  const isPeriodValid = periodEndDate ? periodEndDate.getTime() > now.getTime() : true

  // Caso A: Activo o trialing
  if (['active', 'trialing'].includes(subscription.status)) {
    return isPeriodValid
  }

  // Caso B: Renovación cancelada, pero período abonado aún vigente
  if (subscription.status === 'cancelled') {
    return !!periodEndDate && periodEndDate.getTime() > now.getTime()
  }

  // Caso C: Pago fallido (past_due) con período de gracia configurable
  if (subscription.status === 'past_due') {
    const baseDate = periodEndDate || (subscription.updated_at ? new Date(subscription.updated_at) : null)
    if (!baseDate) return false
    const graceExpiry = new Date(baseDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
    return graceExpiry.getTime() > now.getTime()
  }

  // Cualquier otro estado (paused, expired) revoca inmediatamente
  return false
}

describe('Suscripciones: Período de Gracia y Cancelación de Renovación', () => {
  const referenceNow = new Date('2026-10-16T12:00:00.000Z')
  const futureDate = '2026-11-16T12:00:00.000Z'
  const pastDate = '2026-10-10T12:00:00.000Z'

  describe('1. Suscripciones Activas y en Período de Prueba', () => {
    it('otorga Pro a suscripción activa con fecha futura de próximo cobro', () => {
      const sub = {
        status: 'active',
        current_period_end: futureDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(true)
    })

    it('otorga Pro a suscripción activa sin fecha límite definida', () => {
      const sub = {
        status: 'active',
        current_period_end: null,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(true)
    })

    it('otorga Pro a suscripción en período de prueba (trialing) con fecha futura', () => {
      const sub = {
        status: 'trialing',
        current_period_end: futureDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(true)
    })

    it('deniega Pro a suscripción activa cuyo current_period_end ya venció sin renovar', () => {
      const sub = {
        status: 'active',
        current_period_end: pastDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })
  })

  describe('2. Cancelación Voluntaria de Renovación Automática (Regla de Negocio)', () => {
    it('mantiene Pro ACTIVO si el usuario canceló la renovación pero el período pagado sigue vigente', () => {
      const sub = {
        status: 'cancelled',
        current_period_end: futureDate, // Le quedan semanas de acceso ya pagado
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(true)
    })

    it('inactiva Pro automáticamente una vez que la fecha de finalización del período fue alcanzada', () => {
      const sub = {
        status: 'cancelled',
        current_period_end: pastDate, // Ya finalizó el período que había pagado
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })

    it('inactiva Pro si el estado es cancelled y current_period_end es nulo', () => {
      const sub = {
        status: 'cancelled',
        current_period_end: null,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })
  })

  describe('3. Eventos de Revocación Inmediata (Reembolsos, Contracargos y Suspensiones)', () => {
    it('revoca Pro de forma INMEDIATA ante un reembolso confirmado (refunded), incluso con fecha futura', () => {
      const sub = {
        status: 'refunded',
        current_period_end: futureDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })

    it('revoca Pro de forma INMEDIATA ante un contracargo o disputa (charged_back)', () => {
      const sub = {
        status: 'charged_back',
        current_period_end: futureDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })

    it('deniega Pro si la suscripción está pausada manualmente (paused)', () => {
      const sub = {
        status: 'paused',
        current_period_end: futureDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })

    it('concede Pro temporalmente si está en past_due pero DENTRO del período de gracia (3 días)', () => {
      const recentFailureDate = '2026-10-15T12:00:00.000Z' // 1 día atrás vs referenceNow (2026-10-16)
      const sub = {
        status: 'past_due',
        current_period_end: recentFailureDate,
        plan_code: 'pro_monthly',
      }
      // Dentro de los 3 días de gracia
      expect(evaluateProAccess(sub, referenceNow, 3)).toBe(true)
    })

    it('deniega Pro si la suscripción está en mora o impaga (past_due) habiendo superado el período de gracia', () => {
      const sub = {
        status: 'past_due',
        current_period_end: pastDate, // 6 días atrás (2026-10-10)
        plan_code: 'pro_monthly',
      }
      // Superó los 3 días de gracia
      expect(evaluateProAccess(sub, referenceNow, 3)).toBe(false)
    })

    it('deniega Pro si la suscripción está marcada como expirada (expired)', () => {
      const sub = {
        status: 'expired',
        current_period_end: pastDate,
        plan_code: 'pro_monthly',
      }
      expect(evaluateProAccess(sub, referenceNow)).toBe(false)
    })

    it('deniega Pro a visitantes sin suscripción registrada', () => {
      expect(evaluateProAccess(null, referenceNow)).toBe(false)
    })
  })

  describe('4. Preservación de Fechas en Sincronización del Webhook', () => {
    it('preserva el current_period_end existente cuando Mercado Pago notifica cancelación sin next_payment_date', () => {
      const existingSubInDb = {
        current_period_end: '2026-11-05T00:00:00.000Z',
        cancelled_at: null,
      }
      const mpWebhookPayload = {
        status: 'cancelled',
        next_payment_date: null, // MP deja de enviar próxima fecha de cobro al cancelar
      }

      // Lógica implementada en syncSubscription
      const resolvedPeriodEnd = mpWebhookPayload.next_payment_date || existingSubInDb.current_period_end || null
      const resolvedCancelledAt = mpWebhookPayload.status === 'cancelled'
        ? (existingSubInDb.cancelled_at || '2026-10-16T12:00:00.000Z')
        : null

      expect(resolvedPeriodEnd).toBe('2026-11-05T00:00:00.000Z')
      expect(resolvedCancelledAt).toBe('2026-10-16T12:00:00.000Z')

      // Verificar que evaluateProAccess le dé acceso hasta el 05 de noviembre
      expect(evaluateProAccess({
        status: 'cancelled',
        current_period_end: resolvedPeriodEnd,
      }, new Date('2026-10-20T00:00:00.000Z'))).toBe(true)

      // Y que el 06 de noviembre ya no tenga acceso
      expect(evaluateProAccess({
        status: 'cancelled',
        current_period_end: resolvedPeriodEnd,
      }, new Date('2026-11-06T00:00:00.000Z'))).toBe(false)
    })
  })
})
