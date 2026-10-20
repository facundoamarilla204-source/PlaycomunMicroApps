"use client"

import Link from "next/link"
import { 
  SlidersHorizontal, 
  Tag, 
  Wallet, 
  Briefcase, 
  Users, 
  Heart,
  ArrowRight
} from "lucide-react"
import { getCategories } from "@/data/categories"

interface ViewAllToolsBannerProps {
  totalTools: number
  displayedCount?: number
}

const CATEGORY_META: Record<
  string, 
  { summary: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "precios-costos": {
    summary: "Precios de venta, costo de receta y margen",
    icon: Tag,
  },
  "plata-finanzas": {
    summary: "Cuotas, gastos mensuales y aguinaldo (SAC)",
    icon: Wallet,
  },
  "gestion-negocio": {
    summary: "Presupuestos y listas de precios en PDF",
    icon: Briefcase,
  },
  "clientes-utilidades": {
    summary: "IVA, enlaces de WhatsApp, QR y documentos PDF",
    icon: Users,
  },
  "salud-fitness": {
    summary: "Cálculo de masa corporal y calorías diarias",
    icon: Heart,
  },
}

export default function ViewAllToolsBanner({ totalTools }: ViewAllToolsBannerProps) {
  const categories = getCategories().filter((c) => c.id !== "todas")

  return (
    <section aria-labelledby="catalog-directory-title" className="mt-12 sm:mt-16 mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-8 shadow-2xs">
        
        {/* Cabecera directa: qué es y para qué sirve sin preguntas retóricas */}
        <div className="max-w-2xl">
          <h3 
            id="catalog-directory-title" 
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
          >
            Todas las herramientas, organizadas por lo que hacés
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {totalTools} utilidades gratuitas para resolver números, cobros y archivos en el navegador, sin necesidad de crear una cuenta.
          </p>
        </div>

        {/* Directorio de categorías estructurado en 6 fichas simétricas */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.id] || { summary: "Herramientas especializadas", icon: Tag }
            const Icon = meta.icon

            return (
              <Link
                key={cat.id}
                href={`/herramientas?categoria=${cat.id}`}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-brand/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-brand transition-colors">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-slate-600 rounded-md bg-slate-100 px-2 py-0.5">
                      {cat.count}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                    {meta.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600 group-hover:text-brand transition-colors">
                  <span>Ver categoría</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}

          {/* Tarjeta de acceso al catálogo completo como sexta ficha simétrica */}
          <Link
            href="/herramientas"
            className="group flex flex-col justify-between rounded-xl border border-slate-900 bg-slate-900 p-4 text-white shadow-2xs transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-white">
                    Catálogo completo
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-white/90 rounded-md bg-white/10 px-2 py-0.5">
                  {totalTools}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                Buscador en tiempo real, filtros por tipo y ordenamiento alfabético.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-white/90 group-hover:text-white">
              <span>Abrir todas</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        {/* Puente honesto a PlayComun Pro */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            ¿Querés emitir comprobantes con tu logo y guardar historial en la nube?
          </span>
          <Link
            href="/planes"
            className="font-semibold text-brand hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Conocé las funciones de PlayComun Pro
          </Link>
        </div>

      </div>
    </section>
  )
}
