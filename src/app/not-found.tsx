import Link from "next/link"
import { Search } from "lucide-react"

export const metadata = {
  title: "Página no encontrada",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center py-12 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-9xl font-extrabold text-brand/20 mb-4 tracking-tighter">
          404
        </h1>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          Che, no encontramos esa página
        </h2>
        <p className="text-lg text-slate-500 mb-12 max-w-lg mx-auto">
          Capaz escribiste mal la dirección o la herramienta ya no existe. Pero no te preocupes, tenemos un montón de otras opciones.
        </p>

        <div className="bg-white border border-border/60 rounded-3xl p-8 shadow-sm mb-8">
          <form action="/herramientas" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 text-left">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="Buscar una herramienta..."
                className="w-full rounded-xl border border-border/60 bg-slate-50 py-3.5 pl-12 pr-4 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button 
              type="submit"
              className="rounded-xl bg-brand px-8 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="text-brand font-semibold hover:text-brand-hover underline-offset-4 hover:underline transition-all">
            Volver al inicio
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/herramientas" className="text-brand font-semibold hover:text-brand-hover underline-offset-4 hover:underline transition-all">
            Ver todas las herramientas
          </Link>
        </div>
      </div>
    </div>
  )
}
