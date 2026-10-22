'use client'

import { PlanComparison } from "@/components/subscription/PlanComparison"

interface PlanesClientProps {
  isAuthenticated: boolean
  isPro: boolean
  priceMensual: number
  priceAnual: number
}

export default function PlanesClient({ 
  isAuthenticated, 
  isPro, 
  priceMensual, 
  priceAnual 
}: PlanesClientProps) {
  return (
    <div className="min-h-screen bg-[#fcfcfd] py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col items-center text-center gap-3 mb-10 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
            Planes y Precios
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-normal tracking-normal text-slate-900">
            Herramientas para tu trabajo diario
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Comenzá gratis con utilidades y calculadoras libres, o elegí PlayComun Pro para guardar tu información en la nube y personalizar tus documentos comerciales.
          </p>
        </header>

        <PlanComparison 
          isAuthenticated={isAuthenticated}
          isPro={isPro}
          priceMensual={priceMensual}
          priceAnual={priceAnual}
          mode="landing"
        />
      </div>
    </div>
  )
}
