import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="max-w-sm mx-auto w-full flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-6">
        <Mail className="w-8 h-8 text-brand" />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
        Revisá tu email
      </h1>
      <p className="text-foreground-muted mb-8 text-sm leading-relaxed">
        Te enviamos un enlace para ingresar. Abrilo para continuar. Si no lo ves, mirá en spam.
      </p>

      <button className="w-full border border-gray-200 hover:bg-gray-50 text-foreground py-3 rounded-xl font-medium transition-colors mb-6 active:scale-[0.98]">
        Reenviar email
      </button>

      <Link 
        href="/ingresar" 
        className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
      >
        Usar otro email
      </Link>
    </div>
  )
}
