'use client'

import { useState } from 'react'
import { Check, Sparkles, Zap, ArrowRight, Shield, CreditCard } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { createCheckoutSession } from "./actions"

interface PlanesClientProps {
  isAuthenticated: boolean
  isPro: boolean
}

export default function PlanesClient({ isAuthenticated, isPro }: PlanesClientProps) {
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual')
  const [isLoading, setIsLoading] = useState(false)
  const isAnual = billingCycle === 'anual'

  // Precios hardcodeados para mostrar UI (luego pueden venir de la DB si es necesario)
  const monthlyPrice = 5900
  const yearlyPrice = 59000 // 2 meses gratis

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
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] relative overflow-hidden py-12 sm:py-24">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-sm font-bold tracking-wide">
            <Sparkles className="w-4 h-4" />
            LLEVA TUS HERRAMIENTAS AL SIGUIENTE NIVEL
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
            Diseñá sin límites, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-600">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plan Gratuito */}
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-border/60 rounded-[2rem] p-8 sm:p-10 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Básico</h2>
            <p className="text-slate-500 mb-6 font-medium">Ideal para uso casual y tareas rápidas.</p>
            
            <div className="mb-8 flex items-end gap-1">
              <span className="text-5xl font-extrabold text-slate-900">$0</span>
              <span className="text-slate-500 font-medium mb-1">/ para siempre</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1">
              {[
                'Acceso al 100% de las herramientas', 
                'Generación de documentos estándar', 
                'Guardado de herramientas favoritas', 
                'Soporte comunitario'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {!isAuthenticated ? (
              <Link 
                href="/registro"
                className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-4 rounded-xl font-bold transition-colors"
              >
                Crear cuenta gratis
              </Link>
            ) : isPro ? (
              <button 
                disabled
                className="w-full text-center bg-slate-50 text-slate-400 px-6 py-4 rounded-xl font-bold cursor-default"
              >
                Incluido
              </button>
            ) : (
              <button 
                disabled
                className="w-full text-center bg-slate-100 text-slate-500 px-6 py-4 rounded-xl font-bold cursor-default"
              >
                Plan actual
              </button>
            )}
          </motion.div>

          {/* Plan Pro */}
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col group">
            {/* Pro background effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl group-hover:bg-brand/30 transition-colors duration-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="absolute top-0 right-8 bg-amber-400 text-amber-950 text-xs font-black px-4 py-1.5 rounded-b-xl uppercase tracking-wider shadow-sm">
              Recomendado
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-2">
                Pro <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
              </h2>
              <p className="text-slate-400 mb-6 font-medium">Potencia total para profesionales.</p>
              
              <div className="mb-8 flex flex-col">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-white">
                    ${(isAnual ? yearlyPrice : monthlyPrice).toLocaleString('es-AR')}
                  </span>
                  <span className="text-slate-400 font-medium mb-1">
                    / {isAnual ? 'año' : 'mes'}
                  </span>
                </div>
                {isAnual && (
                  <span className="text-amber-400 text-sm font-bold mt-1">
                    Equivale a ${(yearlyPrice / 12).toLocaleString('es-AR')}/mes (Ahorrás 2 meses)
                  </span>
                )}
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Todo lo de Básico, más:',
                  'Sin publicidad en toda la plataforma',
                  'Personalización de marca (tu logo y colores)', 
                  'Exportación a Excel / CSV en herramientas',
                  'Sin marca de agua en PDFs',
                  'Historial guardado de documentos'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-200 font-medium">
                    <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5 border border-amber-400/20">
                      <Check className="w-4 h-4" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="w-full">
                {isPro ? (
                   <Link 
                    href="/cuenta"
                    className="flex w-full items-center justify-center bg-white/10 text-white hover:bg-white/20 px-6 py-4 rounded-xl font-bold transition-colors"
                  >
                    Gestionar suscripción
                  </Link>
                ) : !isAuthenticated ? (
                  <Link 
                    href="/ingresar?callbackUrl=/planes"
                    className="flex w-full items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950 px-6 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-amber-400/20"
                  >
                    Ingresar para suscribirme
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <button 
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-amber-950 px-6 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-amber-400/20"
                  >
                    {isLoading ? 'Redirigiendo...' : 'Actualizar a Pro ahora'}
                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Pago seguro</div>
                <div className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Cancela cuando quieras</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
