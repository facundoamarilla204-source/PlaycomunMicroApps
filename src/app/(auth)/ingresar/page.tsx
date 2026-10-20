import Link from "next/link"
import { login } from "../actions"
import { SubmitButton } from "../submit-button"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "Iniciar sesión",
  description: "Ingresá a tu cuenta de PlayComun Herramientas para acceder a tus aplicaciones y funciones guardadas.",
  path: "/ingresar",
})

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="max-w-sm mx-auto w-full">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Ingresá a tu cuenta
      </h1>
      <p className="text-slate-500 mb-6 text-xs sm:text-sm font-medium">
        Accedé a tus herramientas favoritas desde cualquier dispositivo.
      </p>

      {searchParams?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl mb-6 text-xs sm:text-sm font-medium">
          {searchParams.error}
        </div>
      )}

      <form action={login} className="space-y-4">
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Contraseña
            </label>
            <Link 
              href="/recuperar"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 transition-colors"
            >
              ¿Olvidaste tu clave?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 text-sm font-medium text-slate-900"
          />
        </div>

        <SubmitButton pendingText="Ingresando...">
          Iniciar Sesión
        </SubmitButton>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6 font-medium">
        ¿Aún no tenés cuenta?{" "}
        <Link href="/registro" className="text-purple-700 hover:text-purple-800 font-bold transition-colors">
          Creá tu cuenta
        </Link>
      </p>
    </div>
  )
}
