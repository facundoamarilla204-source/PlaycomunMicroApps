'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createCheckoutSession, createCardSubscription } from './actions'

// Replace this with your actual public key in .env.local
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''
if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' })
}

export function CheckoutClient({ 
  userEmail, 
  userId, 
  initialPlan,
  priceMensual,
  priceAnual
}: { 
  userEmail: string, 
  userId: string, 
  initialPlan: 'mensual' | 'anual',
  priceMensual: number,
  priceAnual: number
}) {
  const router = useRouter()
  const [planType, setPlanType] = useState<'mensual' | 'anual'>(initialPlan)
  const [isLoadingMP, setIsLoadingMP] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentPrice = planType === 'mensual' ? priceMensual : priceAnual

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

  const handleCardSubmit = async (formData: any) => {
    setError(null)
    return new Promise<void>((resolve, reject) => {
      createCardSubscription({
        planType,
        token: formData.token,
        payerEmail: formData.payer.email,
        paymentMethodId: formData.payment_method_id,
        issuerId: formData.issuer_id,
        identification: formData.payer.identification
      }).then((res) => {
        if (res?.error) {
          setError(res.error)
          reject()
        } else {
          router.push('/cuenta/suscripcion?success=true')
          resolve()
        }
      }).catch((e) => {
        setError(e.message || 'Error al procesar la tarjeta')
        reject()
      })
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Columna Izquierda: Selección de Plan y Resumen */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-slate-800">1. Elegí tu plan</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setPlanType('mensual')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                planType === 'mensual' 
                  ? 'border-amber-500 bg-amber-50/50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-800">Mensual</div>
              <div className="text-amber-600 font-black text-xl mt-1">${priceMensual}</div>
              <div className="text-xs text-slate-500 mt-1">Cobro automático mensual</div>
            </button>
            
            <button
              onClick={() => setPlanType('anual')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                planType === 'anual' 
                  ? 'border-amber-500 bg-amber-50/50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                2 MESES GRATIS
              </div>
              <div className="font-bold text-slate-800">Anual</div>
              <div className="text-amber-600 font-black text-xl mt-1">${priceAnual}</div>
              <div className="text-xs text-slate-500 mt-1">Cobro automático anual</div>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Resumen de compra</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Suscripción PlayComun Pro</span>
              <span className="font-medium text-slate-800">${currentPrice}</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-slate-500">Frecuencia</span>
              <span className="text-slate-600">{planType === 'mensual' ? 'Mensual' : 'Anual'}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-800">Total a pagar hoy</span>
              <span className="text-2xl font-black text-amber-500">${currentPrice} ARS</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Podés cancelar en cualquier momento desde tu cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Métodos de Pago */}
      <div className="lg:col-span-7 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative">
          <h2 className="text-xl font-bold mb-6 text-slate-800">2. Método de pago</h2>
          
          <div className="relative min-h-[400px]">
            {MP_PUBLIC_KEY ? (
              <CardPayment
                initialization={{ amount: currentPrice, payer: { email: userEmail } }}
                customization={{
                  visual: {
                    style: {
                      theme: 'default',
                    },
                  },
                  paymentMethods: {
                    maxInstallments: 1, // Es suscripción, no cuotas
                  }
                }}
                onSubmit={handleCardSubmit}
              />
            ) : (
              <div className="text-center py-10 text-slate-500">
                Falta configurar la Public Key de Mercado Pago en las variables de entorno.
              </div>
            )}
          </div>

          <div className="relative flex py-8 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">O podés</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={handleMercadoPagoRedirect}
            disabled={isLoadingMP}
            className="w-full bg-[#009EE3] hover:bg-[#0089C7] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoadingMP ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Pagar con tu cuenta de Mercado Pago
          </button>
        </div>
      </div>
      
    </div>
  )
}
