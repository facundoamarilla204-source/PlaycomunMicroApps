import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { resetPassword } from "../actions"
import { SubmitButton } from "../submit-button"

export default async function RecoverPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="max-w-sm mx-auto w-full">
      <Link 
        href="/ingresar" 
        className="text-sm text-brand hover:text-brand-hover inline-flex items-center gap-2 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a ingresar
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
        Recuperá tu contraseña
      </h1>
      <p className="text-foreground-muted mb-8 text-sm leading-relaxed">
        Ingresá tu email y te enviamos un enlace para crear una nueva.
      </p>

      {searchParams?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">
          {searchParams.error}
        </div>
      )}

      <form action={resetPassword} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="nombre@email.com"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
          />
        </div>

        <SubmitButton pendingText="Enviando...">
          Enviar enlace
        </SubmitButton>
      </form>
    </div>
  )
}
