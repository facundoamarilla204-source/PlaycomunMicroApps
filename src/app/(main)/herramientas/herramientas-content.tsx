"use client"

import ToolGrid from "@/components/home/ToolGrid"

export default function HerramientasContent({ userFavorites = [] }: { userFavorites?: string[] }) {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Explorar herramientas
        </h1>
        <p className="mt-2 text-foreground-muted">
          Todas las calculadoras, generadores y utilidades.
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
