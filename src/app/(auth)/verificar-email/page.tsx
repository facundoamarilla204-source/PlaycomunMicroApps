import Link from "next/link"
import { Mail } from "lucide-react"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "Verificar correo",
  path: "/verificar-email",
  noindex: true,
})

export default function VerifyEmailPage() {
  return (
    <div className="max-w-sm mx-auto w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mb-5 border border-purple-100">
        <Mail className="w-7 h-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Revisá tu correo
      </h1>
      <p className="text-slate-600 mb-8 text-xs sm:text-sm leading-relaxed">
        Te enviamos un enlace de confirmación. Hacé clic en el enlace para ingresar a tu cuenta. Si no lo encontrás en unos minutos, revisá la carpeta de correo no deseado o spam.
      </p>

      <div className="w-full space-y-3">
        <Link 
          href="/ingresar" 
          className="w-full min-h-[44px] bg-brand hover:bg-brand-hover active:bg-brand-active text-white rounded-xl font-semibold text-sm transition-colors shadow-xs flex items-center justify-center"
        >
          Volver a iniciar sesión
        </Link>
        <Link 
          href="/registro" 
          className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center"
        >
          Registrarme con otro correo
        </Link>
      </div>
    </div>
  )
}
