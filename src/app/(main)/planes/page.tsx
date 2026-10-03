import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Planes | PlayComun",
  description: "Conocé nuestros planes y precios",
}

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] py-12 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Planes y Precios
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            Herramientas gratuitas para siempre. Funciones avanzadas para quienes necesitan más.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Gratuito */}
          <div className="bg-white border border-border/60 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Gratis</h2>
            <p className="text-slate-500 mb-6">Para uso casual y herramientas básicas.</p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-slate-900">$0</span>
              <span className="text-slate-500 font-medium">/mes</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              {['Acceso a herramientas gratuitas', 'Guardar favoritas', 'Uso limitado diario'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link 
              href="/registro"
              className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-4 rounded-xl font-bold transition-colors"
            >
              Crear cuenta gratis
            </Link>
          </div>

          {/* Plan Pro */}
          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Recomendado
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
            <p className="text-slate-400 mb-6">Para profesionales y uso intensivo.</p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-white">Próximamente</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              {['Acceso a herramientas premium', 'Límites ampliados', 'Soporte prioritario', 'Sin anuncios'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              disabled
              className="block w-full text-center bg-white/10 text-white/50 px-6 py-4 rounded-xl font-bold cursor-not-allowed"
            >
              No disponible aún
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
