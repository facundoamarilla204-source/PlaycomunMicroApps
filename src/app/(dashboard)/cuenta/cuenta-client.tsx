"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { CheckCircle2, Calculator, QrCode, Banknote, LogOut, ChevronRight, User, ShieldCheck, CreditCard, Settings, LayoutDashboard } from "lucide-react"
import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function CuentaClient({ email, name, initial, logoutAction, updateAction, favorites = [], isPro = false }: { email: string, name: string, initial: string, logoutAction: any, updateAction: any, favorites?: any[], isPro?: boolean }) {
  const [isHoveringPlan, setIsHoveringPlan] = useState(false)
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
  }

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] relative overflow-hidden pb-20 pt-8">
      {/* Decorative background blobs to give glassmorphism something to blur */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div 
        className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Profile */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/10 flex items-center justify-center text-brand text-4xl font-black shadow-sm overflow-hidden">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {initial}
              </motion.div>
              {/* Shine effect on hover */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
              />
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
            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
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
                      <Link key={i} href={`/herramientas/${tool.slug}`} className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-brand/5 border border-transparent hover:border-brand/10 transition-all duration-300 group/card">
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
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 transition-all placeholder:text-slate-400 font-semibold text-slate-800 bg-white shadow-sm hover:border-slate-200"
                  />
                  {errorMsg && <p className="text-red-500 text-sm ml-1">{errorMsg}</p>}
                  {successMsg && <p className="text-green-600 text-sm ml-1 font-medium">{successMsg}</p>}
                </div>

                <div className="pt-2">
                  <button 
                    disabled={isPending}
                    type="submit" 
                    className="bg-slate-900 hover:bg-brand disabled:bg-slate-400 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
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
              className="relative rounded-2xl p-8 text-white overflow-hidden group cursor-pointer shadow-md"
            >
              {/* Dynamic Glow Breathing Background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-[#7b2cbf] via-[#9d4edd] to-[#5a189a]"
                animate={{
                  background: isHoveringPlan 
                    ? "linear-gradient(to bottom right, #5a189a, #9d4edd, #7b2cbf)" 
                    : "linear-gradient(to bottom right, #7b2cbf, #9d4edd, #5a189a)",
                }}
                transition={{ duration: 1 }}
              />
              
              {/* Animated particles/blobs */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl mix-blend-overlay pointer-events-none" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/30 rounded-full blur-2xl mix-blend-overlay pointer-events-none" 
              />
              
              <div className="relative z-10 flex flex-col h-full min-h-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-white/80" />
                    <span className="text-white/80 font-medium text-sm tracking-wide uppercase">Suscripción actual</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest shadow-inner border border-white/10 ${isPro ? 'text-amber-300 border-amber-300/30' : ''}`}>
                    {isPro ? 'Pro' : 'Gratis'}
                  </span>
                </div>
                
                <div className="mt-6 mb-8">
                  <h3 className="text-3xl font-black mb-2 tracking-tight">{isPro ? 'Plan Pro' : 'Plan Básico'}</h3>
                  <p className="text-white/80 font-medium leading-relaxed text-sm">
                    {isPro 
                      ? 'Acceso total a todas las herramientas, sin publicidad y con funcionalidades premium desbloqueadas.' 
                      : 'Acceso a herramientas esenciales para arrancar. Mejorá a Premium para desbloquear todo el potencial.'}
                  </p>
                </div>
                
                <Link 
                  href={isPro ? "/cuenta/suscripcion" : "/planes"}
                  className="mt-auto flex items-center justify-center gap-2 w-full bg-white text-[#7b2cbf] hover:bg-slate-50 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
                >
                  {isPro ? "Gestionar suscripción" : "Mejorar plan"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  <button className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-red-50/50 transition-colors group/btn">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover/btn:bg-red-100 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-red-600">Cerrar sesión</div>
                    </div>
                  </button>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  )
}
