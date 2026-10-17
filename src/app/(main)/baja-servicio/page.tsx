import { buildMetadata } from "@/lib/metadata"
import { ShieldX, Scale, Clock, ShieldCheck } from "lucide-react"
import BajaServicioClient from "./BajaServicioClient"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "Botón de baja de servicio: Cancelación de suscripción",
  description: "Canal oficial para solicitar la baja o rescisión de la suscripción PlayComun Pro conforme a la Resolución 271/2020 y Disposición 954/2025.",
  path: "/baja-servicio",
})

export default async function BajaServicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let hasActiveSubscription = false
  let currentPeriodEnd: string | null = null

  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sub) {
      hasActiveSubscription = true
      currentPeriodEnd = sub.current_period_end
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200/80 text-slate-800 mb-4">
            <ShieldX className="w-3.5 h-3.5 text-purple-600" /> Rescisión de Contrataciones
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Botón de baja de servicio
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Mecanismo para solicitar la rescisión de servicios continuados conforme a la Resolución 271/2020 de la Secretaría de Comercio Interior y la Disposición 954/2025.
          </p>
        </div>

        {/* Cliente interactivo con detección de sesión */}
        <BajaServicioClient
          isAuthenticated={!!user}
          userEmail={user?.email || ""}
          hasActiveSubscription={hasActiveSubscription}
          currentPeriodEnd={currentPeriodEnd}
        />

        {/* Términos y garantías de baja */}
        <div className="mt-12 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs text-xs sm:text-sm text-slate-600 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-600" />
            Condiciones aplicables a la baja de servicio
          </h3>
          <ul className="space-y-2 list-disc pl-4 text-slate-600 leading-relaxed">
            <li>
              <strong>Mantenimiento del período pagado:</strong> La cancelación de la renovación automática detiene cobros futuros, manteniendo el acceso a PlayComun Pro hasta el último día del ciclo que ya tenés abonado.
            </li>
            <li>
              <strong>Constancia de registro:</strong> En los términos de la Disposición 954/2025, el sistema emite un código de trámite para verificar el estado de la solicitud.
            </li>
            <li>
              <strong>Preservación de documentos:</strong> La baja de Pro no elimina tus recetas, cotizaciones, listas de precios ni códigos QR guardados. Quedarán en tu cuenta y podrás reactivar Pro cuando lo desees.
            </li>
            <li>
              <strong>Eliminación de cuenta independiente:</strong> Si en lugar de la baja de suscripción deseás la supresión definitiva de tu perfil y cuenta de usuario, dicho trámite se realiza de forma separada desde la configuración de <Link href="/cuenta" className="text-purple-600 font-semibold hover:underline">Mi Cuenta</Link>.
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Para dudas adicionales sobre suscripciones:</span>
            <div className="flex gap-4">
              <Link href="/terminos" className="text-purple-600 font-semibold hover:underline">
                Términos y condiciones
              </Link>
              <Link href="/contacto" className="text-purple-600 font-semibold hover:underline">
                Soporte y contacto
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
