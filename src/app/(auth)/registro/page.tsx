import Link from "next/link"
import { signup } from "../actions"
import { SubmitButton } from "../submit-button"

export default async function RegisterPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="max-w-sm mx-auto w-full">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
        Creá tu cuenta gratis
      </h1>
      <p className="text-foreground-muted mb-6 text-sm">
        Guardá tus herramientas favoritas y usalas desde cualquier dispositivo.
      </p>

      {searchParams?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">
          {searchParams.error}
        </div>
      )}


      <form action={signup} className="space-y-4">
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

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground block">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground block">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repetí tu contraseña"
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-start gap-3 py-2">
          <div className="flex h-5 items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/20"
            />
          </div>
          <label htmlFor="terms" className="text-sm text-foreground-muted leading-tight">
            Acepto los <Link href="/terminos" className="text-brand hover:underline">términos y condiciones</Link> y la <Link href="/privacidad" className="text-brand hover:underline">política de privacidad</Link>.
          </label>
        </div>

        <SubmitButton pendingText="Creando cuenta...">
          Crear cuenta
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-6">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="text-brand hover:text-brand-hover transition-colors">
          Ingresá
        </Link>
      </p>
    </div>
  )
}
