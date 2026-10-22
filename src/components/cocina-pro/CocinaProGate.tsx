'use client'

import Link from 'next/link'
import { ArrowLeft, Scale, Layers, Wheat, Flame, Check } from 'lucide-react'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'

interface CocinaProGateProps {
  isAuthenticated: boolean
  userEmail?: string
}

export function CocinaProGate({
  isAuthenticated,
  userEmail,
}: CocinaProGateProps) {
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col justify-between">
      {/* Barra superior de navegación contextual */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xs py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/microapps"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Microapps</span>
          </Link>

          {isAuthenticated ? (
            <span className="text-xs text-slate-500 font-medium">
              Sesión: <strong className="text-slate-800 font-semibold">{userEmail}</strong> (Plan Estándar)
            </span>
          ) : (
            <Link
              href="/ingresar?next=/cocina-pro"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      {/* Contenido principal centrado con estructura de dos columnas */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Columna izquierda: Propuesta de valor real y acceso */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center">
                <AmasiaLogo variant="symbol" className="h-12 w-12" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-wider block">
                  Amasia · Gestión Gastronómica
                </span>
                <span className="text-xs text-slate-500">
                  Plan PlayComun Pro
                </span>
              </div>
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-900 tracking-normal leading-tight">
                Costos exactos y recetario técnico para tu cocina
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Calculá el costo real de tus preparaciones teniendo en cuenta mermas, rendimientos y precios de compra actualizados. Diseñado para pastelerías, obradores, rotiserías y emprendedores gastronómicos.
              </p>
            </div>

            {/* Capacidades reales de la microapp */}
            <div className="space-y-3.5 pt-2">
              <h2 className="sr-only">Funciones y herramientas incluidas en Amasia</h2>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Historial de precios por insumo
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Cargás la harina, manteca o carne una sola vez. Cuando actualizás el precio de compra, se recalculan automáticamente todas las recetas que usan ese insumo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Costeo por porción con factor de merma
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Calculá el Food Cost y el precio de venta sugerido según el margen que necesitás para que tu negocio sea rentable.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Calculadora panadera (% Panadero)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Balanceá fórmulas de masa madre, controlá hidrataciones y adaptá las cantidades automáticamente al tamaño de tus moldes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Modo elaboración para producción
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Pantalla optimizada para cocinar sin tocar el teclado, con pesos exactos y pasos ordenados.
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="pt-3 space-y-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/planes"
                    className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 rounded-xl bg-brand text-white font-bold text-sm shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition-all active:scale-[0.98] min-h-[46px]"
                  >
                    Ver planes y precios de suscripción
                  </Link>
                  <p className="text-xs text-slate-500">
                    Amasia requiere una suscripción Pro activa. Podés cancelar en cualquier momento desde tu panel de cuenta.
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/ingresar?next=/cocina-pro"
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-brand text-white font-bold text-sm shadow-sm hover:bg-brand-hover transition-all active:scale-[0.98] min-h-[46px]"
                    >
                      Iniciar sesión para ingresar
                    </Link>
                    <Link
                      href="/planes"
                      className="inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors min-h-[46px]"
                    >
                      Conocer planes Pro
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500">
                    ¿Primera vez en PlayComun?{' '}
                    <Link href="/registro" className="text-brand font-semibold hover:underline">
                      Creá tu cuenta gratis
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Ejemplo visual tangible de una ficha técnica real */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-5">
              {/* Encabezado de la receta de demostración */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                      Panadería y Pastelería
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Ficha técnica #014
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                    Medialunas de Manteca Artesanales
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rendimiento: 24 unidades estándar (55 g c/u)
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    Costo x Unidad
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
                    $ 385,40
                  </span>
                </div>
              </div>

              {/* Indicadores clave de rendimiento gastronómico */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-medium text-slate-500 block">Costo Batch</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">$ 9.249,60</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-medium text-slate-500 block">Venta Sugerida</span>
                  <span className="text-sm font-bold text-emerald-700 tabular-nums">$ 950,00</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-medium text-slate-500 block">Food Cost</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">40,5%</span>
                </div>
              </div>

              {/* Lista tangible de insumos con pesos y costos */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                  <span>Insumos del pastón</span>
                  <span>Costo calculado</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">Harina 000 de fuerza</span>
                      <span className="text-[11px] text-slate-500 ml-1.5 tabular-nums">1.000 g</span>
                    </div>
                    <span className="font-medium text-slate-700 tabular-nums">$ 1.150,00</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">Manteca 82% materia grasa</span>
                      <span className="text-[11px] text-slate-500 ml-1.5 tabular-nums">500 g</span>
                    </div>
                    <span className="font-medium text-slate-700 tabular-nums">$ 5.200,00</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">Leche entera pasteurizada</span>
                      <span className="text-[11px] text-slate-500 ml-1.5 tabular-nums">450 ml</span>
                    </div>
                    <span className="font-medium text-slate-700 tabular-nums">$ 675,00</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">Azúcar común tipo A</span>
                      <span className="text-[11px] text-slate-500 ml-1.5 tabular-nums">200 g</span>
                    </div>
                    <span className="font-medium text-slate-700 tabular-nums">$ 360,00</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">Levadura fresca prensada</span>
                      <span className="text-[11px] text-slate-500 ml-1.5 tabular-nums">50 g</span>
                    </div>
                    <span className="font-medium text-slate-700 tabular-nums">$ 480,00</span>
                  </div>
                </div>
              </div>

              {/* Mensaje de integración de la herramienta */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Scale className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Al actualizar el precio de la Manteca en tu biblioteca, se recalcula este batch y todo tu catálogo al instante.
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Pie minimalista */}
      <footer className="w-full border-t border-slate-200/80 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        PlayComun Herramientas · Espacio Amasia
      </footer>
    </div>
  )
}
