'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cancelSubscription } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Zap, CreditCard, Calendar, AlertCircle, XCircle, Clock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Success Banner — shown when user returns from payment
// ---------------------------------------------------------------------------
function SuccessBanner({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-200 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-100">¡Pago confirmado!</span>
          </div>
          <h2 className="text-2xl font-black mb-1">PlayComun Pro ya está activo</h2>
          <p className="text-emerald-100 font-medium">
            Tu suscripción fue procesada correctamente. Ahora tenés acceso a todas las funciones Pro y sin publicidad en las herramientas.
          </p>
        </div>
        <button
          onClick={onClose}
          className="sm:self-start text-white/70 hover:text-white transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; dot: string }> = {
    active: { label: 'Activa', className: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse' },
    trialing: { label: 'En prueba', className: 'text-blue-600', dot: 'bg-blue-500 animate-pulse' },
    paused: { label: 'Pausada', className: 'text-amber-600', dot: 'bg-amber-500' },
    cancelled: { label: 'Cancelada', className: 'text-slate-500', dot: 'bg-slate-400' },
    past_due: { label: 'Pago vencido', className: 'text-red-600', dot: 'bg-red-500 animate-pulse' },
    expired: { label: 'Expirada', className: 'text-slate-400', dot: 'bg-slate-300' },
  }
  const config = map[status] || { label: status, className: 'text-slate-500', dot: 'bg-slate-400' }
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      <span className={`text-sm font-medium ${config.className}`}>{config.label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Plan display name helper
// ---------------------------------------------------------------------------
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
// Main component
// ---------------------------------------------------------------------------
export function SuscripcionClient({
  subscription,
  paymentMethods,
  payments,
  userEmail,
  showSuccessBanner = false,
}: {
  subscription: any,
  paymentMethods: any[],
  payments: any[],
  userEmail: string,
  showSuccessBanner?: boolean,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerVisible, setBannerVisible] = useState(showSuccessBanner)

  // Limpiar el ?success=true de la URL sin recargar
  useEffect(() => {
    if (showSuccessBanner) {
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('preapproval_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [showSuccessBanner])

  const isPro = subscription && ['active', 'trialing'].includes(subscription.status)
  const isCancelled = subscription?.status === 'cancelled'
  const isPaused = subscription?.status === 'paused'
  const isPastDue = subscription?.status === 'past_due'
  const hasSubscription = !!subscription

  const mainPaymentMethod = paymentMethods?.find(pm => pm.is_default) || paymentMethods?.[0]

  const handleCancel = async () => {
    if (!subscription) return
    const confirmed = window.confirm(
      '¿Estás seguro que querés cancelar tu suscripción? Perderás el acceso a Pro al finalizar tu período actual.'
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
      setError(e.message || 'Error al cancelar la suscripción')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Error banner */}
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

      {/* Success banner */}
      <AnimatePresence>
        {bannerVisible && (
          <SuccessBanner onClose={() => setBannerVisible(false)} />
        )}
      </AnimatePresence>

      {/* Plan Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">Mi Plan Actual</h2>

          {hasSubscription ? (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 flex items-center justify-center font-bold text-2xl shadow-inner">
                    P
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight">
                      {planDisplayName(subscription.plans?.code, subscription.plans?.name)}
                    </h3>
                    <StatusBadge status={subscription.status} />
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full md:w-auto md:text-right">
                  <div className="text-3xl font-black text-slate-800">
                    ${(subscription.plans?.price || 0).toLocaleString('es-AR')}{' '}
                    <span className="text-base font-medium text-slate-500">{subscription.plans?.currency || 'ARS'}</span>
                  </div>
                  <div className="text-sm text-slate-500">{billingLabel(subscription.plans?.code)}</div>
                </div>
              </div>

              {/* Data grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                {/* Dates */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Fechas importantes
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between text-sm">
                      <span className="text-slate-500">Suscripto desde</span>
                      <span className="font-medium text-slate-700">
                        {new Date(subscription.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </li>
                    {subscription.current_period_start && (
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-500">Inicio del período</span>
                        <span className="font-medium text-slate-700">
                          {new Date(subscription.current_period_start).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </li>
                    )}
                    {subscription.current_period_end && (
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          {isCancelled ? 'Acceso hasta' : isPastDue ? 'Período venció el' : 'Próximo cobro'}
                        </span>
                        <span className={`font-medium ${isPastDue ? 'text-red-600' : 'text-slate-700'}`}>
                          {new Date(subscription.current_period_end).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </li>
                    )}
                    {subscription.cancelled_at && (
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-500">Cancelada el</span>
                        <span className="font-medium text-slate-700">
                          {new Date(subscription.cancelled_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Payment method */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Método de pago principal
                  </h4>
                  {mainPaymentMethod ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase shadow-sm">
                          {mainPaymentMethod.brand || (mainPaymentMethod.provider === 'mercadopago' ? 'MP' : '••••')}
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                          {mainPaymentMethod.last_four_digits
                            ? `•••• ${mainPaymentMethod.last_four_digits}`
                            : mainPaymentMethod.type === 'card'
                            ? 'Tarjeta registrada'
                            : 'Mercado Pago'}
                          {mainPaymentMethod.expiration_month && mainPaymentMethod.expiration_year && (
                            <span className="text-slate-400 font-normal ml-2 text-xs">
                              vence {String(mainPaymentMethod.expiration_month).padStart(2, '0')}/{mainPaymentMethod.expiration_year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      Gestionado vía Mercado Pago
                    </div>
                  )}
                </div>
              </div>

              {/* Past due warning */}
              {isPastDue && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Pago pendiente</p>
                    <p>Tu último cobro no fue procesado. Mercado Pago intentará cobrarlo automáticamente. Si el problema persiste, actualizá tu método de pago.</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 flex flex-col md:flex-row gap-3 justify-end border-t border-slate-100">
                {isPro && !isPastDue && (
                  <>
                    <button
                      onClick={() => router.push('/planes')}
                      className="px-6 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium transition-colors text-sm"
                    >
                      Cambiar plan
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="px-6 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-50 text-sm"
                    >
                      {isCancelling ? 'Cancelando...' : 'Cancelar suscripción'}
                    </button>
                  </>
                )}
                {(isCancelled || isPaused) && (
                  <button
                    onClick={() => router.push('/planes')}
                    className="px-8 py-2.5 rounded-xl text-white bg-slate-900 hover:bg-slate-800 font-medium transition-colors shadow-md text-sm"
                  >
                    Reactivar suscripción
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* No subscription */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="text-3xl text-slate-300">P</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Plan Gratuito</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Estás usando la versión básica. Actualizá a Pro para desbloquear herramientas avanzadas y eliminar la publicidad.
              </p>
              <button
                onClick={() => router.push('/planes')}
                className="px-8 py-3.5 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Ver planes Pro
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Historial de Pagos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100"
      >
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-6">Historial de pagos</h2>

        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 rounded-l-xl font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Monto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Método</th>
                  <th scope="col" className="px-4 py-3 rounded-r-xl font-semibold text-right">ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      ${(payment.amount || 0).toLocaleString('es-AR')}{' '}
                      <span className="text-xs text-slate-400 font-normal">{payment.currency}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {payment.status === 'approved' ? 'Aprobado' :
                         payment.status === 'pending' ? 'Pendiente' :
                         payment.status === 'rejected' ? 'Rechazado' :
                         payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 capitalize">
                      {payment.payment_method || '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-xs text-slate-400 font-mono">
                        {payment.provider_payment_id?.slice(-8) || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Todavía no hay pagos registrados.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
