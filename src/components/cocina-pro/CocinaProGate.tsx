'use client'

import Link from 'next/link'
import { ChefHat, ShieldCheck, CheckCircle2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'

export function CocinaProGate({
  isAuthenticated,
  userEmail,
}: {
  isAuthenticated: boolean
  userEmail?: string
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full">
        {/* Enlace para volver a Microapps */}
        <div className="mb-6">
          <Link
            href="/microapps"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md p-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al catálogo de Microapps</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
          {/* Logo e insignia */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <ChefHat className="h-6 w-6 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Cocina Pro
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Espacio de gestión gastronómica y costeo técnico
              </p>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
            {isAuthenticated
              ? 'Esta microapp requiere una suscripción Pro activa'
              : 'Iniciá sesión para acceder a tu espacio de Cocina Pro'}
          </h2>

          <p className="text-sm text-slate-700 leading-relaxed mb-6">
            Cocina Pro es un entorno profesional que te permite registrar tus insumos con historial de precios,
            organizar recetas estructuradas y calcular costos reales con mermas y densidades culinarias.
          </p>

          {/* Características incluidas */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/80 mb-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Funcionalidades profesionales incluidas
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Biblioteca personal de ingredientes con precios y presentaciones</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Historial de precios inmutable y auditable por insumo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Recetario profesional ilimitado con costeo dinámico</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Datos aislados y seguros asociados a tu cuenta</span>
              </li>
            </ul>
          </div>

          {/* Estado de usuario y acciones */}
          <div className="space-y-3">
            {isAuthenticated ? (
              <>
                <div className="text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <span>
                    Sesión iniciada como <strong>{userEmail}</strong> (Plan estándar)
                  </span>
                </div>
                <Link
                  href="/planes"
                  className="btn-tactile w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand text-white font-semibold text-sm shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition-colors min-h-[44px]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Conocer planes PlayComun Pro</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-center text-xs text-slate-600 mt-2">
                  Activá tu plan Pro para desbloquear Cocina Pro y todas las funciones avanzadas.
                </p>
              </>
            ) : (
              <>
                <Link
                  href="/ingresar?next=/cocina-pro"
                  className="btn-tactile w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand text-white font-semibold text-sm shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition-colors min-h-[44px]"
                >
                  <span>Iniciar sesión en PlayComun</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-600">
                  <span>¿No tenés cuenta todavía?</span>
                  <Link href="/registro" className="font-semibold text-brand hover:underline">
                    Crear cuenta gratis
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
