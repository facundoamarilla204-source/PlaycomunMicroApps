'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription, syncCurrentUserSubscription } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  Zap, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  XCircle, 
  Clock, 
  RotateCw, 
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react'
import { PlanComparison } from '@/components/subscription/PlanComparison'

// ---------------------------------------------------------------------------
// Success Banner: mostrado tras confirmar pago
// ---------------------------------------------------------------------------
function SuccessBanner({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      className="relative bg-emerald-600 rounded-2xl p-6 md:p-8 text-white shadow-lg overflow-hidden border border-emerald-500"
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">¡Pago confirmado!</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-1">PlayComun Pro ya está activo</h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Tu suscripción fue procesada correctamente por Mercado Pago. Todas las herramientas y funciones avanzadas ya están desbloqueadas en tu cuenta.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="sm:self-start text-white/70 hover:text-white transition-colors p-1"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Verification Banner: sondeo activo tras retorno de MP
// ---------------------------------------------------------------------------
function VerificationBanner({ onRetry, isSyncing }: { onRetry: () => void; isSyncing: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <RotateCw className={`w-5 h-5 text-purple-600 flex-shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
        <div>
          <p className="font-bold text-sm text-purple-950">Verificando estado con Mercado Pago</p>
          <p className="text-xs text-purple-700 mt-0.5">
            Estamos sincronizando la confirmación de tu pago. Esto suele tardar sólo unos instantes.
          </p>
        </div>
      </div>
      <button
        onClick={onRetry}
        disabled={isSyncing}
        className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Verificando...' : 'Verificar ahora'}
      </button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
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
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="text-sm font-semibold text-red-700">Acceso revocado ({providerStatus === 'refunded' ? 'Reembolsado' : 'Contracargo'})</span>
      </div>
    )
  }

  if (status === 'cancelled' && isPeriodActive) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-sm font-semibold text-amber-700">Renovación cancelada (Pro activo)</span>
      </div>
    )
  }

  if (isPending || status === 'pending' || (status === 'trialing' && providerStatus === 'pending')) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-sm font-semibold text-blue-700">Pendiente de confirmación</span>
      </div>
    )
  }

  const map: Record<string, { label: string; className: string; dot: string }> = {
    active: { label: 'Activa con renovación automática', className: 'text-emerald-700 font-semibold', dot: 'bg-emerald-500 animate-pulse' },
    trialing: { label: 'Período de prueba promocional', className: 'text-blue-700 font-semibold', dot: 'bg-blue-500 animate-pulse' },
    paused: { label: 'Pausada', className: 'text-amber-700 font-semibold', dot: 'bg-amber-500' },
    cancelled: { label: 'Suscripción finalizada', className: 'text-slate-500', dot: 'bg-slate-400' },
    past_due: { label: 'Pago pendiente de regularización (Período de gracia)', className: 'text-red-700 font-semibold', dot: 'bg-red-500 animate-pulse' },
    expired: { label: 'Suscripción finalizada', className: 'text-slate-500', dot: 'bg-slate-400' },
  }
  const config = map[status] || { label: status, className: 'text-slate-600', dot: 'bg-slate-400' }
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      <span className={`text-sm ${config.className}`}>{config.label}</span>
    </div>
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
  if (planCode === 'pro_yearly') return 'Facturación anual'
  return 'Facturación mensual'
}

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------
export function SuscripcionClient({
  subscription,
  paymentMethods,
  payments,
  userEmail: _userEmail,
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
  const [error, setError] = useState<string | null>(null)
  const [bannerVisible, setBannerVisible] = useState(showSuccessBanner && isPro)
  const [isVerifying, setIsVerifying] = useState(showSuccessBanner && !isPro)
  const [syncAttempts, setSyncAttempts] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar parámetros de éxito de la URL sin provocar recarga de página
  useEffect(() => {
    if (showSuccessBanner) {
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('preapproval_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [showSuccessBanner])

  // Polling de verificación si regresa de pago y todavía no figura como Pro
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
      setError(e.message || 'Error al sincronizar con Mercado Pago')
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

  const handleCancel = async () => {
    if (!subscription) return
    const confirmed = window.confirm(
      '¿Estás seguro de cancelar la renovación automática? Mantendrás tu acceso a PlayComun Pro hasta la fecha de finalización de tu período actual y no se te cobrará nuevamente.'
    )
    if (!confirmed) return

    setIsCancelling(true)
    setError(null)
    try {
      const result = await cancelSubscription(subscription.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message || 'Error al cancelar la renovación automática')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Mensaje de error si ocurre */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
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
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 overflow-hidden relative"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Estado de mi suscripción</h2>
            {hasSubscription && (
              <button
                onClick={handleManualSync}
                disabled={isVerifying}
                title="Sincronizar con Mercado Pago"
                className="text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            )}
          </div>

          {hasSubscription ? (
            <div className="space-y-8">
              {/* Encabezado del Plan */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-2xl shadow-inner flex-shrink-0">
                    P
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                      {planDisplayName(subscription.plans?.code, subscription.plans?.name)}
                    </h3>
                    <StatusBadge 
                      status={subscription.status} 
                      providerStatus={subscription.provider_status}
                      isPeriodActive={isPeriodActive}
                      isPending={isPending}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full md:w-auto md:text-right bg-slate-50/80 md:bg-transparent p-4 md:p-0 rounded-xl">
                  <div className="text-2xl md:text-3xl font-black text-slate-900">
                    ${(Number(subscription.plans?.price) || 0).toLocaleString('es-AR')}{' '}
                    <span className="text-sm font-semibold text-slate-500">{subscription.plans?.currency || 'ARS'}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500">{billingLabel(subscription.plans?.code)}</div>
                </div>
              </div>

              {/* Grid de Información y Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Fechas Importantes */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" /> Período y Fechas
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-500">Fecha de inicio de la suscripción</span>
                      <span className="font-medium text-slate-800">
                        {subscriptionStartDate
                          ? new Date(subscriptionStartDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Pendiente de inicio'}
                      </span>
                    </li>
                    <li className="flex justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-500">Inicio del período actual</span>
                      <span className="font-medium text-slate-800">
                        {subscription.current_period_start
                          ? new Date(subscription.current_period_start).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                          : subscriptionStartDate
                          ? new Date(subscriptionStartDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Pendiente de confirmación'}
                      </span>
                    </li>
                    <li className="flex justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-500">Fin del período actual</span>
                      <span className="font-medium text-slate-800">
                        {subscription.current_period_end
                          ? new Date(subscription.current_period_end).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Pendiente de confirmación'}
                      </span>
                    </li>
                    <li className="flex justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-500">Próximo cobro previsto</span>
                      <span className={`font-semibold ${
                        isPastDue ? 'text-red-600' :
                        isCancelled || isCancelledWithAccess ? 'text-slate-500' :
                        'text-slate-900'
                      }`}>
                        {isCancelled || isCancelledWithAccess ? (
                          'Sin cobro programado (cancelada)'
                        ) : isPastDue ? (
                          'Reintento pendiente por Mercado Pago'
                        ) : isPending ? (
                          'Pendiente de confirmación inicial'
                        ) : subscription.status === 'active' && subscription.current_period_end && new Date(subscription.current_period_end).getTime() > Date.now() ? (
                          new Date(subscription.current_period_end).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                        ) : subscription.status === 'active' ? (
                          'Confirmado por Mercado Pago'
                        ) : (
                          'Fecha pendiente de confirmación'
                        )}
                      </span>
                    </li>
                    <li className="flex justify-between text-sm py-1">
                      <span className="text-slate-500">Renovación automática</span>
                      <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                        isCancelled || isCancelledWithAccess
                          ? 'bg-slate-100 text-slate-600'
                          : isPastDue
                          ? 'bg-amber-50 text-amber-700'
                          : subscription.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isCancelled || isCancelledWithAccess
                          ? 'Desactivada'
                          : isPastDue
                          ? 'En pausa por cobro pendiente'
                          : subscription.status === 'active'
                          ? 'Activa'
                          : 'Inactiva'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Método de Pago */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-500" /> Medio de pago
                  </h4>
                  {mainPaymentMethod ? (
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-700 uppercase shadow-xs">
                          {mainPaymentMethod.brand || (mainPaymentMethod.provider === 'mercadopago' ? 'MP' : '••••')}
                        </div>
                        <div className="text-sm font-semibold text-slate-800">
                          {mainPaymentMethod.last_four_digits
                            ? `•••• ${mainPaymentMethod.last_four_digits}`
                            : 'Tarjeta registrada'}
                          {mainPaymentMethod.expiration_month && mainPaymentMethod.expiration_year && (
                            <span className="text-slate-400 font-normal ml-2 text-xs">
                              (vence {String(mainPaymentMethod.expiration_month).padStart(2, '0')}/{mainPaymentMethod.expiration_year})
                            </span>
                          )}
                        </div>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>Gestionado directamente por Mercado Pago</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-slate-50/60 rounded-xl text-xs text-slate-500 border border-slate-100">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p>
                      Para cambiar la tarjeta asociada a tu suscripción, podés hacerlo desde tu cuenta de Mercado Pago o reactivando el plan con tu nueva tarjeta al terminar el ciclo actual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso: Renovación cancelada pero período vigente */}
              {isCancelledWithAccess && (
                <div className="flex items-start gap-3 p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-sm text-amber-950">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-bold mb-1">Renovación automática cancelada</p>
                    <p className="text-xs md:text-sm text-amber-900 leading-relaxed">
                      Tu acceso a PlayComun Pro se mantiene <strong>100% activo</strong> hasta el{' '}
                      <strong>
                        {subscription.current_period_end &&
                          new Date(subscription.current_period_end).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                      </strong>
                      . No se debitarán nuevas cuotas en tu tarjeta. Si deseás continuar con Pro después de esa fecha, podés reactivar la renovación en cualquier momento.
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso: Pago pendiente o en gracia */}
              {isPastDue && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-900">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-bold mb-1">Cobro pendiente de regularización (Período de gracia activo)</p>
                    <p className="text-xs md:text-sm text-red-800 leading-relaxed">
                      Mercado Pago no pudo procesar el cobro automático de tu última cuota. El sistema te otorga un <strong>período de gracia de 3 días</strong> con tus herramientas Pro plenamente activas mientras reintenta el débito. Podés verificar el estado con el botón de actualización o revisar tu medio de pago en Mercado Pago.
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso: Acceso revocado por reembolso o contracargo */}
              {isRevoked && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-900">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-bold mb-1">Acceso Pro cancelado</p>
                    <p className="text-xs md:text-sm text-red-800 leading-relaxed">
                      La suscripción fue revocada debido a un reembolso o contracargo confirmado por el proveedor de pagos. Podés contratar un nuevo plan Pro cuando lo desees.
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso: Suscripción vencida con datos preservados */}
              {(isExpired || isPaused) && !isRevoked && (
                <div className="flex items-start gap-3 p-4 bg-purple-50/80 border border-purple-200/70 rounded-2xl text-sm text-purple-950">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600" />
                  <div>
                    <p className="font-bold mb-1">Tus datos están protegidos</p>
                    <p className="text-xs md:text-sm text-purple-900 leading-relaxed">
                      Tu período Pro finalizó, pero todos tus documentos comerciales, recetas, listas de precios, movimientos de gastos y tandas QR continúan guardados de forma segura en tu cuenta. Al reactivar Pro, recuperarás el acceso completo e inmediato a todos ellos.
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100">
                {['active', 'trialing'].includes(subscription.status) && !isPastDue && !isRevoked && (
                  <>
                    <button
                      onClick={() => router.push('/planes')}
                      className="px-5 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors text-xs sm:text-sm"
                    >
                      Cambiar modalidad de plan
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="px-5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors disabled:opacity-50 text-xs sm:text-sm border border-red-100"
                    >
                      {isCancelling ? 'Cancelando...' : 'Cancelar renovación automática'}
                    </button>
                  </>
                )}
                {isCancelledWithAccess && (
                  <button
                    onClick={() => router.push('/planes')}
                    className="px-6 py-2.5 rounded-xl text-white bg-purple-600 hover:bg-purple-700 font-bold transition-all shadow-sm text-xs sm:text-sm"
                  >
                    Reactivar renovación automática
                  </button>
                )}
                {(isExpired || isPaused || isPastDue || isRevoked) && (
                  <button
                    onClick={() => router.push('/planes')}
                    className="px-6 py-2.5 rounded-xl text-white bg-slate-900 hover:bg-slate-800 font-bold transition-all shadow-md text-xs sm:text-sm"
                  >
                    Reactivar suscripción Pro
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Usuario en plan gratuito: Estado claro sin datos Pro ficticios */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-black text-2xl shadow-inner flex-shrink-0">
                    B
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan actual</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl tracking-tight mt-0.5">
                      Plan Gratuito
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-auto sm:text-right bg-slate-50 p-4 sm:p-0 rounded-xl">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    $0 <span className="text-sm font-semibold text-slate-500">ARS</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500">Sin costo de suscripción</div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-1.5">
                <p className="font-bold text-slate-800">
                  Actualmente estás usando el plan gratuito
                </p>
                <p>
                  Tu cuenta tiene acceso libre a todas las herramientas estándar, calculadoras laborales y comerciales, códigos QR estáticos y generación de documentos en PDF. Para acceder a herramientas avanzadas, sincronización en la nube y exportación a Excel, podés contratar PlayComun Pro.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => router.push('/planes')}
                  className="px-6 py-2.5 rounded-xl text-white bg-purple-600 hover:bg-purple-700 font-bold transition-all shadow-sm text-xs sm:text-sm flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Conocer planes Pro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Sección Comparativa de Planes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80"
      >
        <PlanComparison
          isPro={isPro}
          priceMensual={priceMensual}
          priceAnual={priceAnual}
          currentPeriodEnd={subscription?.current_period_end}
          isAuthenticated={true}
          mode="dashboard"
          title={hasSubscription ? "Beneficios y funciones de los planes" : "Comparativa de planes"}
          subtitle={
            hasSubscription
              ? "Revisá las funciones incluidas en tu plan Pro y la comparativa con el plan Básico."
              : "Conocé en detalle qué incluye tu plan Básico y las herramientas adicionales de PlayComun Pro."
          }
        />
      </motion.div>

      {/* Historial de Pagos y Comprobantes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Historial de pagos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Registro de cobros recurrentes y comprobantes de tu cuenta.</p>
          </div>
        </div>

        {sortedPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-4 py-3 rounded-l-xl font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Importe</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Método</th>
                  <th scope="col" className="px-4 py-3 rounded-r-xl font-semibold text-right">Comprobante ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-800 text-xs sm:text-sm">
                      {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-xs sm:text-sm">
                      ${(Number(payment.amount) || 0).toLocaleString('es-AR')}{' '}
                      <span className="text-[11px] text-slate-400 font-semibold">{payment.currency || 'ARS'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        payment.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        payment.status === 'pending' || payment.status === 'in_process' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        payment.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                        payment.status === 'refunded' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {payment.status === 'approved' ? 'Aprobado' :
                         payment.status === 'pending' ? 'Pendiente' :
                         payment.status === 'in_process' ? 'En proceso' :
                         payment.status === 'rejected' ? 'Rechazado' :
                         payment.status === 'refunded' ? 'Reembolsado' :
                         payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">
                      {payment.payment_method || 'Mercado Pago'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {renderComprobanteId(payment.provider_payment_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-xs sm:text-sm">Todavía no hay comprobantes de pago registrados.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
