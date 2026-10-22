"use client"

import ToolGrid from "@/components/home/ToolGrid"

export default function HerramientasContent({ userFavorites = [] }: { userFavorites?: string[] }) {
  return (
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
          Catálogo completo • PlayComun Online
        </span>
        <h1 className="font-display text-2xl sm:text-4xl font-normal text-slate-900 tracking-normal">
          Todas las calculadoras y <span className="text-brand">herramientas web</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Calculá precios de venta, costos de recetas, cuotas e IVA. Generá presupuestos y editá archivos directo en tu navegador, gratis y sin registrarte.
        </p>
      </div>
      <ToolGrid 
        userFavorites={userFavorites} 
        showSearch={true}
        showTypeFilter={true}
      />
    </div>
  )
}
