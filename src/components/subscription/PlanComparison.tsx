'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Check, 
  X, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Sparkles,
  FileText,
  UtensilsCrossed,
  QrCode,
  HardDrive
} from 'lucide-react'

export interface PlanComparisonProps {
  isPro: boolean
  priceMensual: number
  priceAnual: number
  currentPeriodEnd?: string | null
  isAuthenticated?: boolean
  mode?: 'dashboard' | 'landing'
  title?: string
  subtitle?: string
}

interface FeatureItem {
  name: string
  detail?: string
  free: boolean | string
  pro: boolean | string
}

interface FeatureGroup {
  category: string
  icon: React.ReactNode
  features: FeatureItem[]
}

const COMPARISON_MATRIX: FeatureGroup[] = [
  {
    category: "Documentos comerciales y marca",
    icon: <FileText className="w-4 h-4 text-purple-600" />,
    features: [
      {
        name: "Facturas, presupuestos y remitos en PDF",
        detail: "Generación e impresión estándar",
        free: "Estándar",
        pro: "Estándar",
      },
      {
        name: "Identidad propia y colores de marca",
        detail: "Subida de logo y personalización de plantilla",
        free: false,
        pro: true,
      },
      {
        name: "PDF sin marca de agua PlayComun",
        detail: "Documentos limpios para entrega a clientes",
        free: false,
        pro: true,
      },
      {
        name: "Historial de documentos en la nube",
        detail: "Consultá, reimprimí o editá comprobantes previos",
        free: false,
        pro: true,
      },
      {
        name: "Agenda de clientes y catálogo de productos",
        detail: "Autocompletá precios y datos en un clic",
        free: false,
        pro: true,
      },
    ],
  },
  {
    category: "Gestión comercial y costos",
    icon: <UtensilsCrossed className="w-4 h-4 text-purple-600" />,
    features: [
      {
        name: "Calculadora de costo de recetas",
        detail: "Cálculo libre de rendimientos y margen",
        free: "Libre",
        pro: "Libre",
      },
      {
        name: "Guardado y duplicación de recetas",
        detail: "Biblioteca en la nube con costeo actualizado",
        free: false,
        pro: true,
      },
      {
        name: "Múltiples listas de precios guardadas",
        detail: "Listas para mayoristas, minoristas o eventos",
        free: false,
        pro: true,
      },
      {
        name: "Control de gastos e ingresos",
        detail: "Sincronización multidispositivo en la nube",
        free: "Local (equipo)",
        pro: "Nube sincronizada",
      },
      {
        name: "Exportación de gastos a Excel (.xlsx)",
        detail: "Planilla estructurada para contabilidad",
        free: false,
        pro: true,
      },
    ],
  },
  {
    category: "Códigos QR y archivos",
    icon: <QrCode className="w-4 h-4 text-purple-600" />,
    features: [
      {
        name: "Códigos QR estáticos",
        detail: "Enlaces directos sin vencimiento (PNG y SVG)",
        free: "Ilimitados",
        pro: "Ilimitados",
      },
      {
        name: "Códigos QR dinámicos para imprenta",
        detail: "Tandas numeradas en hojas A4",
        free: false,
        pro: true,
      },
      {
        name: "Actualización de destino QR en tiempo real",
        detail: "Modificá el enlace sin reimprimir el código",
        free: false,
        pro: true,
      },
      {
        name: "Conversiones en servidor worker",
        detail: "Documentos Word, Excel y PowerPoint a PDF",
        free: "5 / día (10 MB)",
        pro: "100 / día (50 MB)",
      },
      {
        name: "Conversiones locales en el navegador",
        detail: "Imágenes y corte de audio en el cliente",
        free: "Sin límite diario",
        pro: "Sin límite diario",
      },
    ],
  },
]

export function PlanComparison({
  isPro,
  priceMensual,
  priceAnual,
  currentPeriodEnd,
  isAuthenticated = true,
  mode = 'dashboard',
  title,
  subtitle,
}: PlanComparisonProps) {
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual')
  const [showDetailedMatrix, setShowDetailedMatrix] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const isAnual = billingCycle === 'anual'

  const handleCheckout = () => {
    setIsLoading(true)
    router.push(`/checkout?plan=${isAnual ? 'anual' : 'mensual'}`)
  }

  const annualMonthlyEquivalent = Math.round(priceAnual / 12)
  const hasAnnualDiscount = priceAnual < priceMensual * 12

  const formattedPeriodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="w-full space-y-8" aria-label="Planes y comparativa de PlayComun Online">
      {/* Encabezado opcional */}
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Selector de facturación */}
      <div className="flex justify-center">
        <div 
          role="radiogroup" 
          aria-label="Ciclo de facturación" 
          className="relative inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!isAnual}
            onClick={() => setBillingCycle('mensual')}
            className={`relative z-10 px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-purple-600 ${
              !isAnual 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Facturación mensual
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isAnual}
            onClick={() => setBillingCycle('anual')}
            className={`relative z-10 px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-purple-600 ${
              isAnual 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Facturación anual</span>
            {hasAnnualDiscount && (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Ahorro anual
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TARJETAS PRINCIPALES COMPACTAS                                    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
        
        {/* TARJETA 1: BÁSICO */}
        <article className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Uso cotidiano
              </span>
              {!isPro && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Plan actual
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Básico</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculadoras y utilidades libres para uso diario.
              </p>
            </div>

            {/* Precio */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">$0</span>
                <span className="text-xs font-semibold text-slate-500">/ para siempre</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Sin tarjeta ni cuotas de renovación</p>
            </div>

            {/* Botón de acción */}
            <div>
              {!isAuthenticated ? (
                <Link
                  href="/registro"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-center text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-slate-900"
                >
                  Crear cuenta gratis
                </Link>
              ) : isPro ? (
                <div className="w-full min-h-[44px] px-3 py-2 rounded-xl text-center text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center">
                  Disponible siempre en tu cuenta
                </div>
              ) : (
                <div className="w-full min-h-[44px] px-3 py-2 rounded-xl text-center text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  Plan activo en tu cuenta
                </div>
              )}
            </div>

            {/* Lista sintetizada de características */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Qué incluye:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
                  <span>Calculadoras y utilidades libres sin registro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
                  <span>Facturas y presupuestos estándar en PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
                  <span>Códigos QR estáticos sin caducidad</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
                  <span>Control de gastos en memoria de tu navegador</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
                  <span>5 conversiones diarias en servidor (archivos 10 MB)</span>
                </li>
              </ul>
            </div>
          </div>
        </article>

        {/* TARJETA 2: PLAYCOMUN PRO */}
        <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg text-white relative overflow-hidden">
          {/* Barra de acento */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                Gestión comercial en la nube
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
                Recomendado
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">PlayComun Pro</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Historial en la nube, personalización y clientes frecuentes.
              </p>
            </div>

            {/* Precio */}
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ${(isAnual ? priceAnual : priceMensual).toLocaleString('es-AR')}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ARS / {isAnual ? 'año' : 'mes'}
                </span>
              </div>
              {isAnual ? (
                <p className="text-[11px] text-purple-300 font-medium mt-0.5">
                  Equivale a ${annualMonthlyEquivalent.toLocaleString('es-AR')} ARS/mes facturados anualmente
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cobro recurrente mensual vía Mercado Pago
                </p>
              )}
            </div>

            {/* Botón de acción */}
            <div>
              {isPro ? (
                <div className="w-full min-h-[44px] px-3 py-2 rounded-xl text-center text-xs font-bold bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  Plan Pro activo en tu cuenta
                </div>
              ) : !isAuthenticated ? (
                <Link
                  href="/ingresar?callbackUrl=/planes"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-center text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-colors flex items-center justify-center gap-1.5 shadow-md focus-visible:outline-2 focus-visible:outline-purple-400"
                >
                  <span>Ingresar para suscribirme</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-center text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5 shadow-md focus-visible:outline-2 focus-visible:outline-purple-400"
                >
                  <span>{isLoading ? 'Redirigiendo...' : 'Contratar PlayComun Pro'}</span>
                  {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Lista sintetizada de características */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                Todo lo de Básico, más:
              </p>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>Recetas en la nube con costeo y duplicación</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>Historial de presupuestos y documentos comerciales</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>Agenda de clientes y catálogo con precios precargados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>Identidad propia: tu logo y PDF sin marca PlayComun</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>Control de gastos sincronizado y exportación a Excel</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>QR dinámicos para imprenta con destino editable</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>100 conversiones diarias en servidor (archivos 50 MB)</span>
                </li>
              </ul>
            </div>
          </div>
        </article>

      </div>

      {/* Botón para desplegar / contraer matriz técnica completa */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowDetailedMatrix(prev => !prev)}
          className="text-xs sm:text-sm font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-purple-600"
        >
          <span>{showDetailedMatrix ? 'Ocultar comparativa detallada' : 'Ver comparativa técnica completa'}</span>
          <span className="text-xs">{showDetailedMatrix ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* MATRIZ COMPARATIVA DETALLADA (Desplegable y limpia)               */}
      {/* ================================================================= */}
      {showDetailedMatrix && (
        <section 
          className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden space-y-6"
          aria-label="Tabla comparativa de funcionalidades"
        >
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Detalle de funcionalidades por herramienta
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriz completa de capacidades verificadas en producción.
            </p>
          </div>

          <div className="space-y-6">
            {COMPARISON_MATRIX.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {group.icon}
                  <span>{group.category}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-2 px-3 w-1/2">Función</th>
                        <th className="py-2 px-3 text-center w-1/4">Básico</th>
                        <th className="py-2 px-3 text-center w-1/4 text-purple-700">PlayComun Pro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.features.map((feat, featIdx) => (
                        <tr key={featIdx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-800">{feat.name}</p>
                            {feat.detail && (
                              <p className="text-[11px] text-slate-400">{feat.detail}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {typeof feat.free === 'string' ? (
                              <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {feat.free}
                              </span>
                            ) : feat.free ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {typeof feat.pro === 'string' ? (
                              <span className="inline-block text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                {feat.pro}
                              </span>
                            ) : feat.pro ? (
                              <Check className="w-4 h-4 text-purple-600 mx-auto" strokeWidth={2.5} />
                            ) : (
                              <X className="w-4 h-4 text-slate-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* FRANJA DE TRANSPARENCIA Y POLÍTICAS (Compacta y accesible)        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2">
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>Cancelación flexible</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cancelás la renovación cuando quieras. Conservás Pro hasta el último día de tu período abonado.
            {formattedPeriodEnd && (
              <span className="block font-semibold text-purple-900 mt-1">
                Tu período activo vence el {formattedPeriodEnd}.
              </span>
            )}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Cobro seguro</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pagos procesados directamente por Mercado Pago con débito automático en tu tarjeta registrada.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <HardDrive className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Datos preservados</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Si pausás o finalizás tu suscripción, tus recetas, listas y documentos quedan guardados en tu cuenta.
          </p>
        </div>
      </div>
    </div>
  )
}
