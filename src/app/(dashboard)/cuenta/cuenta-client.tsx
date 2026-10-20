"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  LogOut, 
  KeyRound, 
  Trash2, 
  AlertTriangle, 
  X, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  Wrench
} from "lucide-react"
import { AccountNav } from "@/components/account/AccountNav"
import { deleteUserAccount } from "./actions"

interface CuentaClientProps {
  email: string
  name: string
  initial: string
  logoutAction: (formData: FormData) => Promise<void>
  updateAction: (formData: FormData) => Promise<void>
  favorites?: any[]
  isPro?: boolean
}

export default function CuentaClient({
  email,
  name,
  initial,
  logoutAction,
  updateAction,
  favorites = [],
  isPro = false,
}: CuentaClientProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get("error")
  const successMsg = searchParams.get("success")

  const [, formAction, isPending] = useActionState(async (_state: any, formData: FormData) => {
    await updateAction(formData)
  }, null)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full pb-16 pt-2">
      {/* Navegación unificada de la cuenta */}
      <AccountNav isPro={isPro} />

      {/* Encabezado de perfil sobrio y humano */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-xs flex-shrink-0">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {name || email.split("@")[0]}
              </h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isPro
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isPro ? "Pro" : "Básico"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cuenta/suscripcion"
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver suscripción</span>
          </Link>
        </div>
      </header>

      {/* Contenido principal en dos columnas balanceadas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Perfil y Accesos rápidos */}
        <div className="md:col-span-7 space-y-8">
          
          {/* Tarjeta: Información personal */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">Datos personales</h2>
              </div>
            </div>

            <form action={formAction} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={name}
                  placeholder="Tu nombre completo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all placeholder:text-slate-400 font-medium"
                />
                {errorMsg && <p className="text-red-600 text-xs mt-1.5 font-medium">{errorMsg}</p>}
                {successMsg && <p className="text-emerald-600 text-xs mt-1.5 font-medium">{successMsg}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-600 text-sm font-medium flex items-center justify-between">
                  <span>{email}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Verificado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  El correo se utiliza para la autenticación y notificaciones de facturación.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white transition-colors min-h-[40px] flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Tarjeta: Accesos rápidos y herramientas favoritas */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">Accesos rápidos</h2>
              </div>
              <Link
                href="/favoritas"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {favorites.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">
                  No tenés herramientas guardadas como favoritas.
                </p>
                <Link
                  href="/herramientas"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                >
                  <span>Explorar herramientas disponibles</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.slice(0, 4).map((tool, index) => (
                  <Link
                    key={index}
                    href={tool.customUrl || `/herramientas/${tool.slug}`}
                    className="p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {tool.category || "Herramienta"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                      {tool.name}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Columna Derecha: Plan de suscripción y Seguridad */}
        <div className="md:col-span-5 space-y-8">
          
          {/* Tarjeta: Resumen de Suscripción */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Membresía
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isPro
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {isPro ? "Activa" : "Básica"}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {isPro ? "PlayComun Pro" : "Plan Gratuito"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isPro
                  ? "Tenés acceso activo a herramientas avanzadas, sincronización en la nube y exportación a Excel sin límites."
                  : "Acceso libre a calculadoras comerciales, laborales y generadores estándar en PDF."}
              </p>
            </div>

            <Link
              href="/cuenta/suscripcion"
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                isPro
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              }`}
            >
              <span>{isPro ? "Gestionar plan y pagos" : "Conocer funciones Pro"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Tarjeta: Seguridad y Sesión */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 mb-2">Seguridad y acceso</h2>

            <div className="space-y-2">
              <Link
                href="/recuperar"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span className="text-xs sm:text-sm font-semibold">Cambiar contraseña</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors text-slate-700 text-left"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 text-slate-500" />
                    <span className="text-xs sm:text-sm font-semibold">Cerrar sesión</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </form>
            </div>

            {/* Zona de supresión de cuenta (Ley 25.326) */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setConfirmInput("")
                  setDeleteError(null)
                  setShowDeleteModal(true)
                }}
                className="w-full flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar mi cuenta</span>
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Modal de confirmación para Eliminación de Cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1.5">
              ¿Eliminar tu cuenta definitivamente?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Esta acción es permanente conforme a tu derecho de supresión (Ley 25.326). Se eliminarán tus credenciales de acceso, perfil y datos guardados.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1 mb-5">
              <p className="font-semibold text-slate-800">Tené en cuenta:</p>
              <p>• Si tenés una suscripción activa, se cancelará la renovación automática en Mercado Pago.</p>
              <p>• Los comprobantes fiscales ya emitidos se conservan disociados por requerimientos tributarios.</p>
            </div>

            <div className="space-y-1.5 mb-5">
              <label htmlFor="confirmInput" className="block text-xs font-semibold text-slate-700">
                Escribí <span className="text-red-600 font-mono">ELIMINAR</span> para confirmar:
              </label>
              <input
                id="confirmInput"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs font-semibold tracking-wider"
              />
            </div>

            {deleteError && (
              <div className="p-2.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmInput !== "ELIMINAR") return
                  setIsDeleting(true)
                  setDeleteError(null)
                  const res = await deleteUserAccount(confirmInput)
                  if (res?.error) {
                    setDeleteError(res.error)
                    setIsDeleting(false)
                  }
                }}
                disabled={confirmInput !== "ELIMINAR" || isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Confirmar eliminación</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
