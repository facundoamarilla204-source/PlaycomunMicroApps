'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createCheckoutSession, createCardSubscription } from './actions'
import { CheckCircle2, Loader2 } from 'lucide-react'

const ENV_MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''
if (ENV_MP_PUBLIC_KEY) {
  initMercadoPago(ENV_MP_PUBLIC_KEY, { locale: 'es-AR' })
}

export function CheckoutClient({
  userEmail,
  userId,
  initialPlan,
  priceMensual,
  priceAnual,
  publicKey
}: {
  userEmail: string,
  userId: string,
  initialPlan: 'mensual' | 'anual',
  priceMensual: number,
  priceAnual: number,
  publicKey?: string
}) {
  const router = useRouter()
  const [planType, setPlanType] = useState<'mensual' | 'anual'>(initialPlan)
  const [isLoadingMP, setIsLoadingMP] = useState(false)
  const [isProcessingCard, setIsProcessingCard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successState, setSuccessState] = useState<{ id: string } | null>(null)

  const activePublicKey = publicKey || ENV_MP_PUBLIC_KEY

  useEffect(() => {
    if (activePublicKey) {
      initMercadoPago(activePublicKey, { locale: 'es-AR' })
    }
  }, [activePublicKey])

  const currentPrice = planType === 'mensual' ? priceMensual : priceAnual

  // Redirect flow (Mercado Pago checkout page)
  const handleMercadoPagoRedirect = async () => {
    setIsLoadingMP(true)
    setError(null)
    try {
      const response = await createCheckoutSession(planType)
      if (response?.url) {
        window.location.href = response.url
      } else if (response?.error) {
        setError(response.error)
      }
    } catch (e: any) {
      setError(e.message || 'Error al procesar el pago')
    } finally {
      setIsLoadingMP(false)
    }
  }

  // Card flow (CardPayment component, direct charge)
  const handleCardSubmit = async (formData: any): Promise<void> => {
    setError(null)
    setIsProcessingCard(true)

    return new Promise<void>((resolve, reject) => {
      createCardSubscription({
        planType,
        token: formData.token,
        payerEmail: formData.payer?.email || userEmail,
        paymentMethodId: formData.payment_method_id || '',
        issuerId: formData.issuer_id || '',
        identification: formData.payer?.identification || null,
      }).then((res) => {
        setIsProcessingCard(false)

        if (res?.error) {
          setError(res.error)
          reject()
          return
        }

        if (res?.success) {
          if (res.alreadyPro) {
            // Usuario ya era Pro, redirigir sin banner de éxito
            router.push('/cuenta/suscripcion')
          } else {
            // Pago exitoso: mostrar estado de éxito y luego navegar
            setSuccessState({ id: res.id })
            setTimeout(() => {
              const params = new URLSearchParams({ success: 'true' })
              if (res.id) params.set('preapproval_id', res.id)
              router.push(`/cuenta/suscripcion?${params.toString()}`)
            }, 2000)
          }
          resolve()
        } else {
          setError('No se pudo completar la suscripción. Por favor intentá de nuevo.')
          reject()
        }
      }).catch((e) => {
        setIsProcessingCard(false)
        setError(e.message || 'Error al procesar la tarjeta')
        reject()
      })
    })
  }

  // Success overlay
  if (successState) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 gap-6 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Pago procesado!</h2>
          <p className="text-slate-500 font-medium">Activando tu suscripción Pro…</p>
        </div>
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* Left column: Plan selection */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-slate-800">1. Elegí tu plan</h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setPlanType('mensual')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden min-h-[44px] ${
                planType === 'mensual'
                  ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-800 text-sm">Mensual</div>
              <div className="text-purple-700 font-black text-xl mt-1">${priceMensual.toLocaleString('es-AR')}</div>
              <div className="text-xs text-slate-500 mt-1">Cobro automático mensual</div>
            </button>

            <button
              type="button"
              onClick={() => setPlanType('anual')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden min-h-[44px] ${
                planType === 'anual'
                  ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                Ahorro de 2 meses
              </div>
              <div className="font-bold text-slate-800 text-sm">Anual</div>
              <div className="text-purple-700 font-black text-xl mt-1">${priceAnual.toLocaleString('es-AR')}</div>
              <div className="text-xs text-slate-500 mt-1">Cobro automático anual</div>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-base font-bold mb-4 text-slate-800">Resumen de compra</h3>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-slate-600">Suscripción PlayComun Pro</span>
              <span className="font-semibold text-slate-900">${currentPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-slate-500">Frecuencia de cobro</span>
              <span className="text-slate-700 font-medium">{planType === 'mensual' ? 'Mensual' : 'Anual'}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-900">Total a pagar hoy</span>
              <span className="text-2xl font-black text-purple-700">${currentPrice.toLocaleString('es-AR')} ARS</span>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Podés cancelar en cualquier momento desde tu panel de cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* Right column: Payment method */}
      <div className="lg:col-span-7 space-y-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative">
          <h2 className="text-xl font-bold mb-6 text-slate-800">2. Método de pago</h2>

          <div className="relative min-h-[400px]">
            {activePublicKey ? (
              <div className="relative">
                {isProcessingCard && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl gap-3">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-slate-700 font-medium text-sm">Procesando tu pago…</p>
                  </div>
                )}
                <CardPayment
                  initialization={{ amount: currentPrice, payer: { email: userEmail } }}
                  customization={{
                    visual: { style: { theme: 'default' } },
                    paymentMethods: { maxInstallments: 1 }
                  }}
                  onSubmit={handleCardSubmit}
                />
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                Falta configurar la Public Key de Mercado Pago en las variables de entorno.
              </div>
            )}
          </div>

          <div className="relative flex py-8 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs sm:text-sm font-medium">O podés pagar con</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleMercadoPagoRedirect}
            disabled={isLoadingMP}
            className="w-full min-h-[44px] bg-[#009EE3] hover:bg-[#0089C7] active:bg-[#007CB3] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base focus-visible:outline-2 focus-visible:outline-[#009EE3]"
          >
            {isLoadingMP ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            <span>Pagar con tu cuenta de Mercado Pago</span>
          </button>
        </div>
      </div>
    </div>
  )
}
