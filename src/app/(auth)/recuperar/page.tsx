import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { resetPassword } from "../actions"
import { SubmitButton } from "../submit-button"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "Recuperar contraseña",
  path: "/recuperar",
  noindex: true,
})

export default async function RecoverPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="max-w-sm mx-auto w-full">
      <Link 
        href="/ingresar" 
        className="text-xs font-semibold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1.5 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver a ingresar</span>
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Recuperá tu contraseña
      </h1>
      <p className="text-slate-500 mb-6 text-xs sm:text-sm font-medium leading-relaxed">
        Ingresá tu correo electrónico y te enviaremos un enlace seguro para restablecerla.
      </p>

      {searchParams?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl mb-6 text-xs sm:text-sm font-medium">
          {searchParams.error}
        </div>
      )}

      <form action={resetPassword} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 text-sm font-medium text-slate-900"
          />
        </div>

        <SubmitButton pendingText="Enviando...">
          Enviar enlace de recuperación
        </SubmitButton>
      </form>
    </div>
  )
}
