"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { CheckCircle2, Calculator, QrCode, Banknote, LogOut, ChevronRight, User, ShieldCheck, CreditCard, Settings, LayoutDashboard, Trash2, AlertTriangle, X, Loader2 } from "lucide-react"
import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"
import { deleteUserAccount } from "./actions"

export default function CuentaClient({ email, name, initial, logoutAction, updateAction, favorites = [], isPro = false }: { email: string, name: string, initial: string, logoutAction: any, updateAction: any, favorites?: any[], isPro?: boolean }) {
  const [isHoveringPlan, setIsHoveringPlan] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get("error")
  const successMsg = searchParams.get("success")
  const [updateState, formAction, isPending] = useActionState(async (state: any, formData: FormData) => {
    await updateAction(formData)
  }, null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  } as any

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] relative overflow-hidden pb-20 pt-8">
      {/* Eliminado: Decorative background blobs */}

      <motion.div 
        className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Profile */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
          <div className="relative group">
            <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-brand text-4xl font-black shadow-sm overflow-hidden">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {initial}
              </motion.div>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.5, bounce: 0.5 }}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center text-green-500"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </motion.div>
          </div>
          <div className="pb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
              Hola, {name || email.split("@")[0]}
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Cuenta verificada • {email}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Herramientas Favoritas */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-8 shadow-sm relative overflow-hidden group">
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Accesos rápidos</h2>
                </div>
                <Link href="/favoritas" className="text-sm font-semibold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors group/link">
                  Ver todas
                  <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              {favorites.length === 0 ? (
                <div className="text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium mb-3">Aún no agregaste favoritas.</p>
                  <Link href="/herramientas" className="text-brand font-semibold hover:underline text-sm">
                    Explorar catálogo
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.slice(0, 4).map((tool, i) => {
                    return (
                      <Link key={i} href={`${tool.customUrl || `/herramientas/${tool.slug}`}`} className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-brand/5 border border-transparent hover:border-brand/10 transition-all duration-300 group/card">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover/card:text-brand group-hover/card:scale-110 transition-all duration-300">
                          {/* If you have dynamic icons mapped, use them here. Using generic for now */}
                          <Calculator className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-700 group-hover/card:text-slate-900">
                          {tool.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Datos Personales */}
            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Configuración de perfil</h2>
              </div>
              
              <form action={formAction} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-bold text-slate-500 ml-1">
                    Nombre completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={name}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 font-semibold text-slate-900 text-sm"
                  />
                  {errorMsg && <p className="text-rose-600 text-xs mt-1 font-medium">{errorMsg}</p>}
                  {successMsg && <p className="text-emerald-600 text-xs mt-1 font-medium">{successMsg}</p>}
                </div>

                <div className="pt-1">
                  <button 
                    disabled={isPending}
                    type="submit" 
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm min-h-[44px]"
                  >
                    {isPending ? "Guardando..." : "Actualizar perfil"}
                  </button>
                </div>
              </form>
            </motion.div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Plan Info Premium Card */}
            <motion.div 
              variants={itemVariants} 
              onMouseEnter={() => setIsHoveringPlan(true)}
              onMouseLeave={() => setIsHoveringPlan(false)}
              className="relative rounded-2xl p-6 sm:p-7 text-white overflow-hidden shadow-md bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800"
            >
              <div className="relative z-10 flex flex-col h-full min-h-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-300" />
                    <span className="text-purple-300 font-bold text-xs tracking-wider uppercase">Suscripción actual</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                    isPro ? 'bg-purple-900/60 text-purple-200 border-purple-700/50' : 'bg-white/10 text-white border-white/20'
                  }`}>
                    {isPro ? 'Pro' : 'Gratis'}
                  </span>
                </div>
                
                <div className="mt-5 mb-6">
                  <h3 className="text-2xl font-black mb-1.5 tracking-tight">{isPro ? 'Plan PlayComun Pro' : 'Plan Básico Gratuito'}</h3>
                  <p className="text-slate-300 font-medium leading-relaxed text-xs sm:text-sm">
                    {isPro 
                      ? 'Acceso total sin publicidad, planchas de QR dinámicos y personalización de marca desbloqueadas.' 
                      : 'Acceso ilimitado a todas las herramientas gratuitas. Actualizá a Pro para funciones avanzadas sin publicidad.'}
                  </p>
                </div>
                
                <Link 
                  href={isPro ? "/cuenta/suscripcion" : "/planes"}
                  className="mt-auto flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm min-h-[44px]"
                >
                  {isPro ? "Gestionar suscripción" : "Mejorar a Pro"}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Seguridad */}
            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-sm group relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Preferencias</h2>
              </div>
              
              <div className="space-y-2">
                <Link href="/cuenta/suscripcion" className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-slate-50 transition-colors group/btn">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover/btn:bg-white group-hover/btn:shadow-sm transition-all">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-800">Pagos y suscripción</div>
                    <div className="text-xs font-medium text-slate-500">Gestionar mis métodos de pago</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover/btn:text-slate-800 transition-colors" />
                </Link>
                <Link href="/recuperar" className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-slate-50 transition-colors group/btn">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover/btn:bg-white group-hover/btn:shadow-sm transition-all">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-800">Contraseña</div>
                    <div className="text-xs font-medium text-slate-500">Actualizar tu clave</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover/btn:text-slate-800 transition-colors" />
                </Link>
                
                <form action={logoutAction}>
                  <button className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-slate-50 transition-colors group/btn">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover/btn:bg-slate-200 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-slate-700">Cerrar sesión</div>
                    </div>
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmInput("")
                      setDeleteError(null)
                      setShowDeleteModal(true)
                    }}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-red-50/60 transition-colors group/btn text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover/btn:bg-red-100 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-red-600 text-sm">Eliminar cuenta</div>
                      <div className="text-[11px] text-slate-400">Supresión definitiva de usuario</div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* Modal de confirmación para Eliminación de Cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              ¿Eliminar tu cuenta definitivamente?
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Esta acción es irreversible conforme a tu derecho de supresión (Ley 25.326). Se eliminarán tus credenciales de inicio de sesión, perfil y herramientas guardadas.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5 mb-6">
              <p className="font-bold text-amber-950">Consecuencias de la eliminación:</p>
              <p>• Si tenés una suscripción Pro activa, se cancelará la renovación automática en Mercado Pago para evitar nuevos cobros.</p>
              <p>• Los comprobantes de pago de períodos pasados se conservan disociados para dar cumplimiento a exigencias fiscales y contables obligatorias.</p>
            </div>

            <div className="space-y-2 mb-6">
              <label htmlFor="confirmInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Para confirmar, escribí <span className="text-red-600 font-mono">ELIMINAR</span> a continuación:
              </label>
              <input
                id="confirmInput"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-bold tracking-wider"
              />
            </div>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-colors min-h-[44px]"
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
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Confirmar y eliminar mi cuenta</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
