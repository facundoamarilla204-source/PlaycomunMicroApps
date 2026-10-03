'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription } from './actions'

export function SuscripcionClient({ 
  subscription, 
  paymentMethods,
  userEmail
}: { 
  subscription: any,
  paymentMethods: any[],
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

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Tarjeta de Estado de Suscripción */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Mi Plan Actual</h2>
        
        {isPro ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center font-bold text-xl">
                    P
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      PlayComun Pro {subscription.plans?.code === 'anual' ? '(Anual)' : '(Mensual)'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-600 text-sm font-medium">Activa</span>
                    </div>
                  </div>
                </div>
                
                {subscription.current_period_end && (
                  <p className="text-slate-500 text-sm mt-4">
                    Tu próximo cobro será el <span className="font-semibold text-slate-700">
                      {new Date(subscription.current_period_end).toLocaleDateString('es-AR')}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-6 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelando...' : 'Cancelar suscripción'}
                </button>
              </div>
            </div>
          </div>
        ) : isCancelled && subscription.current_period_end && new Date(subscription.current_period_end) > new Date() ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  PlayComun Pro {subscription.plans?.code === 'anual' ? '(Anual)' : '(Mensual)'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-slate-500 text-sm font-medium">Cancelada</span>
                </div>
                
                <p className="text-slate-500 text-sm mt-4">
                  Seguís teniendo acceso a Pro hasta el <span className="font-semibold text-slate-700">
                    {new Date(subscription.current_period_end).toLocaleDateString('es-AR')}
                  </span>
                </p>
              </div>
              
              <div>
                <button
                  onClick={() => router.push('/planes')}
                  className="px-6 py-3 rounded-xl text-white bg-amber-500 hover:bg-amber-600 font-bold transition-colors w-full md:w-auto text-center"
                >
                  Reactivar suscripción
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-slate-400">P</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Plan Gratuito</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Estás usando la versión básica de PlayComun. Actualizá a Pro para desbloquear todas las funciones.
            </p>
            <button
              onClick={() => router.push('/planes')}
              className="px-8 py-3 rounded-xl text-white bg-slate-900 hover:bg-slate-800 font-bold transition-colors shadow-md"
            >
              Ver planes Pro
            </button>
          </div>
        )}
      </div>

      {/* Métodos de pago (Solo para usuarios activos) */}
      {isPro && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Métodos de pago</h2>
          </div>
          
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                      {pm.brand || (pm.provider === 'mercadopago' ? 'MP' : 'CARD')}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">
                        {pm.type === 'card' && pm.last_four_digits 
                          ? `•••• ${pm.last_four_digits}` 
                          : 'Cuenta de Mercado Pago'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Añadido el {new Date(pm.created_at).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </div>
                  {pm.is_default && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500">
                Tus pagos son procesados de forma segura a través de Mercado Pago.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
