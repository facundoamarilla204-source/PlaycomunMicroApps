export default function CocinaProLoading() {
  return (
    <div
      aria-label="Cargando módulo de Amasia..."
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse"
    >
      {/* Cabecera del módulo skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-purple-100 rounded-md" />
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          <div className="h-10 w-32 bg-purple-200 rounded-xl" />
        </div>
      </div>

      {/* Tarjetas métricas skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-24 bg-slate-300 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Contenido / Tabla skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-9 w-48 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-3 border-b border-slate-100/80"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
