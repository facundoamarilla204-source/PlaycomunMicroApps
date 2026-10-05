'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription } from './actions'
import { motion } from 'framer-motion'

export function SuscripcionClient({ 
  subscription, 
  paymentMethods,
  payments,
  userEmail
}: { 
  subscription: any,
  paymentMethods: any[],
  payments: any[],
  userEmail: string
}) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPro = subscription && ['active', 'trialing'].includes(subscription.status)
  const isCancelled = subscription && subscription.status === 'cancelled'

  const handleCancel = async () => {
    if (!subscription || !window.confirm('¿Estás seguro que querés cancelar tu suscripción? Perderás el acceso a Pro al finalizar tu período actual.')) return
    
    setIsCancelling(true)
    setError(null)
    try {
      const result = await cancelSubscription(subscription.id)
      if (result.error) {
        setError(result.error)
      } else {
        alert('Suscripción cancelada correctamente.')
      }
    } catch (e: any) {
      setError(e.message || 'Error al cancelar la suscripción')
    } finally {
      setIsCancelling(false)
    }
  }

  const mainPaymentMethod = paymentMethods?.find(pm => pm.is_default) || paymentMethods?.[0]

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100"
        >
          {error}
        </motion.div>
      )}

      {/* Plan Details Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">Mi Plan Actual</h2>
          
          {isPro || isCancelled ? (
            <div className="space-y-8">
              {/* Header section */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 flex items-center justify-center font-bold text-2xl shadow-inner">
                    P
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight">
                      PlayComun Pro {subscription.plans?.code === 'anual' ? '(Anual)' : '(Mensual)'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isCancelled ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                      <span className={`text-sm font-medium ${isCancelled ? 'text-slate-500' : 'text-emerald-600'}`}>
                        {isCancelled ? 'Cancelada' : 'Activa'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <div className="text-3xl font-black text-slate-800">
                      ${subscription.plans?.price} <span className="text-base font-medium text-slate-500">{subscription.plans?.currency}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Facturación {subscription.plans?.code === 'anual' ? 'anual' : 'mensual'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Fechas importantes</h4>
                  <ul className="space-y-3">
                    {subscription.created_at && (
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-500">Miembro desde</span>
                        <span className="font-medium text-slate-700">{new Date(subscription.created_at).toLocaleDateString('es-AR')}</span>
                      </li>
                    )}
                    {subscription.current_period_start && (
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-500">Inicio del período</span>
                        <span className="font-medium text-slate-700">{new Date(subscription.current_period_start).toLocaleDateString('es-AR')}</span>
                      </li>
                    )}
                    {subscription.current_period_end && (
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-500">{isCancelled ? 'Acceso hasta' : 'Próximo cobro'}</span>
                        <span className="font-medium text-slate-700">{new Date(subscription.current_period_end).toLocaleDateString('es-AR')}</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Método de pago principal</h4>
                  {mainPaymentMethod ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase shadow-sm">
                          {mainPaymentMethod.brand || (mainPaymentMethod.provider === 'mercadopago' ? 'MP' : 'CARD')}
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                          {mainPaymentMethod.type === 'card' && mainPaymentMethod.last_four_digits 
                            ? `•••• ${mainPaymentMethod.last_four_digits}` 
                            : 'Mercado Pago'}
                        </div>
                      </div>
                      <button className="text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors">
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      Gestionado vía Mercado Pago
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 flex flex-col md:flex-row gap-3 justify-end border-t border-slate-100">
                {isPro && (
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
                {isCancelled && (
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
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="text-3xl text-slate-300">P</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Plan Gratuito</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Estás usando la versión básica. Actualizá a Pro para desbloquear herramientas avanzadas y soporte prioritario.
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
                  <th scope="col" className="px-4 py-3 rounded-r-xl font-semibold text-right">Factura</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {new Date(payment.paid_at || payment.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      ${payment.amount} <span className="text-xs text-slate-400 font-normal">{payment.currency}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {payment.status === 'approved' ? 'Aprobado' : payment.status === 'pending' ? 'Pendiente' : payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-amber-500 hover:text-amber-600 font-medium text-sm transition-colors">
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-slate-500">Todavía no hay pagos registrados.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
