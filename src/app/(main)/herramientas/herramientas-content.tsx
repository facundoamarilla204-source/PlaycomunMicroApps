"use client"

import ToolGrid from "@/components/home/ToolGrid"

export default function HerramientasContent({ userFavorites = [] }: { userFavorites?: string[] }) {
  return (
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explorar herramientas
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
          Calculadoras comerciales, conversores, generadores y utilidades diseñadas para resolver tareas del día a día.
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
