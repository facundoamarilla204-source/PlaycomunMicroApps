'use client'

import { useState } from 'react'
import { Check, Sparkles, Zap, ArrowRight, Shield, CreditCard } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { createCheckoutSession } from "../checkout/actions"

interface PlanesClientProps {
  isAuthenticated: boolean
  isPro: boolean
  priceMensual: number
  priceAnual: number
}

export default function PlanesClient({ isAuthenticated, isPro, priceMensual, priceAnual }: PlanesClientProps) {
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual')
  const [isLoading, setIsLoading] = useState(false)
  const isAnual = billingCycle === 'anual'

  const router = useRouter()

  const handleCheckout = () => {
    setIsLoading(true)
    router.push(`/checkout?plan=${isAnual ? 'anual' : 'mensual'}`)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  } as any

  return (
    <div className="min-h-screen bg-[#fcfcfd] relative overflow-hidden py-12 sm:py-24">
      {/* Eliminado: Decorative Blobs */}

      <motion.div 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand/10 text-brand text-sm font-bold tracking-wide">
            LLEVA TUS HERRAMIENTAS AL SIGUIENTE NIVEL
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
            Diseñá sin límites, <br className="hidden sm:block" />
            <span className="text-brand">
              trabajá sin interrupciones.
            </span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mt-4">
            Todas nuestras herramientas son gratuitas para siempre. Si buscas personalización total, reportes avanzados y una experiencia sin publicidad, PlayComun Pro es para vos.
          </p>
        </motion.div>

        {/* Toggle Facturación */}
        <motion.div variants={itemVariants} className="flex justify-center mb-16">
          <div className="relative flex items-center p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setBillingCycle('mensual')}
              className={`relative z-10 px-8 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${!isAnual ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('anual')}
              className={`relative z-10 px-8 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${isAnual ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Anual <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-wider">-15% OFF</span>
            </button>
            <div 
              className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-in-out"
              style={{ transform: isAnual ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Plan Gratuito */}
          <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Comenzá Gratis
            </span>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Básico</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium">Ideal para uso personal, consultas y cálculos rápidos del día a día.</p>
            
            <div className="mb-8 flex items-baseline gap-1.5 pb-6 border-b border-slate-100">
              <span className="text-5xl font-black text-slate-900">$0</span>
              <span className="text-slate-500 text-sm font-medium">/ para siempre</span>
            </div>
            
            <ul className="space-y-3.5 mb-10 flex-1">
              {[
                'Acceso al 100% de las calculadoras y utilidades', 
                'Generación de documentos estándar en PDF', 
                'Guardado de herramientas en accesos rápidos', 
                'Ejecución 100% privada en tu navegador'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-medium">
                  <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              {!isAuthenticated ? (
                <Link 
                  href="/registro"
                  className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[46px] flex items-center justify-center"
                >
                  Crear cuenta gratis
                </Link>
              ) : isPro ? (
                <button 
                  disabled
                  className="w-full text-center bg-slate-50 text-slate-400 px-6 py-3.5 rounded-xl text-sm font-bold cursor-default min-h-[46px]"
                >
                  Incluido en tu cuenta
                </button>
              ) : (
                <button 
                  disabled
                  className="w-full text-center bg-slate-100 text-slate-600 px-6 py-3.5 rounded-xl text-sm font-bold cursor-default min-h-[46px]"
                >
                  Plan actual
                </button>
              )}
            </div>
          </motion.div>

          {/* Plan Pro */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden flex flex-col group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
                Máxima Productividad
              </span>
              <span className="bg-purple-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Recomendado
              </span>
            </div>

            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-2">
              PlayComun Pro
            </h2>
            <p className="text-slate-400 mb-6 text-sm font-medium">Potencia sin restricciones para profesionales y negocios.</p>
            
            <div className="mb-8 flex flex-col pb-6 border-b border-slate-800">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-white">
                  ${(isAnual ? priceAnual : priceMensual).toLocaleString('es-AR')}
                </span>
                <span className="text-slate-400 text-sm font-medium">
                  / {isAnual ? 'año' : 'mes'}
                </span>
              </div>
              {isAnual && (
                <span className="text-emerald-400 text-xs font-bold mt-1.5 flex items-center gap-1">
                  ✓ Equivale a ${(Math.round(priceAnual / 12)).toLocaleString('es-AR')}/mes (Ahorrás 2 meses)
                </span>
              )}
            </div>
            
            <ul className="space-y-3.5 mb-10 flex-1">
              {[
                'Todo lo incluido en Básico, más:',
                'Navegación 100% limpia sin publicidad',
                'Personalización de marca (tu logo y colores en presupuestos)', 
                'Códigos QR dinámicos reutilizables en planchas A4',
                'Exportación de presupuestos y listas sin marca de agua',
                'Soporte prioritario por email'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-200 text-sm font-medium">
                  <div className="w-5 h-5 rounded-md bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="w-full pt-2">
              {isPro ? (
                 <Link 
                  href="/cuenta"
                  className="flex w-full items-center justify-center bg-white/10 text-white hover:bg-white/20 px-6 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[46px]"
                >
                  Gestionar suscripción
                </Link>
              ) : !isAuthenticated ? (
                <Link 
                  href="/ingresar?callbackUrl=/planes"
                  className="flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md min-h-[46px]"
                >
                  Ingresar para suscribirme
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button 
                  type="button"
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md min-h-[46px]"
                >
                  {isLoading ? 'Redirigiendo a checkout...' : 'Actualizar a Pro ahora'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Cobro seguro</div>
              <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Cancelación inmediata</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
