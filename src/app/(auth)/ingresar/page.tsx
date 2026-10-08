import Link from "next/link"
import { login } from "../actions"
import { SubmitButton } from "../submit-button"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="max-w-sm mx-auto w-full">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
        Ingresá a tu cuenta
      </h1>
      <p className="text-foreground-muted mb-6 text-sm">
        Guardá tus herramientas favoritas y usalas desde cualquier dispositivo.
      </p>

      {searchParams?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">
          {searchParams.error}
        </div>
      )}


      <form action={login} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground block">
              Contraseña
            </label>
            <Link 
              href="/recuperar"
              className="text-sm text-brand hover:text-brand-hover transition-colors"
            >
              Olvidé mi contraseña
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
          />
        </div>

        <SubmitButton pendingText="Ingresando...">
          Ingresar
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-6">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-brand hover:text-brand-hover transition-colors">
          Creá una gratis
        </Link>
      </p>
    </div>
  )
}
