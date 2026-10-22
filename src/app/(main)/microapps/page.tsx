import type { Metadata } from 'next'
import Link from 'next/link'
import { microapps } from '@/data/microapps'
import {
  ArrowRight,
  BookOpen,
  Wheat,
  Layers,
  Flame,
  Scale,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'

export const metadata: Metadata = {
  title: 'Catálogo de Microapps · PlayComun Online',
  description:
    'Explorá las aplicaciones independientes de PlayComun Online: entornos profesionales diseñados para flujos de trabajo especializados con persistencia en la nube.',
  alternates: {
    canonical: '/microapps',
  },
}

export default function MicroappsPage() {
  const cocinaPro = microapps.find((app) => app.id === 'cocina-pro') || microapps[0]

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-5 sm:pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Encabezado editorial del catálogo */}
        <header className="border-b border-slate-200/80 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              PlayComun Online
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-brand">Suites Especializadas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catálogo de Microapps
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Aplicaciones completas con espacio de trabajo dedicado, persistencia en la nube y herramientas avanzadas para optimizar tareas profesionales complejas.
          </p>
        </header>

        {/* Ficha principal de producto: Amasia */}
        <section aria-label="Microapp destacada: Amasia">
          <article className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
            {/* Cabecera de la ficha */}
            <div className="p-6 sm:p-8 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 shrink-0 flex items-center justify-center">
                    <AmasiaLogo variant="symbol" className="h-14 w-14" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {cocinaPro.name}
                      </h2>
                      <span className="text-xs font-medium text-slate-500">
                        Gestión gastronómica
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {cocinaPro.audience}
                    </p>
                  </div>
                </div>

                <Link
                  href={cocinaPro.url}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px] shrink-0 active:scale-[0.98]"
                >
                  <span>Abrir Amasia</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-700 leading-relaxed max-w-3xl">
                {cocinaPro.description}
              </p>

              {/* Atajos directos a módulos de trabajo */}
              <div className="mt-5 flex items-center gap-2 flex-wrap pt-4 border-t border-slate-100/80 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Acceso directo:</span>
                <Link
                  href="/cocina-pro/recetas"
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60 inline-flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-brand" />
                  <span>Recetario</span>
                </Link>
                <Link
                  href="/cocina-pro/panaderia"
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Wheat className="h-3.5 w-3.5 text-amber-600" />
                  <span>Panadería</span>
                </Link>
                <Link
                  href="/cocina-pro/ingredientes"
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="h-3.5 w-3.5 text-brand" />
                  <span>Ingredientes</span>
                </Link>
              </div>
            </div>

            {/* Capacidades operativas incluidas */}
            <div className="p-6 sm:p-8 bg-slate-50/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Herramientas y capacidades incluidas en la suite
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-brand shrink-0" strokeWidth={1.75} />
                    <h4 className="text-xs font-bold text-slate-900">
                      Recetario profesional y subrecetas
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Costeo técnico en tiempo real con mermas, rendimientos, composición recursiva y márgenes de ganancia.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="h-4 w-4 text-brand shrink-0" strokeWidth={1.75} />
                    <h4 className="text-xs font-bold text-slate-900">
                      Escalado gastronómico y adaptación de moldes
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Conversión por factores de volumen, peso de masa objetivo y cambio geométrico de moldes redondos y rectangulares.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-1">
                    <Wheat className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
                    <h4 className="text-xs font-bold text-slate-900">
                      Calculadora panadera especializada
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Fórmulas con base de harina al 100 %, cálculo de hidratación tradicional y balance de líquidos con prefermentos.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
                    <h4 className="text-xs font-bold text-slate-900">
                      Modo de elaboración en cocina y fichas PDF
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Instrucciones legibles a distancia con cronómetro integrado y exportación técnica descargable en PDF.
                  </p>
                </div>
              </div>

              {/* Especificaciones técnicas limpias */}
              <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Persistencia en la nube (Supabase)</span>
                  </span>
                  <span>•</span>
                  <span>Exportación PDF lista para imprimir</span>
                  <span>•</span>
                  <span>Instalable como PWA</span>
                </div>
                <Link
                  href={cocinaPro.url}
                  className="font-semibold text-brand hover:underline inline-flex items-center gap-1"
                >
                  <span>Ingresar a la app</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </article>
        </section>

        {/* Transición limpia hacia herramientas individuales */}
        <section
          aria-label="Herramientas individuales"
          className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              ¿Buscás una calculadora puntual?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Las microapps son suites especializadas. Si necesitás calcular costos de recetas individuales, presupuestos o porcentajes rápidos, consultá el catálogo general.
            </p>
          </div>
          <Link
            href="/herramientas"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors shrink-0 min-h-[40px]"
          >
            <span>Ver calculadoras individuales</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  )
}

