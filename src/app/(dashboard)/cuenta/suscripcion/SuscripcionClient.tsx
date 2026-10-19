'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription, syncCurrentUserSubscription } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  Clock, 
  RotateCw, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Loader2, 
  ArrowRight 
} from 'lucide-react'
import { PlanComparison } from '@/components/subscription/PlanComparison'

// ---------------------------------------------------------------------------
// Success Banner: confirmación tras checkout
// ---------------------------------------------------------------------------
function SuccessBanner({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 text-emerald-900 shadow-xs flex items-start justify-between gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-emerald-950">Pago procesado correctamente</h2>
          <p className="text-xs sm:text-sm text-emerald-800 mt-0.5 leading-relaxed">
            Tu suscripción a PlayComun Pro está activa. Todas las herramientas y funciones avanzadas ya están disponibles en tu cuenta.
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-emerald-700/60 hover:text-emerald-900 transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Verification Banner: sondeo tras retorno de MP
// ---------------------------------------------------------------------------
function VerificationBanner({ onRetry, isSyncing }: { onRetry: () => void; isSyncing: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-purple-50 border border-purple-200/80 rounded-2xl p-5 text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <RotateCw className={`w-4 h-4 text-purple-700 flex-shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
        <div>
          <p className="font-bold text-sm text-purple-950">Sincronizando estado con Mercado Pago</p>
          <p className="text-xs text-purple-700 mt-0.5">
            Aguardando la confirmación final de la transacción bancaria.
          </p>
        </div>
      </div>
      <button
        onClick={onRetry}
        disabled={isSyncing}
        className="px-3.5 py-1.5 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Verificando...' : 'Verificar estado'}
      </button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
function StatusBadge({ 
  status, 
  providerStatus,
  isPeriodActive = false,
  isPending = false
}: { 
  status: string
  providerStatus?: string
  isPeriodActive?: boolean
  isPending?: boolean
}) {
  if (providerStatus === 'refunded' || providerStatus === 'charged_back') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Acceso revocado ({providerStatus === 'refunded' ? 'Reembolso' : 'Contracargo'})
      </span>
    )
  }

  if (status === 'cancelled' && isPeriodActive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Renovación cancelada (Acceso Pro vigente)
      </span>
    )
  }

  if (isPending || status === 'pending' || (status === 'trialing' && providerStatus === 'pending')) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Pendiente de confirmación
      </span>
    )
  }

  const map: Record<string, { label: string; className: string; dot: string }> = {
    active: { label: 'Activa con renovación automática', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
    trialing: { label: 'Prueba promocional activa', className: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
    paused: { label: 'Suscripción en pausa', className: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    cancelled: { label: 'Suscripción finalizada', className: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    past_due: { label: 'Pago pendiente (Período de gracia)', className: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    expired: { label: 'Suscripción finalizada', className: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  }
  const config = map[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function renderComprobanteId(providerPaymentId: string | null | undefined) {
  if (!providerPaymentId) {
    return <span className="text-slate-400 font-mono text-xs">—</span>
  }
  if (providerPaymentId.startsWith('sub_') || providerPaymentId.startsWith('preapproval_')) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
        title={`ID de suscripción: ${providerPaymentId}`}
      >
        Ref. suscripción
      </span>
    )
  }
  return (
    <span className="text-xs text-slate-700 font-mono font-semibold">
      #{providerPaymentId}
    </span>
  )
}

function planDisplayName(planCode: string | undefined, planName: string | undefined): string {
  if (planCode === 'pro_yearly') return 'PlayComun Pro (Anual)'
  if (planCode === 'pro_monthly') return 'PlayComun Pro (Mensual)'
  return planName || 'PlayComun Pro'
}

function billingLabel(planCode: string | undefined): string {
  if (planCode === 'pro_yearly') return 'Facturación anual recurrente'
  return 'Facturación mensual recurrente'
}

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------
export function SuscripcionClient({
  subscription,
  paymentMethods,
  payments,
  isPro,
  showSuccessBanner = false,
  incomingPreapprovalId,
  priceMensual = 5900,
  priceAnual = 59000,
}: {
  subscription: any
  paymentMethods: any[]
  payments: any[]
  userEmail?: string
  isPro: boolean
  showSuccessBanner?: boolean
  incomingPreapprovalId?: string
  priceMensual?: number
  priceAnual?: number
}) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showComparison, setShowComparison] = useState(!isPro)
  const [error, setError] = useState<string | null>(null)
  const [bannerVisible, setBannerVisible] = useState(showSuccessBanner && isPro)
  const [isVerifying, setIsVerifying] = useState(showSuccessBanner && !isPro)
  const [syncAttempts, setSyncAttempts] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (showSuccessBanner) {
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('preapproval_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [showSuccessBanner])

  useEffect(() => {
    if (isVerifying && syncAttempts < 4) {
      pollingRef.current = setTimeout(async () => {
        try {
          const res = await syncCurrentUserSubscription(incomingPreapprovalId)
          if (res?.isPro) {
            setIsVerifying(false)
            setBannerVisible(true)
            router.refresh()
          } else {
            setSyncAttempts((prev) => prev + 1)
          }
        } catch (e) {
          console.error('[polling sync error]:', e)
          setSyncAttempts((prev) => prev + 1)
        }
      }, 2500)
    } else if (syncAttempts >= 4) {
      setIsVerifying(false)
    }

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [isVerifying, syncAttempts, incomingPreapprovalId, router])

  const handleManualSync = async () => {
    setIsVerifying(true)
    setError(null)
    try {
      const res = await syncCurrentUserSubscription(incomingPreapprovalId)
      if (res?.isPro) {
        setBannerVisible(true)
      }
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'No fue posible sincronizar el estado con Mercado Pago.')
    } finally {
      setIsVerifying(false)
    }
  }

  const isPeriodActive = subscription?.current_period_end
    ? new Date(subscription.current_period_end).getTime() > Date.now()
    : false

  const isCancelledWithAccess = subscription?.status === 'cancelled' && isPeriodActive
  const isCancelled = subscription?.status === 'cancelled'
  const isExpired = subscription?.status === 'expired' || (subscription?.status === 'cancelled' && !isPeriodActive)
  const isPaused = subscription?.status === 'paused'
  const isPastDue = subscription?.status === 'past_due'
  const isPending =
    subscription?.status === 'pending' ||
    (subscription?.status === 'trialing' && !subscription?.trial_end_at && subscription?.provider_status === 'pending')
  const isRevoked = subscription?.provider_status === 'refunded' || subscription?.provider_status === 'charged_back'
  const hasSubscription = !!subscription && (isPro || isCancelledWithAccess || isPastDue || isPending)

  const subscriptionStartDate = subscription?.started_at || subscription?.current_period_start || subscription?.created_at

  const sortedPayments = payments ? [...payments].sort((a, b) => {
    const timeA = new Date(a.paid_at || a.created_at || 0).getTime()
    const timeB = new Date(b.paid_at || b.created_at || 0).getTime()
    return timeB - timeA
  }) : []

  const mainPaymentMethod = paymentMethods?.find(pm => pm.is_default) || paymentMethods?.[0]

  const confirmCancel = async () => {
    if (!subscription) return
    setIsCancelling(true)
    setError(null)
    try {
      const result = await cancelSubscription(subscription.id)
      if (result.error) {
        setError(result.error)
      } else {
        setShowCancelModal(false)
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error al cancelar la renovación automática.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Mensaje de error controlado */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs sm:text-sm font-medium border border-red-200 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner de Verificación Activa tras Checkout */}
      <AnimatePresence>
        {isVerifying && (
          <VerificationBanner onRetry={handleManualSync} isSyncing={isVerifying} />
        )}
      </AnimatePresence>

      {/* Banner de Pago Confirmado */}
      <AnimatePresence>
        {bannerVisible && (
          <SuccessBanner onClose={() => setBannerVisible(false)} />
        )}
      </AnimatePresence>

      {/* Tarjeta de Detalle del Plan Actual */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {hasSubscription ? (
          <div className="space-y-8">
            {/* Encabezado: Título, estado y precio */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge 
                    status={subscription.status} 
                    providerStatus={subscription.provider_status}
                    isPeriodActive={isPeriodActive}
                    isPending={isPending}
                  />
                  <button
                    onClick={handleManualSync}
                    disabled={isVerifying}
                    title="Actualizar estado con Mercado Pago"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {planDisplayName(subscription.plans?.code, subscription.plans?.name)}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {billingLabel(subscription.plans?.code)}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ${(Number(subscription.plans?.price) || 0).toLocaleString('es-AR')}{' '}
                  <span className="text-xs font-semibold text-slate-500">{subscription.plans?.currency || 'ARS'}</span>
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Precio confirmado</div>
              </div>
            </div>

            {/* Grid informativo: Fechas del ciclo y Medio de pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Bloque 1: Período y Fechas */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ciclo de facturación</span>
                </h3>

                <dl className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Inicio de suscripción</dt>
                    <dd className="font-semibold text-slate-800">
                      {subscriptionStartDate
                        ? new Date(subscriptionStartDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Pendiente de inicio'}
                    </dd>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Período actual</dt>
                    <dd className="font-semibold text-slate-800">
                      {subscription.current_period_start && subscription.current_period_end
                        ? `${new Date(subscription.current_period_start).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — ${new Date(subscription.current_period_end).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'En curso'}
                    </dd>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Próximo cobro previsto</dt>
                    <dd className={`font-semibold ${
                      isPastDue ? 'text-red-600' :
                      isCancelled || isCancelledWithAccess ? 'text-slate-500' :
                      'text-slate-900'
                    }`}>
                      {isCancelled || isCancelledWithAccess ? (
                        'Sin cobro programado'
                      ) : isPastDue ? (
                        'Reintento pendiente por Mercado Pago'
                      ) : isPending ? (
                        'Pendiente de confirmación inicial'
                      ) : subscription.status === 'active' && subscription.current_period_end && new Date(subscription.current_period_end).getTime() > Date.now() ? (
                        new Date(subscription.current_period_end).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                      ) : (
                        'Fecha en confirmación'
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Renovación automática</dt>
                    <dd className="font-semibold text-slate-800">
                      {isCancelled || isCancelledWithAccess ? 'Desactivada' : isPastDue ? 'Pausada' : 'Activa'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Bloque 2: Medio de pago */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                  <span>Medio de pago</span>
                </h3>

                {mainPaymentMethod ? (
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-700 uppercase shadow-2xs">
                        {mainPaymentMethod.brand || 'Tarjeta'}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800">
                        {mainPaymentMethod.last_four_digits
                          ? `•••• ${mainPaymentMethod.last_four_digits}`
                          : 'Tarjeta de crédito / débito'}
                        {mainPaymentMethod.expiration_month && mainPaymentMethod.expiration_year && (
                          <span className="text-slate-400 font-normal ml-2 text-xs">
                            ({String(mainPaymentMethod.expiration_month).padStart(2, '0')}/{mainPaymentMethod.expiration_year})
                          </span>
                        )}
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-slate-600 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Débito recurrente gestionado en Mercado Pago</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50/60 rounded-xl text-xs text-slate-500 border border-slate-100 leading-relaxed">
                  Podés modificar la tarjeta asociada ingresando a tu cuenta de Mercado Pago o reactivando el plan con tu nueva tarjeta al finalizar el período actual.
                </div>
              </div>

            </div>

            {/* Aviso: Cancelada pero con período vigente */}
            {isCancelledWithAccess && (
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs sm:text-sm text-amber-950 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Tu acceso Pro continúa vigente</p>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Mantendrás acceso completo a las funciones Pro hasta el{' '}
                    <strong>
                      {subscription.current_period_end &&
                        new Date(subscription.current_period_end).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                    </strong>
                    . No se debitarán nuevos períodos en tu medio de pago.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso: Período de gracia */}
            {isPastDue && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-950 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Cobro pendiente (Período de gracia)</p>
                  <p className="text-xs text-red-900 leading-relaxed">
                    Mercado Pago no pudo realizar el débito automático. Tenés un período de gracia de 3 días con acceso Pro completo mientras el sistema reintenta el cobro.
                  </p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100">
              {['active', 'trialing'].includes(subscription.status) && !isPastDue && !isRevoked && (
                <>
                  <button
                    onClick={() => router.push('/planes')}
                    className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors text-xs"
                  >
                    Cambiar modalidad de plan
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors text-xs border border-red-200"
                  >
                    Cancelar renovación automática
                  </button>
                </>
              )}
              {isCancelledWithAccess && (
                <button
                  onClick={() => router.push('/planes')}
                  className="px-5 py-2.5 rounded-xl text-white bg-slate-900 hover:bg-slate-800 font-semibold transition-colors text-xs sm:text-sm"
                >
                  Reactivar renovación automática
                </button>
              )}
              {(isExpired || isPaused || isPastDue || isRevoked) && (
                <button
                  onClick={() => router.push('/planes')}
                  className="px-5 py-2.5 rounded-xl text-white bg-slate-900 hover:bg-slate-800 font-semibold transition-colors text-xs sm:text-sm"
                >
                  Reactivar suscripción Pro
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Estado Gratuito Claro y Auténtico */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Plan actual
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Plan Gratuito
                </h2>
                <p className="text-xs text-slate-500 mt-1">Acceso libre sin costo mensual</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  $0 <span className="text-xs font-semibold text-slate-500">ARS</span>
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Sin vencimientos</div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-xl border border-slate-200/60 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Estás usando el plan gratuito de PlayComun. Podés usar todas las calculadoras laborales y comerciales, generar códigos QR estándar y descargar documentos en PDF. Para acceder al guardado ilimitado en la nube y exportación a Excel, podés pasar a Pro.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => router.push('/planes')}
                className="px-5 py-2.5 rounded-xl text-white bg-purple-700 hover:bg-purple-800 font-semibold transition-colors text-xs sm:text-sm flex items-center gap-2 shadow-xs"
              >
                <span>Conocer planes Pro</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Historial de Pagos y Comprobantes */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Historial de pagos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Comprobantes y registros de transacciones de tu cuenta.</p>
          </div>
        </div>

        {sortedPayments.length > 0 ? (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="text-[11px] font-semibold text-slate-400 uppercase bg-slate-50/80 border-y border-slate-100">
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Importe</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Medio</th>
                  <th scope="col" className="px-4 py-3 text-right">Comprobante ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      ${(Number(payment.amount) || 0).toLocaleString('es-AR')}{' '}
                      <span className="text-[11px] text-slate-400 font-semibold">{payment.currency || 'ARS'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        payment.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        payment.status === 'pending' || payment.status === 'in_process' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        payment.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        payment.status === 'refunded' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {payment.status === 'approved' ? 'Aprobado' :
                         payment.status === 'pending' ? 'Pendiente' :
                         payment.status === 'in_process' ? 'En proceso' :
                         payment.status === 'rejected' ? 'Rechazado' :
                         payment.status === 'refunded' ? 'Reembolsado' :
                         payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                      {payment.payment_method || 'Mercado Pago'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {renderComprobanteId(payment.provider_payment_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-slate-500 font-medium text-xs">No se registran comprobantes de pago en esta cuenta.</p>
          </div>
        )}
      </section>

      {/* Sección Comparativa de Planes (Desplegable si ya es Pro, abierta si es Free) */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
              Comparativa de funciones y planes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisá en detalle las herramientas disponibles en el plan gratuito y en PlayComun Pro.
            </p>
          </div>
          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors">
            {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showComparison && (
          <div className="pt-6 mt-6 border-t border-slate-100">
            <PlanComparison
              isPro={isPro}
              priceMensual={priceMensual}
              priceAnual={priceAnual}
              currentPeriodEnd={subscription?.current_period_end}
              isAuthenticated={true}
              mode="dashboard"
            />
          </div>
        )}
      </section>

      {/* Modal de Confirmación para Cancelar Renovación Automática */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1.5">
              ¿Cancelar la renovación automática?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Si cancelás la renovación, mantendrás tu acceso a PlayComun Pro hasta el final de tu período actual y no se te cobrará ningún período nuevo.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1 mb-5">
              <p className="font-semibold text-slate-800">Detalles de la cancelación:</p>
              <p>• Conservás acceso completo hasta:{' '}
                <strong className="text-slate-900">
                  {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'el fin del ciclo'}
                </strong>
              </p>
              <p>• Podés volver a activar la renovación en cualquier momento.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Mantener mi plan Pro
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <span>Confirmar cancelación</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
