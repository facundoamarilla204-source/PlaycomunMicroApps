import Link from "next/link"
import { signup } from "../actions"
import { SubmitButton } from "../submit-button"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "Crear cuenta gratis",
  description: "Registrate gratis en PlayComun Herramientas para guardar tus aplicaciones favoritas y recetas.",
  path: "/registro",
})

export default async function RegisterPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="max-w-sm mx-auto w-full">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Creá tu cuenta gratis
      </h1>
      <p className="text-slate-500 mb-6 text-xs sm:text-sm font-medium">
        Guardá tus herramientas favoritas y usalas desde cualquier dispositivo.
      </p>

      {searchParams?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl mb-6 text-xs sm:text-sm font-medium">
          {searchParams.error}
        </div>
      )}

      <form action={signup} className="space-y-4">
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
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 text-sm font-medium text-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repetí tu contraseña"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 text-sm font-medium text-slate-900"
          />
        </div>

        <div className="flex items-start gap-3 py-1.5">
          <div className="flex h-5 items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500/20"
            />
          </div>
          <label htmlFor="terms" className="text-xs text-slate-500 leading-tight">
            Acepto los <Link href="/terminos" className="text-purple-700 font-semibold hover:underline">términos y condiciones</Link> y la <Link href="/privacidad" className="text-purple-700 font-semibold hover:underline">política de privacidad</Link>.
          </label>
        </div>

        <SubmitButton pendingText="Creando cuenta...">
          Crear cuenta gratuita
        </SubmitButton>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6 font-medium">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="text-purple-700 hover:text-purple-800 font-bold transition-colors">
          Ingresá acá
        </Link>
      </p>
    </div>
  )
}
