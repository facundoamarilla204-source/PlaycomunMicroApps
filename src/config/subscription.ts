/**
 * Configuración central del ciclo de vida de suscripciones y políticas de acceso Pro.
 */

export const SUBSCRIPTION_CONFIG = {
  /**
   * Período de gracia corto y configurable (en días) para pagos fallidos (estado past_due).
   * Permite reintentos automáticos del proveedor sin degradar inmediatamente la operatoria del usuario.
   * Configurable vía variable de entorno SUBSCRIPTION_GRACE_PERIOD_DAYS. Valor por defecto: 3 días.
   */
  gracePeriodDays: Number(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS) || 3,
} as const

export interface SubscriptionStatusDetail {
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'cancelled' | 'expired'
  title: string
  badgeLabel: string
  badgeColor: string
  description: string
  proAccess: boolean
  gracePeriodApplies: boolean
  businessEffect: string
}

/**
 * Catálogo canónico de estados de suscripción del sistema y su efecto de negocio.
 */
export const SUBSCRIPTION_STATUS_CATALOG: Record<string, SubscriptionStatusDetail> = {
  active: {
    status: 'active',
    title: 'Suscripción Activa',
    badgeLabel: 'Activa con renovación automática',
    badgeColor: 'emerald',
    description: 'Suscripción al día y renovándose periódicamente en Mercado Pago.',
    proAccess: true,
    gracePeriodApplies: false,
    businessEffect: 'Acceso total e irrestricto a todas las funcionalidades Pro.',
  },
  trialing: {
    status: 'trialing',
    title: 'En Prueba / Verificación',
    badgeLabel: 'En prueba / Verificación',
    badgeColor: 'blue',
    description: 'Período promocional de prueba o verificación inicial de cobro en trámite.',
    proAccess: true,
    gracePeriodApplies: false,
    businessEffect: 'Acceso Pro completo mientras el período de prueba esté vigente.',
  },
  past_due: {
    status: 'past_due',
    title: 'Pago Fallido / En Mora',
    badgeLabel: 'Pago pendiente de cobro',
    badgeColor: 'red',
    description: 'El último débito automático recurrente falló o fue rechazado por el banco/tarjeta.',
    proAccess: true, // Condicionado al período de gracia
    gracePeriodApplies: true,
    businessEffect: `Aplica período de gracia configurable (${SUBSCRIPTION_CONFIG.gracePeriodDays} días). Si se encuentra dentro de la gracia desde el vencimiento, mantiene Pro temporalmente con alertas en panel. Superada la gracia sin regularizar, se suspende el acceso Pro.`,
  },
  paused: {
    status: 'paused',
    title: 'Suscripción Pausada',
    badgeLabel: 'Pausada',
    badgeColor: 'amber',
    description: 'Suscripción detenida temporalmente por solicitud del usuario o decisión administrativa.',
    proAccess: false,
    gracePeriodApplies: false,
    businessEffect: 'Revocación inmediata del acceso Pro mientras permanezca pausada. Los datos creados se conservan protegidos.',
  },
  cancelled: {
    status: 'cancelled',
    title: 'Renovación Cancelada',
    badgeLabel: 'Renovación cancelada (Acceso vigente)',
    badgeColor: 'amber',
    description: 'El usuario desactivó la renovación automática periódica.',
    proAccess: true, // Hasta current_period_end
    gracePeriodApplies: false,
    businessEffect: 'Mantiene acceso Pro irrestricto hasta agotar la fecha abonada (current_period_end). Luego pasa a inactiva sin cobros posteriores.',
  },
  expired: {
    status: 'expired',
    title: 'Suscripción Expirada',
    badgeLabel: 'Suscripción finalizada',
    badgeColor: 'slate',
    description: 'El período pagado y eventual gracia han finalizado por completo.',
    proAccess: false,
    gracePeriodApplies: false,
    businessEffect: 'Sin acceso a funciones Pro. Todos los datos (documentos, recetas, QRs, listas) permanecen preservados intactos para cuando decida reactivar.',
  },
}

/**
 * Determina si una suscripción en past_due se encuentra dentro del período de gracia permitido.
 */
export function isWithinGracePeriod(
  periodEnd: string | Date | null | undefined,
  gracePeriodDays: number = SUBSCRIPTION_CONFIG.gracePeriodDays,
  now: Date = new Date()
): boolean {
  if (!periodEnd) return false
  const endDate = typeof periodEnd === 'string' ? new Date(periodEnd) : periodEnd
  if (isNaN(endDate.getTime())) return false

  const graceExpiry = new Date(endDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
  return graceExpiry.getTime() > now.getTime()
}
